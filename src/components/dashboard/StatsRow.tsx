"use client";

import { motion, type Variants } from "framer-motion";
import type { StatsData } from "@/types";

interface StatsRowProps {
  stats: StatsData;
}

const statConfig = [
  { key: "pending" as const, label: "New Applications", textColor: "text-chart-1", bgColor: "bg-chart-1/10", pillBg: "bg-chart-1/15", pillText: "text-chart-1", barColor: "bg-chart-1", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { key: "rejected" as const, label: "Rejected", textColor: "text-chart-2", bgColor: "bg-chart-2/10", pillBg: "bg-chart-2/15", pillText: "text-chart-2", barColor: "bg-chart-2", icon: "M6 18L18 6M6 6l12 12" },
  { key: "interested" as const, label: "Interested", textColor: "text-chart-3", bgColor: "bg-chart-3/10", pillBg: "bg-chart-3/15", pillText: "text-chart-3", barColor: "bg-chart-3", icon: "M5 13l4 4L19 7" },
  { key: "inprocess" as const, label: "In Process", textColor: "text-chart-4", bgColor: "bg-chart-4/10", pillBg: "bg-chart-4/15", pillText: "text-chart-4", barColor: "bg-chart-4", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0] as const,
    },
  },
};

export default function StatsRow({ stats }: StatsRowProps) {
  const total = stats.pending + stats.interested + stats.rejected + stats.inprocess;

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statConfig.map((stat) => {
        const pct = total > 0 ? Math.round((stats[stat.key] / total) * 100) : 0;

        return (
          <motion.div key={stat.key} variants={cardVariants}>
            <div className="rounded-2xl bg-card shadow-sm border border-border/50 hover:shadow-md transition-shadow p-3 md:p-4 flex flex-col gap-3">

              {/* Top row: label pill + percentage pill */}
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${stat.pillBg} ${stat.pillText}`}>
                  {stat.label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${stat.pillBg} ${stat.pillText}`}>
                  {pct}%
                </span>
              </div>

              {/* Count */}
              <p className={`text-3xl font-bold leading-none md:text-4xl ${stat.textColor}`}>
                {stats[stat.key] || 0}
              </p>

              {/* Pill progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${stat.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
                />
              </div>

            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}