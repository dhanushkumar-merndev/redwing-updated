"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, Filter, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Department, ApplicantStatus, Role, SortField, SortOrder } from "@/types";
import { ROLES_BY_DEPARTMENT } from "@/lib/roles";

interface MobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  activeDepartment: Department;
  onDepartmentChange: (d: Department) => void;
  activeStatus: ApplicantStatus | "all";
  onStatusChange: (s: ApplicantStatus | "all") => void;
  selectedRole: Role | "all";
  onRoleChange: (r: Role | "all") => void;
  sortField: SortField;
  onSortFieldChange: (f: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (o: SortOrder) => void;
}

const STATUS_TABS: { value: ApplicantStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "All", color: "zinc" },
  { value: "pending", label: "Pending", color: "amber" },
  { value: "interested", label: "Interested", color: "emerald" },
  { value: "inprocess", label: "In Process", color: "blue" },
  { value: "rejected", label: "Rejected", color: "zinc" },
];

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "created_time", label: "Creation Date" },
  { value: "updated", label: "Last Updated" },
  { value: "full_name", label: "Applicant Name" },
  { value: "position", label: "Role Title" },
];

export default function MobileFilters({
  isOpen,
  onClose,
  activeDepartment,
  onDepartmentChange,
  activeStatus,
  onStatusChange,
  selectedRole,
  onRoleChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
}: MobileFiltersProps) {
  // Consolidate state to avoid cascading renders
  const [tempFilters, setTempFilters] = useState({
    dep: activeDepartment,
    status: activeStatus,
    role: selectedRole,
    sortF: sortField,
    sortO: sortOrder
  });

  // Sync internal state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTempFilters({
        dep: activeDepartment,
        status: activeStatus,
        role: selectedRole,
        sortF: sortField,
        sortO: sortOrder
      });
    }
  }, [isOpen, activeDepartment, activeStatus, selectedRole, sortField, sortOrder]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleSearch = () => {
    onDepartmentChange(tempFilters.dep);
    onStatusChange(tempFilters.status);
    onRoleChange(tempFilters.role);
    onSortFieldChange(tempFilters.sortF);
    onSortOrderChange(tempFilters.sortO);
    onClose();
  };

  const departmentRoles = ROLES_BY_DEPARTMENT[tempFilters.dep] as readonly Role[];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-zinc-950/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[101] flex flex-col rounded-t-[32px] bg-white shadow-2xl overflow-hidden max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                  <Filter className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-900">Search Filters</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-8 custom-scrollbar">
              {/* Department */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Department</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["sales", "service"] as Department[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setTempFilters(prev => ({ ...prev, dep: d, role: "all" }))}
                      className={cn(
                        "flex h-14 items-center justify-center rounded-2xl border-2 text-sm font-bold transition-all",
                        tempFilters.dep === d
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-zinc-100 bg-zinc-50 text-zinc-500"
                      )}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Application Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_TABS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setTempFilters(prev => ({ ...prev, status: s.value }))}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all",
                        tempFilters.status === s.value
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:border-zinc-200"
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        s.value === 'all' ? 'bg-zinc-400' : 
                        s.value === 'pending' ? 'bg-amber-500' :
                        s.value === 'interested' ? 'bg-emerald-500' :
                        s.value === 'inprocess' ? 'bg-blue-500' : 'bg-red-500'
                      )} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-zinc-100" />

              {/* Roles */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Specific Role</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setTempFilters(prev => ({ ...prev, role: "all" }))}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                      tempFilters.role === "all" ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-600 border border-zinc-100"
                    )}
                  >
                    <span>All Roles</span>
                    {tempFilters.role === "all" && <Check className="h-4 w-4" />}
                  </button>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {departmentRoles.map((role: Role) => (
                      <button
                        key={role}
                        onClick={() => setTempFilters(prev => ({ ...prev, role }))}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-[13px] font-semibold transition-all",
                          tempFilters.role === role
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-zinc-100 bg-white text-zinc-500"
                        )}
                      >
                        <span className="truncate pr-2">{role}</span>
                        {tempFilters.role === role ? <Check className="h-4 w-4" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sort Logic */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Sorting Logic</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {SORT_FIELDS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setTempFilters(prev => ({ ...prev, sortF: f.value }))}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all",
                          tempFilters.sortF === f.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 bg-white text-zinc-500"
                        )}
                      >
                        {f.label}
                        {tempFilters.sortF === f.value && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {(["asc", "desc"] as SortOrder[]).map((o) => (
                      <button
                        key={o}
                        onClick={() => setTempFilters(prev => ({ ...prev, sortO: o }))}
                        className={cn(
                          "flex h-11 flex-1 items-center justify-center rounded-xl border text-xs font-bold uppercase tracking-widest transition-all",
                          tempFilters.sortO === o ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 bg-zinc-50 text-zinc-500"
                        )}
                      >
                        {o === "asc" ? "Ascending" : "Descending"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-100">
              <Button
                onClick={handleSearch}
                className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20"
              >
                Search Results
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
