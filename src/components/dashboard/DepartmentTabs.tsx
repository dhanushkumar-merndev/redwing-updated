"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";
import type { Department, ApplicantStatus } from "@/types";

interface DepartmentTabsProps {
  activeDepartment: Department;
  activeStatus: ApplicantStatus | "all";
  departmentCounts?: { sales: number; service: number };
  statusCounts?: { all: number; pending: number; interested: number; inprocess: number; rejected: number };
  onDepartmentChange: (dept: Department) => void;
  onStatusChange: (status: ApplicantStatus | "all") => void;
}

const STATUS_TABS: { value: ApplicantStatus | "all"; label: string; dotColor: string; activeText: string; activeBorderColor: string }[] = [
  { value: "all", label: "All", dotColor: "bg-muted-foreground/40", activeText: "text-muted-foreground", activeBorderColor: "border-muted-foreground/60 border-2" },
  { value: "pending", label: "Pending", dotColor: "bg-chart-1", activeText: "text-chart-1", activeBorderColor: "border-chart-1 border-2" },
  { value: "rejected", label: "Rejected", dotColor: "bg-chart-2", activeText: "text-chart-2", activeBorderColor: "border-chart-2 border-2" },
  { value: "interested", label: "Interested", dotColor: "bg-chart-3", activeText: "text-chart-3", activeBorderColor: "border-chart-3 border-2" },
  { value: "inprocess", label: "In Process", dotColor: "bg-chart-4", activeText: "text-chart-4", activeBorderColor: "border-chart-4 border-2" },
];

const DEPARTMENTS: { value: Department; label: string }[] = [
  { value: "sales", label: "Sales" },
  { value: "service", label: "Service" },
];

export default function DepartmentTabs({
  activeDepartment,
  activeStatus,
  departmentCounts,
  statusCounts,
  onDepartmentChange,
  onStatusChange,
}: DepartmentTabsProps) {
  const mounted = useMounted();

  return (
    <div className="flex flex-col gap-[var(--dash-gap)] w-full min-w-0 overflow-hidden">
      {/* Department Selector (Full width on mobile) */}
      <div className="flex w-full sm:w-fit h-11 mt-1 items-center gap-1 rounded-[var(--dash-card-radius)] bg-muted p-1 shadow-inner border-[var(--dash-border)] ml-1">
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDepartment === dept.value;
          return (
            <button
              key={dept.value}
              onClick={() => onDepartmentChange(dept.value)}
              className={cn(
                "relative flex h-full flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl px-4 transition-all duration-[var(--dash-transition-fast)]",
                isActive ? "text-primary z-10" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="dept-pill-bg"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
                />
              )}
              <span className={cn("relative z-10 text-sm font-black", isActive ? "text-primary" : "text-muted-foreground")}>
                {dept.label}
              </span>
              {mounted && departmentCounts && (
                <span className={cn(
                  "relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                )}>
                  {departmentCounts[dept.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status Chips (Image 5 Scrollable) */}
      <div 
        className="flex w-full min-w-0 items-center gap-2 overflow-x-auto pl-1 pb-1 no-scrollbar scroll-smooth flex-nowrap touch-pan-x pointer-events-auto"
        data-lenis-prevent
      >
        <div className="flex flex-nowrap items-center gap-2 pr-4 min-w-0">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={cn(
                  "relative flex flex-shrink-0 items-center gap-2 rounded-[var(--dash-card-radius)] px-4 py-2 border transition-all duration-[var(--dash-transition-fast)]",
                  isActive
                    ? "border-transparent z-10 "
                    : "bg-background border-border text-muted-foreground hover:border-border/80"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="status-pill-bg"
                    className={`absolute inset-0 rounded-[var(--dash-card-radius)] ${tab.activeBorderColor} shadow-sm`}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                  />
                )}
                <span className={cn("relative z-10 h-2 w-2 rounded-full", tab.dotColor)} />
                <span className={cn("relative z-10 text-xs font-black transition-colors duration-300", isActive ? tab.activeText : "text-muted-foreground")}>
                  {tab.label}
                </span>
                {mounted && statusCounts && (
                  <span className={cn(
                    "relative z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[9px] font-black transition-colors duration-300",
                    isActive ? `bg-muted shadow-xs ${tab.activeText}` : "bg-muted text-muted-foreground"
                  )}>
                    {statusCounts[tab.value]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
