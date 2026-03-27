"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Department, ApplicantStatus } from "@/types";

interface DepartmentTabsProps {
  activeDepartment: Department;
  activeStatus: ApplicantStatus | "all";
  onDepartmentChange: (dept: Department) => void;
  onStatusChange: (status: ApplicantStatus | "all") => void;
}

const STATUS_TABS: { value: ApplicantStatus | "all"; label: string; dotColor: string; activeBg: string; activeText: string }[] = [
  { value: "all", label: "All", dotColor: "bg-zinc-400", activeBg: "bg-zinc-900", activeText: "text-white" },
  { value: "pending", label: "Pending", dotColor: "bg-chart-1", activeBg: "bg-chart-1/15", activeText: "text-chart-1" },
  { value: "rejected", label: "Rejected", dotColor: "bg-chart-2", activeBg: "bg-chart-2/15", activeText: "text-chart-2" },
  { value: "interested", label: "Interested", dotColor: "bg-chart-3", activeBg: "bg-chart-3/15", activeText: "text-chart-3" },
  { value: "inprocess", label: "In Process", dotColor: "bg-chart-4", activeBg: "bg-chart-4/15", activeText: "text-chart-4" },
];

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "service", label: "Service" },
];

export default function DepartmentTabs({
  activeDepartment,
  activeStatus,
  onDepartmentChange,
  onStatusChange,
}: DepartmentTabsProps) {
  return (
    <div className="space-y-3">
      {/* Department Pills */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/70 p-1 w-fit">
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDepartment === dept.value;
          return (
            <button
              key={dept.value}
              onClick={() => onDepartmentChange(dept.value)}
              className={cn(
                "relative rounded-md px-5 py-1.5 text-sm font-semibold transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="dept-pill"
                  className="absolute inset-0 rounded-md bg-white shadow-sm"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10">{dept.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Chips with colored dots */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                isActive
                  ? tab.activeText
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="status-pill"
                  className={cn("absolute inset-0 rounded-full shadow-sm", tab.activeBg)}
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className={cn("relative z-10 h-1.5 w-1.5 rounded-full", tab.dotColor)} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
