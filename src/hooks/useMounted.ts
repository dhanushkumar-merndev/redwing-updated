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

    setMounted(true);
    
  }, []);

  return mounted;
}
