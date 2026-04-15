import { NextRequest, NextResponse } from "next/server";
import { sheets, SHEET_ID, TAB_RANGE } from "@/lib/sheets";
import { mapRow } from "@/lib/mapRow";
import { rateLimit } from "@/lib/rateLimit";
import type { Applicant, ApplicantStatus } from "@/types";

export const dynamic = "force-dynamic";

export interface AnalyticsEntry {
  id: string;
  createdDate: string;   // YYYY-MM-DD (fixed creation)
  completedDate: string | null; // YYYY-MM-DD (last update if not pending)
  role: string;
  status: ApplicantStatus | string;
}

interface AnalyticsResult {
  entries: AnalyticsEntry[];
  stats: { pending: number; interested: number; inprocess: number; rejected: number };
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: TAB_RANGE,
    });

    const rows = response.data.values ?? [];
    const applicants = rows.slice(1)
      .map((row, index) => mapRow(row, index))
      .filter((a): a is Applicant => a !== null);

    const stats = { pending: 0, interested: 0, inprocess: 0, rejected: 0 };
    const entries: AnalyticsEntry[] = [];

    const toDateStr = (date: Date) => {
      const yStr = String(date.getFullYear());
      const mStr = String(date.getMonth() + 1).padStart(2, "0");
      const dStr = String(date.getDate()).padStart(2, "0");
      return `${yStr}-${mStr}-${dStr}`;
    };

    for (const app of applicants) {
      const s = app.status as ApplicantStatus;
      if (s in stats) {
        const statsKey = s as keyof typeof stats;
        stats[statsKey]++;
      }

      // 1. Creation Date (Always fixed)
      const cDate = new Date(app.created_time);
      if (isNaN(cDate.getTime())) continue;
      const createdDateStr = toDateStr(cDate);

      // 2. Completion Date (Last update if not pending)
      let completedDateStr: string | null = null;
      if (s !== "pending" && app.updated.length > 0) {
        const lastEntry = app.updated[app.updated.length - 1];
        const lastTs = lastEntry.split("|")[0]; // Remove user suffix if present
        const lDate = new Date(lastTs);
        if (!isNaN(lDate.getTime())) {
          completedDateStr = toDateStr(lDate);
        }
      }

      entries.push({
        id: app.id,
        createdDate: createdDateStr,
        completedDate: completedDateStr,
        role: app.position,
        status: s,
      });
    }

    const result: AnalyticsResult = { entries, stats };
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ entries: [], stats: { pending: 0, interested: 0, inprocess: 0, rejected: 0 }, error: message }, { status: 200 });
  }
}
