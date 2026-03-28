import { useSyncExternalStore } from "react";

/**
 * Custom hook to track the state of a media query.
 * Uses useSyncExternalStore to avoid "cascading renders" warnings in React 19+.
 * 
 * @param query - The media query to listen to (e.g., "(max-width: 768px)")
 * @returns boolean - Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    // 1. Subscribe: Attach a listener and return a cleanup function
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    // 2. Get client snapshot: Return the current value from the browser API
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(query).matches;
    },
    // 3. Get server snapshot: Default to false for SSR to avoid hydration mismatch
    () => false
  );
}