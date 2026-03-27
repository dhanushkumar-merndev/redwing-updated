import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });
export const SHEET_ID = process.env.SHEET_ID!;
export const TAB_NAME = process.env.TAB_NAME ?? "Applicants";
export const TAB_RANGE = `${TAB_NAME}!A:H`;
