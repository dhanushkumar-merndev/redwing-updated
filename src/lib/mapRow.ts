import type { Applicant, ApplicantStatus, Role } from "@/types";

export const mapRow = (row: (string | number)[], index: number): Applicant => {
  let updatedArr: string[] = [];
  const rawUpdated = String(row[7] ?? "[]");
  try {
    const parsed: unknown = JSON.parse(rawUpdated);
    if (Array.isArray(parsed)) {
      updatedArr = parsed.map(String);
    }
  } catch {
    updatedArr = [];
  }

  return {
    id: String(index + 2),
    created_time: String(row[0] ?? ""),
    position: String(row[1] ?? "") as Role,
    full_name: String(row[2] ?? ""),
    phone: String(row[3] ?? ""),
    email: String(row[4] ?? ""),
    status: (String(row[5] ?? "pending") as ApplicantStatus),
    feedback: String(row[6] ?? ""),
    updated: updatedArr,
  };
};
