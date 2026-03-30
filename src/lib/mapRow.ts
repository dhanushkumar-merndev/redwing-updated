import type { Applicant, ApplicantStatus, Role } from "@/types";

export const mapRow = (row: (string | number)[], index: number): Applicant | null => {
  // 1. Basic row integrity check
  if (!row || row.length < 5) return null;
  const fullName = String(row[2] ?? "").trim();
  const phone = String(row[3] ?? "").trim();
  if (!fullName || !phone) return null;

  // 2. Safe Date Parsing
  const createdRaw = String(row[0] ?? "");
  let createdTime = createdRaw;
  const d = new Date(createdRaw);
  if (isNaN(d.getTime())) {
    // If date is invalid in sheet, fallback to current time to prevent crashes
    createdTime = new Date().toISOString();
  }

  // 3. Safe 'updated' array parsing
  let updatedArr: string[] = [];
  const rawUpdated = String(row[7] ?? "[]");
  try {
    const parsed: unknown = JSON.parse(rawUpdated);
    if (Array.isArray(parsed)) {
      // Filter out non-string or empty entries
      updatedArr = parsed.map(String).filter(s => s.trim().length > 0);
    }
  } catch {
    updatedArr = [];
  }

  return {
    id: String(index + 1),
    created_time: createdTime,
    position: String(row[1] ?? "") as Role,
    full_name: fullName,
    phone,
    email: String(row[4] ?? ""),
    status: (String(row[5] ?? "pending") as ApplicantStatus),
    feedback: String(row[6] ?? ""),
    updated: updatedArr,
  };
};
