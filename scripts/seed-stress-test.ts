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

const ROLES = [
  "Sales", "Sales Manager", "Institutional Sales Manager", "Network Manager", "Sales Executive", "Delivery Executive",
  "Service Manager", "Service Advisor", "Spare Parts Supervisor", "Technician", "Cashier", "Billing Executive"
];

const STATUSES = ["pending", "rejected", "interested", "inprocess"];

function generateRandomPhone() {
  return Math.floor(6000000000 + Math.random() * 4000000000).toString();
}

function generateMockApplicant(idSuffix: string) {
  const firstName = ["Amit", "Suresh", "Ramesh", "Priya", "Anjali", "Vikram", "Rahul", "Sneha"][Math.floor(Math.random() * 8)];
  const lastName = ["Kumar", "Sharma", "Verma", "Patel", "Singh", "Gupta", "Das", "Joshi"][Math.floor(Math.random() * 8)];
  const fullName = `${firstName} ${lastName} ${idSuffix}`;
  const phone = generateRandomPhone();
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${idSuffix}@example.com`;
  const position = ROLES[Math.floor(Math.random() * ROLES.length)];
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const createdTime = new Date().toISOString();
  const updatedArr = JSON.stringify([`${createdTime}|System Stress Test`]);

  return [
    createdTime,
    position,
    fullName,
    phone,
    email,
    status,
    "Generated for performance testing | STRESS_TEST",
    updatedArr
  ];
}

async function seed(count: number) {
  console.log(`🚀 Starting seed of ${count} records into ${TAB_NAME}...`);
  
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(generateMockApplicant(String(Date.now() + i)));
    if (i % 500 === 0 && i > 0) console.log(`Generated ${i} rows...`);
  }

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:H`,
      valueInputOption: "RAW",
      requestBody: {
        values: rows,
      },
    });

    console.log(`✅ Successfully added ${count} records.`);
    console.log(`Updated range: ${response.data.updates?.updatedRange}`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

const count = parseInt(process.argv[2]) || 1000;
seed(count);
