import { NextRequest, NextResponse } from "next/server";
import { sheets, SHEET_ID, TAB_NAME, TAB_RANGE } from "@/lib/sheets";
import { mapRow } from "@/lib/mapRow";
import { getCache, setCache, clearCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rateLimit";
import { ALL_ROLES } from "@/lib/roles";
import type { Applicant, Role, ApplicantStatus } from "@/types";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip, 10)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const cached = getCache<Applicant[]>("applicants");
  if (cached) {
    return NextResponse.json({ applicants: cached });
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: TAB_RANGE,
    });

    const rows = response.data.values ?? [];
    // Skip header row (index 0), filter out broken rows
    const applicants = rows.slice(1)
      .map((row, index) => {
        try {
          return mapRow(row, index);
        } catch {
          return null;
        }
      })
      .filter((a): a is Applicant => a !== null);

    setCache("applicants", applicants);
    return NextResponse.json({ applicants });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ applicants: [], error: message });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;

    // Validate required fields
    const fullName = String(body.full_name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const position = String(body.position ?? "").trim() as Role;
    const feedback = String(body.feedback ?? "").trim();
    const status = (String(body.status ?? "pending").trim()) as ApplicantStatus;

    const errors: string[] = [];

    if (!fullName) errors.push("full_name is required");
    if (!/^\d{10}$/.test(phone)) errors.push("phone must be exactly 10 digits");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email is invalid");
    if (!ALL_ROLES.includes(position)) errors.push("position is invalid");
    if (feedback.length > 300) errors.push("feedback must be 300 characters or less");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const createdTime = new Date().toISOString();
    const user = body.user ? String(body.user) : "System";
    const updatedArr = JSON.stringify([`${createdTime}|${user}`]);

    const newRow = [createdTime, position, fullName, phone, email, status, feedback, updatedArr];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:H`,
      valueInputOption: "RAW",
      requestBody: {
        values: [newRow],
      },
    });

    clearCache();

    const applicant: Applicant = {
      id: "new",
      created_time: createdTime,
      position,
      full_name: fullName,
      phone,
      email,
      status,
      feedback,
      updated: [createdTime],
    };

    return NextResponse.json({ applicant }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
