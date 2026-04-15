"use client";

import { memo } from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { StatsData } from "@/types";

interface StatsRowProps {
  stats: StatsData;
  totalCount: number;
}

const statConfig = [
  { key: "pending" as const, label: "New", textColor: "text-chart-1", bgColor: "bg-chart-1/10", pillBg: "bg-chart-1/15", pillText: "text-chart-1", barColor: "bg-chart-1", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { key: "rnr" as const, label: "RNR", textColor: "text-chart-5", bgColor: "bg-chart-5/10", pillBg: "bg-chart-5/15", pillText: "text-chart-5", barColor: "bg-chart-5", icon: "M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 18h16.68a1 1 0 00.87-1.5l-7.5-13a1 1 0 00-1.74 0z" },
  { key: "interested" as const, label: "Interested", textColor: "text-chart-3", bgColor: "bg-chart-3/10", pillBg: "bg-chart-3/15", pillText: "text-chart-3", barColor: "bg-chart-3", icon: "M5 13l4 4L19 7" },
  { key: "inprocess" as const, label: "In Process", textColor: "text-chart-4", bgColor: "bg-chart-4/10", pillBg: "bg-chart-4/15", pillText: "text-chart-4", barColor: "bg-chart-4", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "rejected" as const, label: "Rejected", textColor: "text-chart-2", bgColor: "bg-chart-2/10", pillBg: "bg-chart-2/15", pillText: "text-chart-2", barColor: "bg-chart-2", icon: "M6 18L18 6M6 6l12 12" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1.0] as const,
    },
  },
};

const totalCardConfig = {
  label: "Total",
  textColor: "text-foreground",
  pillBg: "bg-muted",
  pillText: "text-foreground",
  barColor: "bg-foreground",
};

const StatsRow = memo(function StatsRow({ stats, totalCount }: StatsRowProps) {
  const total = totalCount;

  return (
    <motion.div
      className="grid grid-cols-2 gap-[var(--dash-gap)] md:grid-cols-6 p-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statConfig.map((stat) => {
        const pct = total > 0 ? Math.round((stats[stat.key] / total) * 100) : 0;

        return (
          <motion.div key={stat.key} variants={cardVariants}>
            <Card className="rounded-[var(--dash-card-radius)] border-[var(--dash-border)] bg-card shadow-sm hover:shadow-md transition-all duration-[var(--dash-transition-fast)] p-[var(--dash-card-padding)] flex flex-col gap-[var(--dash-gap)]">
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${stat.pillBg} ${stat.pillText}`}>
                  {stat.label}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${stat.pillBg} ${stat.pillText}`}>
                  {pct}%
                </span>
              </div>

              <p className={`text-3xl font-bold leading-none md:text-4xl ${stat.textColor}`}>
                {stats[stat.key] || 0}
              </p>

              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${stat.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
                />
              </div>
            </Card>
          </motion.div>
        );
      })}

      <motion.div variants={cardVariants}>
        <Card className="rounded-[var(--dash-card-radius)] border-[var(--dash-border)] bg-card shadow-sm hover:shadow-md transition-all duration-[var(--dash-transition-fast)] p-[var(--dash-card-padding)] flex flex-col gap-[var(--dash-gap)]">
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${totalCardConfig.pillBg} ${totalCardConfig.pillText}`}>
              {totalCardConfig.label}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${totalCardConfig.pillBg} ${totalCardConfig.pillText}`}>
              100%
            </span>
          </div>

          <p className={`text-3xl font-bold leading-none md:text-4xl ${totalCardConfig.textColor}`}>
            {total}
          </p>

          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${totalCardConfig.barColor}`}
              initial={{ width: 0 }}
              animate={{ width: total > 0 ? "100%" : "0%" }}
              transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
            />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
});

export default StatsRow;
