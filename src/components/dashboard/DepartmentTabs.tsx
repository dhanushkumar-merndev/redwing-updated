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
  { value: "all", label: "All", dotColor: "bg-zinc-400", activeText: "text-zinc-600", activeBorderColor: "border-zinc-600 border-2" },
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
    <div className="flex flex-col gap-4">
      {/* Department Selector (Image 5 style) */}
      <div className="flex ml-1 h-11 w-fit items-center gap-1 rounded-2xl bg-zinc-100 p-1 shadow-inner ring-1 ring-zinc-200/50">
        {DEPARTMENTS.map((dept) => {
          const isActive = activeDepartment === dept.value;
          return (
            <button
              key={dept.value}
              onClick={() => onDepartmentChange(dept.value)}
              className={cn(
                "relative flex h-full items-center gap-2 rounded-xl px-4 transition-all duration-300",
                isActive ? "text-primary z-10" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="dept-pill-bg"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
                />
              )}
              <span className={cn("relative z-10 text-sm font-black", isActive ? "text-[#DC2626]" : "text-zinc-500")}>
                {dept.label}
              </span>
              {mounted && departmentCounts && (
                <span className={cn(
                  "relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black transition-colors",
                  isActive ? "bg-[#DC2626] text-white" : "bg-zinc-200 text-zinc-500"
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
        className="flex w-full items-center gap-2 overflow-x-auto pl-1 pb-2 no-scrollbar scroll-smooth flex-nowrap touch-pan-x pointer-events-auto"
        data-lenis-prevent
      >
        <div className="flex items-center gap-2 pr-4">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={cn(
                  "relative flex flex-shrink-0 items-center gap-2 rounded-2xl px-4 py-2 border transition-all duration-300",
                  isActive
                    ? "border-transparent z-10"
                    : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="status-pill-bg"
                    className={`absolute inset-0 rounded-2xl ${tab.activeBorderColor} shadow-sm`}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                  />
                )}
                <span className={cn("relative z-10 h-2 w-2 rounded-full", tab.dotColor)} />
                <span className={cn("relative z-10 text-xs font-black transition-colors duration-300", isActive ? "text-zinc-900" : "text-zinc-500")}>
                  {tab.label}
                </span>
                {mounted && statusCounts && (
                  <span className={cn(
                    "relative z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[9px] font-black transition-colors duration-300",
                    isActive ? "bg-white text-zinc-900 shadow-xs" : "bg-zinc-100 text-zinc-500"
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
