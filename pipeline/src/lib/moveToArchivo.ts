import type { drive_v3 } from "googleapis";
import { config } from "./config";

/** Drive v3 has no native "move" — add/remove-parents IS the move. */
export async function moveDocToArchivo(
  drive: drive_v3.Drive,
  documentId: string,
): Promise<void> {
  await drive.files.update({
    fileId: documentId,
    addParents: config.driveFolders.archivo,
    removeParents: config.driveFolders.publicar,
    fields: "id, parents",
  });
}
