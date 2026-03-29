"use client";

import { useTransition, useState, useCallback, useRef, useEffect } from "react";
import type { Applicant } from "@/types";
import { getFromDB } from "@/lib/db";
import { decryptName } from "@/lib/crypto";
import { toast } from "sonner";

export const useApplicants = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isPending, startTransition] = useTransition();
  const [consecutive404Count, setConsecutive404Count] = useState(0);
  const refreshHistory = useRef<number[]>([]);

  // Initialize history from localStorage (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("refresh_history");
      if (stored) {
        refreshHistory.current = JSON.parse(stored);
      }
    } catch {
      // LocalStorage access error
    }
  }, []);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    
    // Filter out old timestamps
    refreshHistory.current = refreshHistory.current.filter(t => t > oneMinuteAgo);

    if (refreshHistory.current.length >= 10) {
      toast.error("Slow down!", {
        description: "You've refreshed too many times. Please wait a minute before trying again.",
      });
      return false;
    }

    refreshHistory.current.push(now);
    localStorage.setItem("refresh_history", JSON.stringify(refreshHistory.current));
    return true;
  }, []);

  const fetchApplicants = useCallback((onComplete?: () => void) => {
    if (!checkRateLimit()) {
      onComplete?.();
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/applicants");
        if (res.ok) {
          setConsecutive404Count(0);
          const data = (await res.json()) as { applicants: Applicant[] };
          setApplicants(data.applicants ?? []);
        } else if (res.status === 404) {
          setConsecutive404Count((prev) => prev + 1);
        } else if (res.status === 429) {
          toast.error("Slow down!", {
            description: "The server is busy. Please wait a moment.",
          });
        }
      } catch {
        // Network or parse error — keep current state
      }
      onComplete?.();
    });
  }, [checkRateLimit]);

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
          
          if (putRes.ok) {
            setConsecutive404Count(0);
          } else if (putRes.status === 404) {
            setConsecutive404Count((prev) => prev + 1);
          } else if (putRes.status === 429) {
            toast.error("Update Limit Reached", {
              description: "You're saving changes too fast. Please wait a moment.",
            });
            onComplete?.();
            return;
          }

          // Re-fetch all to sync state
          const res = await fetch("/api/applicants");
          if (res.ok) {
            setConsecutive404Count(0);
            const refreshed = (await res.json()) as { applicants: Applicant[] };
            setApplicants(refreshed.applicants ?? []);
          } else if (res.status === 429) {
            // Silence toast on auto-refresh to avoid double alerts
            console.warn("Auto-refresh frequency limited");
          } else if (res.status === 404) {
            setConsecutive404Count((prev) => prev + 1);
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

          const postRes = await fetch("/api/applicants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, user }),
          });

          if (postRes.ok) {
            setConsecutive404Count(0);
          } else if (postRes.status === 429) {
            toast.error("Limit Reached", {
              description: "You're adding applicants too fast. Please wait a moment.",
            });
            onComplete?.();
            return;
          } else if (postRes.status === 404) {
            setConsecutive404Count((prev) => prev + 1);
          }

          const res = await fetch("/api/applicants");
          if (res.ok) {
            setConsecutive404Count(0);
            const refreshed = (await res.json()) as { applicants: Applicant[] };
            setApplicants(refreshed.applicants ?? []);
          } else if (res.status === 429) {
            console.warn("Auto-refresh limited");
          } else if (res.status === 404) {
            setConsecutive404Count((prev) => prev + 1);
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
    consecutive404Count,
  };
};
