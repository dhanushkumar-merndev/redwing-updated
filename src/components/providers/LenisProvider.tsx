"use client";

import { useEffect, ReactNode } from "react";
import { getLenis } from "@/lib/lenis";

export default function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const instance = getLenis();
    return () => {
      instance.destroy();
    };
  }, []);

  return <>{children}</>;
}
