"use client";

import { useEffect, ReactNode } from "react";
import { getLenis } from "@/lib/lenis";

/**
 * Provider that initializes Lenis smooth scrolling and manages 
 * global scroll state for performance optimizations.
 */
export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const instance = getLenis();

    /**
     * Optimized scroll handler that uses velocity to enable interaction early.
     * This feels much more responsive by re-enabling buttons as the scroll slows down,
     * rather than waiting for it to reach a total dead stop.
     */
    const handleScroll = (e: { velocity: number }) => {
      const absVelocity = Math.abs(e.velocity);

      // If moving at a noticeable speed, lock interactions to keep frames high
      if (absVelocity > 0.1) {
        if (!document.body.classList.contains("is-scrolling")) {
          document.body.classList.add("is-scrolling");
        }

        // Standard safety cleanup
        if (window.scrollTimeout) {
          clearTimeout(window.scrollTimeout);
        }

        window.scrollTimeout = setTimeout(() => {
          document.body.classList.remove("is-scrolling");
        }, 300); // 300ms safety buffer
      }
      // Note: We no longer remove the class immediately if velocity is low.
      // We let the timeout handle it to prevent "cursor flickering" caused by rapid class toggling.
    };

    // Cast to the expected callback signature without using 'any'
    const scrollHandler = handleScroll as (e: unknown) => void;

    instance.on("scroll", scrollHandler);

    return () => {
      instance.off("scroll", scrollHandler);
      instance.destroy();
    };
  }, []);

  return <>{children}</>;
}

// Ensure the TypeScript compiler knows about our custom window property
declare global {
  interface Window {
    scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  }
}
