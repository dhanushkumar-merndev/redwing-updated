"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion, type Variants } from "framer-motion";
import type { StatsData } from "@/types";
import { useMounted } from "@/hooks/useMounted";

interface StatsRowProps {
  stats: StatsData;
}

const statConfig = [
  { key: "pending" as const, label: "New Applications", color: "border-chart-1", textColor: "text-chart-1", bgColor: "bg-chart-1/10", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { key: "rejected" as const, label: "Rejected", color: "border-chart-2", textColor: "text-chart-2", bgColor: "bg-chart-2/10", icon: "M6 18L18 6M6 6l12 12" },
  { key: "interested" as const, label: "Interested", color: "border-chart-3", textColor: "text-chart-3", bgColor: "bg-chart-3/10", icon: "M5 13l4 4L19 7" },
  { key: "inprocess" as const, label: "In Process", color: "border-chart-4", textColor: "text-chart-4", bgColor: "bg-chart-4/10", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
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
      ease: [0.25, 0.1, 0.25, 1.0] 
    } 
  },
};

export default function StatsRow({ stats }: StatsRowProps) {
  const mounted = useMounted();

  const total = stats.pending + stats.interested + stats.rejected + stats.inprocess;

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 h-[100px] opacity-0" />
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statConfig.map((stat) => (
        <motion.div key={stat.key} variants={cardVariants}>
          <Card className={`border-b-4 ${stat.color} shadow-sm transition-shadow hover:shadow-md`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:text-xs">{stat.label}</p>
                  <p className={`mt-0.5 text-2xl font-bold md:mt-1 md:text-3xl ${stat.textColor}`}>{stats[stat.key]}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg md:h-10 md:w-10 ${stat.bgColor}`}>
                  <span className={`text-xs font-bold md:text-sm ${stat.textColor}`}>
                    {total > 0 ? Math.round((stats[stat.key] / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
