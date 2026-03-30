import { google } from "googleapis";
import * as path from "path";
import * as fs from "fs";

// Manual .env.local parsing
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line: string) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      let value = valueParts.join("=").trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key.trim()] = value;
    }
  });
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SHEET_ID = process.env.SHEET_ID!;
const TAB_NAME = process.env.TAB_NAME || "CRM2";

async function cleanup() {
  console.log(`🧹 Scanning ${TAB_NAME} for stress test data...`);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:H`,
    });

    const rows = response.data.values || [];
    const filteredRows = rows.filter((row, index) => {
      if (index === 0) return true; // keep header
      const feedback = String(row[6] || "");
      return !feedback.includes("STRESS_TEST");
    });

    const removedCount = rows.length - filteredRows.length;
    
    if (removedCount === 0) {
      console.log("✨ No stress test data found. Nothing to cleanup.");
      return;
    }

    console.log(`♻️ Found ${removedCount} stress test records. Overwriting sheet...`);

    // We clear the sheet before writing filtered rows to ensure no leftover data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:H`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:H`,
      valueInputOption: "RAW",
      requestBody: {
        values: filteredRows,
      },
    });

    console.log(`✅ Successfully removed ${removedCount} stress test records.`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

cleanup();
