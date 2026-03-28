"use client";

import { useTransition, useState, useCallback } from "react";
import type { Applicant } from "@/types";
import { getFromDB } from "@/lib/db";
import { decryptName } from "@/lib/crypto";

export const useApplicants = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchApplicants = useCallback((onComplete?: () => void) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/applicants");
        if (res.ok) {
          const data = (await res.json()) as { applicants: Applicant[] };
          setApplicants(data.applicants ?? []);
        }
      } catch {
        // Network or parse error — keep current state
      }
      onComplete?.();
    });
  }, []);

  const saveApplicant = useCallback(
    (id: string, data: Partial<Applicant>, onComplete?: () => void) => {
      startTransition(async () => {
        try {
          // Get identity
          const encrypted = await getFromDB();
          const user = encrypted ? await decryptName(encrypted) : "Unknown";

          const putRes = await fetch(`/api/applicants/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, user }),
          });
          if (!putRes.ok) {
            const err = await putRes.json().catch(() => ({}));
            console.error("Save failed:", err);
          }
          // Re-fetch all to sync state
          const res = await fetch("/api/applicants");
          if (res.ok) {
            const refreshed = (await res.json()) as { applicants: Applicant[] };
            setApplicants(refreshed.applicants ?? []);
          }
        } catch (error) {
          console.error("Save error:", error);
        }
        onComplete?.();
      });
    },
    []
  );

  const addApplicant = useCallback(
    (data: Omit<Applicant, "id" | "created_time" | "updated">, onComplete?: () => void) => {
      startTransition(async () => {
        try {
          // Get identity
          const encrypted = await getFromDB();
          const user = encrypted ? await decryptName(encrypted) : "Unknown";

          await fetch("/api/applicants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, user }),
          });
          const res = await fetch("/api/applicants");
          if (res.ok) {
            const refreshed = (await res.json()) as { applicants: Applicant[] };
            setApplicants(refreshed.applicants ?? []);
          }
        } catch (error) {
          console.error("Add error:", error);
        }
        onComplete?.();
      });
    },
    []
  );

  return {
    applicants,
    setApplicants,
    isPending,
    fetchApplicants,
    saveApplicant,
    addApplicant,
  };
};
