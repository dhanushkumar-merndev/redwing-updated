"use client";

import { useState, useEffect } from "react";

/**
 * A hook that returns true if the component is mounted on the client.
 * Using a simple state-based check is the safest way to ensure that 
 * server rendering and the FIRST client render match (both being false).
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Using requestAnimationFrame to move the state update out of the 
    // synchronous effect body, satisfying the linter and ensuring
    // the update happens on the next frame.
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return mounted;
}
