/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMounted } from "@/hooks/useMounted";

interface HeaderProps {
  onRefresh: () => void;
  isPending: boolean;
  lastUpdated: Date;
}

export default function Header({ onRefresh, isPending, lastUpdated }: HeaderProps) {
  const mounted = useMounted();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const update = () => {
      setClock(
        lastUpdated.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    update();
  }, [lastUpdated]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div className="flex items-center justify-between px-4 py-2.5 md:px-6 md:py-3">
        {/* Logo + Brand */}
        <div className="flex items-center gap-2 md:gap-3">
          <img
            src="/image.webp"
            alt="Tansi Motors Logo"
            className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-contain"
            suppressHydrationWarning
          />
          <div className="flex flex-col ml-2">
            <h1 className="text-sm font-bold tracking-tight text-primary leading-tight md:text-lg">TANSI MOTORS</h1>
            <p className="text-[10px] font-bold tracking-[0.1em] text-zinc-400 uppercase leading-tight md:text-[9.8px] md:tracking-[0.2em]">Hiring Dashboard</p>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 border border-zinc-200/50 md:rounded-lg md:px-3 md:py-2 md:border-border/50">
            <svg className="h-3 w-3 text-zinc-500 md:h-3.5 md:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold text-zinc-600 md:text-xs md:font-medium md:text-muted-foreground uppercase">
              <span className="hidden md:inline">UPDATED </span>
              {mounted ? clock : "00:00 AM"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isPending}
            className="h-8 w-8 text-zinc-500 hover:bg-zinc-100 md:h-9 md:w-9 md:border md:border-input"
          >
            <svg
              className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
