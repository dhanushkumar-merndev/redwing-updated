import { NextRequest, NextResponse } from "next/server";
import { sheets, SHEET_ID, TAB_RANGE } from "@/lib/sheets";
import { mapRow } from "@/lib/mapRow";
import { getCache, setCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rateLimit";
import type { ApplicantStatus } from "@/types";

export interface AnalyticsEntry {
  date: string; // ISO date
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

  const cached = getCache<AnalyticsResult>("analytics-v2");
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: TAB_RANGE,
    });

    const rows = response.data.values ?? [];
    const applicants = rows.slice(1).map((row, index) => mapRow(row, index));

    const stats = { pending: 0, interested: 0, inprocess: 0, rejected: 0 };
    const entries: AnalyticsEntry[] = [];

    for (const app of applicants) {
      const s = app.status as ApplicantStatus;
      if (s in stats) stats[s]++;

      // Use the last update if available, otherwise created_time
      const timestamp = app.updated.length > 0 ? app.updated[app.updated.length - 1] : app.created_time;
      if (!timestamp) continue;

      const date = new Date(timestamp);
      if (isNaN(date.getTime())) continue;

      // Extract local YYYY-MM-DD to avoid UTC day-shift bugs
      const yStr = String(date.getFullYear());
      const mStr = String(date.getMonth() + 1).padStart(2, "0");
      const dStr = String(date.getDate()).padStart(2, "0");
      const dateStr = `${yStr}-${mStr}-${dStr}`;

      entries.push({
        date: dateStr,
        role: app.position,
        status: s,
      });
    }

    const result: AnalyticsResult = { entries, stats };
    setCache("analytics-v3", result);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ entries: [], stats: { pending: 0, interested: 0, inprocess: 0, rejected: 0 }, error: message }, { status: 200 });
  }
}

