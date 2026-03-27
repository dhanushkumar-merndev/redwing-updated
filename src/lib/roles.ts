import type { Department } from "@/types";

export const SALES_ROLES = [
  "Sales Managers",
  "Sales Consultants",
  "Customer Relationship Executives",
] as const;

export const SERVICE_ROLES = [
  "Sr Technicians",
  "Service Advisors",
  "Spare Parts Supervisors",
] as const;

export type SalesRole = (typeof SALES_ROLES)[number];
export type ServiceRole = (typeof SERVICE_ROLES)[number];
export type Role = SalesRole | ServiceRole;

export const ALL_ROLES: Role[] = [...SALES_ROLES, ...SERVICE_ROLES];

export const ROLE_SHORT_NAMES: Record<Role, string> = {
  "Sales Managers": "SM",
  "Sales Consultants": "SC",
  "Customer Relationship Executives": "CRE",
  "Sr Technicians": "ST",
  "Service Advisors": "SA",
  "Spare Parts Supervisors": "SPS",
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
