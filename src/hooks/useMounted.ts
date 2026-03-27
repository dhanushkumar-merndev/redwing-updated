"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * A hook that returns true if the component is mounted on the client.
 * This is the modern, non-warning-triggering way to handle hydration checks in React 18+.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
