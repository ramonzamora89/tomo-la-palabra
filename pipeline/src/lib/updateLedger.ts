import type { sheets_v4 } from "googleapis";
import { config } from "./config";

const HEADER = ["fecha", "título", "autor", "link del doc", "link de YouTube", "URL publicada", "estado"];
const RANGE = "A:G";

export async function ensureLedgerHeader(sheets: sheets_v4.Sheets): Promise<void> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.ledgerSheetId,
    range: "A1:G1",
  });
  if (res.data.values && res.data.values.length > 0) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.ledgerSheetId,
    range: "A1:G1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADER] },
  });
}

export async function appendLedgerRow(
  sheets: sheets_v4.Sheets,
  row: {
    fecha: string;
    titulo: string;
    autor: string;
    linkDoc: string;
    linkYoutube: string;
    urlPublicada: string;
    estado: string;
  },
): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.ledgerSheetId,
    range: RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [row.fecha, row.titulo, row.autor, row.linkDoc, row.linkYoutube, row.urlPublicada, row.estado],
      ],
    },
  });
}
