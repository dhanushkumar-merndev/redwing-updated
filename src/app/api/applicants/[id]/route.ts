import { NextRequest, NextResponse } from "next/server";
import { sheets, SHEET_ID, TAB_NAME } from "@/lib/sheets";
import { rateLimit } from "@/lib/rateLimit";
import { APPLICANT_STATUSES, type ApplicantStatus, type Role } from "@/types";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const rowNumber = parseInt(id, 10) + 1; // Map ID 1 -> Row 2
  if (isNaN(rowNumber) || rowNumber < 2) {
    return NextResponse.json({ error: "Invalid applicant ID" }, { status: 400 });
  }

  try {
    // Read existing row
    const range = `${TAB_NAME}!A${rowNumber}:H${rowNumber}`;
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });

    const row = existing.data.values?.[0];
    if (!row) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;

    const position = String(row[1] ?? "");
    const fullName = String(row[2] ?? "").trim();
    const phone = String(row[3] ?? "").trim();
    const email = String(row[4] ?? "").trim();
    const status = body.status !== undefined
      ? (String(body.status).trim() as ApplicantStatus)
      : (String(row[5] ?? "pending").trim() as ApplicantStatus);
    const feedback = body.feedback !== undefined
      ? String(body.feedback).trim()
      : String(row[6] ?? "").trim();

    // Validation
    const errors: string[] = [];
    if (!APPLICANT_STATUSES.includes(status)) errors.push("status is invalid");
    if (feedback.length > 300) errors.push("feedback must be 300 characters or less");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Parse updated array, append new date|user
    let updatedArr: string[] = [];
    try {
      const parsed: unknown = JSON.parse(String(row[7] ?? "[]"));
      if (Array.isArray(parsed)) {
        updatedArr = parsed.map(String);
      }
    } catch {
      updatedArr = [];
    }
    
    const user = body.user ? String(body.user) : "Unknown";
    updatedArr.push(`${new Date().toISOString()}|${user}`);
    const updatedStr = JSON.stringify(updatedArr);

    // Only update columns F-H (status, feedback, updated)
    // Columns A-E are controlled by ARRAYFORMULA — do NOT overwrite
    const updateRange = `${TAB_NAME}!F${rowNumber}:H${rowNumber}`;
    const updatedRow = [
      status,
      feedback,
      updatedStr,
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: updateRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [updatedRow],
      },
    });

    return NextResponse.json({
      applicant: {
        id,
        created_time: String(row[0] ?? ""),
        position: position as Role,
        full_name: fullName,
        phone,
        email,
        status,
        feedback,
        updated: updatedArr,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
