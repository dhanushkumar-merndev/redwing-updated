import type { Department } from "@/types";

export const SALES_ROLES = [
  "Sales Manager",
  "Institutional Sales Manager",
  "Network Manager",
  "Sales Executive",
  "Delivery Executive",
] as const;

export const SERVICE_ROLES = [
  "Service Manager",
  "Service Advisor",
  "Spare Parts Supervisor",
  "Technician",
  "Cashier",
  "Billing Executive",
] as const;

export type SalesRole = (typeof SALES_ROLES)[number];
export type ServiceRole = (typeof SERVICE_ROLES)[number];
export type Role = SalesRole | ServiceRole;

export const ALL_ROLES: Role[] = [...SALES_ROLES, ...SERVICE_ROLES];

export const ROLE_SHORT_NAMES: Record<string, string> = {
  "Sales Manager": "SM",
  "Institutional Sales Manager": "ISM",
  "Network Manager": "NM",
  "Sales Executive": "SE",
  "Sales Executives": "SE",
  "Delivery Executive": "DE",
  "Delivery Executives": "DE",

  "Service Manager": "SVM",
  "Service Advisor": "SA",
  "Service Advisors": "SA",
  "Spare Parts Supervisor": "SPS",
  "Spare Parts Supervisors": "SPS",
  "Technician": "TECH",
  "Technicians": "TECH",
  "Cashier": "CASH",
  "Cashiers": "CASH",
  "Billing Executive": "BE",
  "Billing Executives": "BE",
};

export const ROLES_BY_DEPARTMENT: Record<Department, readonly Role[]> = {
  sales: SALES_ROLES,
  service: SERVICE_ROLES,
};

export function getDepartment(role: string): Department {
  const norm = role.trim().toLowerCase();
  
  const isSales = SALES_ROLES.some(r => r.toLowerCase() === norm);
  const isService = SERVICE_ROLES.some(r => r.toLowerCase() === norm);
  
  if (isSales) return "sales";
  if (isService) return "service";
  
  // Backup: if no perfect match, check for keywords
  if (norm.includes("sales")) return "sales";
  
  return "service";
}
