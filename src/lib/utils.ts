import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const APPLICANT_NAME_PATTERN = /^\p{L}[\p{L}\p{M}\s.'-]*$/u;

export function isValidApplicantName(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && APPLICANT_NAME_PATTERN.test(normalized);
}
