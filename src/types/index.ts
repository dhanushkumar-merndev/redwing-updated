import type { SalesRole, ServiceRole, Role } from "@/lib/roles";

export const APPLICANT_STATUSES = [
  "pending",
  "rejected",
  "interested",
  "inprocess",
  "rnr",
] as const;

export type ApplicantStatus = (typeof APPLICANT_STATUSES)[number];

export type Department = "sales" | "service";

export { type SalesRole, type ServiceRole, type Role };

export interface Applicant {
  id: string;
  created_time: string;
  position: Role;
  full_name: string;
  phone: string;
  email: string;
  status: ApplicantStatus;
  feedback: string;
  updated: string[];
}

export interface AnalyticsDataPoint {
  date: string;
  pending: number;
  interested: number;
  inprocess: number;
  rnr: number;
  rejected: number;
}

export interface RoleBarData {
  role: string;
  pending: number;
  interested: number;
  inprocess: number;
  rnr: number;
  rejected: number;
}

export interface StatsData {
  pending: number;
  interested: number;
  inprocess: number;
  rejected: number;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export type SortField = "full_name" | "created_time" | "updated" | "position" | "status";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}
