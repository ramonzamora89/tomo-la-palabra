import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "node:fs";
import { config } from "./config";

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

export type Turn = {
  speaker: number;
  startSeconds: number;
  timestamp: string; // mm:ss
  text: string;
};

/**
 * Extracts a mono 16kHz audio track from a video file — keeps the file
 * small (cheaper/faster to upload to Deepgram) and, in the GitHub Actions
 * runner, keeps peak disk usage down since the source video can be deleted
 * right after this step (see plan, §6 disk mitigation).
 */
export function extractAudio(videoPath: string, audioOutPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .output(audioOutPath)
      .on("end", () => resolve(audioOutPath))
      .on("error", reject)
      .run();
  });
}

/**
 * Same Deepgram parameters validated in the sibling BID_Cuali project
 * (references/comando-deepgram.md): nova-3, Guatemalan Spanish, diarization
 * and utterance splitting on, smart formatting for punctuation/casing.
 */
export async function callDeepgram(audioPath: string): Promise<any> {
  const audioBuffer = fs.readFileSync(audioPath);
  const params = new URLSearchParams({
    model: "nova-3",
    language: "es-419",
    diarize: "true",
    utterances: "true",
    smart_format: "true",
    punctuate: "true",
  });

  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.deepgramApiKey}`,
      "Content-Type": "audio/wav",
    },
    body: audioBuffer,
  });

  const data = await res.json();
  if (!res.ok || data.err_code) {
    throw new Error(`Deepgram error: ${data.err_msg ?? res.statusText}`);
  }
  return data;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Ports the utterance-merging logic from build_turns.py in
 * limpieza-transcripciones-bam: consecutive utterances from the same
 * speaker collapse into one turn, keeping the turn's real start time.
 */
export function mergeUtterancesIntoTurns(deepgramResponse: any): Turn[] {
  const utterances = deepgramResponse?.results?.utterances ?? [];
  const turns: Turn[] = [];

  for (const utt of utterances) {
    const speaker = utt.speaker ?? 0;
    const text = (utt.transcript ?? "").trim();
    if (!text) continue;

    const last = turns[turns.length - 1];
    if (last && last.speaker === speaker) {
      last.text = `${last.text} ${text}`.trim();
    } else {
      turns.push({
        speaker,
        startSeconds: utt.start,
        timestamp: formatTimestamp(utt.start),
        text,
      });
    }
  }

  return turns;
}

export function turnsToPlainText(turns: Turn[]): string {
  return turns
    .map((t) => `[${t.timestamp}] Hablante ${t.speaker + 1}: ${t.text}`)
    .join("\n");
}
