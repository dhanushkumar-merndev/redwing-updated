import { NextRequest, NextResponse } from "next/server";
import { sheets, SHEET_ID, TAB_NAME } from "@/lib/sheets";
import { clearCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rateLimit";
import { ALL_ROLES } from "@/lib/roles";
import type { ApplicantStatus, Role } from "@/types";

const VALID_STATUSES: ApplicantStatus[] = ["pending", "rejected", "interested", "inprocess"];

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const rowNumber = parseInt(id, 10);
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

    // Build updated values from existing row, overriding with body values
    const position = body.position !== undefined ? String(body.position) : String(row[1] ?? "");
    const fullName = body.full_name !== undefined ? String(body.full_name).trim() : String(row[2] ?? "");
    const phone = body.phone !== undefined ? String(body.phone).trim() : String(row[3] ?? "");
    const email = body.email !== undefined ? String(body.email).trim() : String(row[4] ?? "");
    const status = body.status !== undefined ? String(body.status) as ApplicantStatus : String(row[5] ?? "pending") as ApplicantStatus;
    const feedback = body.feedback !== undefined ? String(body.feedback).trim() : String(row[6] ?? "");

    // Validation
    const errors: string[] = [];
    if (!fullName) errors.push("full_name is required");
    if (!/^\d{10}$/.test(phone)) errors.push("phone must be exactly 10 digits");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email is invalid");
    if (!ALL_ROLES.includes(position as Role)) errors.push("position is invalid");
    if (!VALID_STATUSES.includes(status)) errors.push("status is invalid");
    if (feedback.length > 300) errors.push("feedback must be 300 characters or less");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Parse updated array, append new date
    let updatedArr: string[] = [];
    try {
      const parsed: unknown = JSON.parse(String(row[7] ?? "[]"));
      if (Array.isArray(parsed)) {
        updatedArr = parsed.map(String);
      }
    } catch {
      updatedArr = [];
    }
    updatedArr.push(new Date().toISOString());
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

    clearCache();

    return NextResponse.json({
      applicant: {
        id: String(rowNumber),
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
