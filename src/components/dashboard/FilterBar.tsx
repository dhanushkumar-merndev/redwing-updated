"use client";

import { useMounted } from "@/hooks/useMounted";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Department, Role, SortField, SortOrder, ApplicantStatus } from "@/types";
import { ROLES_BY_DEPARTMENT } from "@/lib/roles";

interface FilterBarProps {
  department: Department;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: Role | "all";
  onRoleChange: (role: Role | "all") => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  activeStatus: ApplicantStatus | "all";
  onStatusChange: (status: ApplicantStatus | "all") => void;
}

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "created_time", label: "Creation Date" },
  { value: "updated", label: "Last Updated" },
  { value: "full_name", label: "Applicant Name" },
  { value: "position", label: "Role Title" },
];

const STATUS_FILTERS: { value: ApplicantStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "interested", label: "Interested" },
  { value: "inprocess", label: "In Process" },
  { value: "rejected", label: "Rejected" },
];

export default function FilterBar({
  department,
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  activeStatus,
  onStatusChange,
}: FilterBarProps) {
  const mounted = useMounted();

  const departmentRoles = ROLES_BY_DEPARTMENT[department];
  const activeFiltersCount = 
    (selectedRole !== "all" ? 1 : 0) + 
    (activeStatus !== "all" ? 1 : 0) + 
    (sortField !== "created_time" || sortOrder !== "desc" ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-center">
      {/* Search Input */}

<div className="relative w-full sm:w-80">
  
  {/* 🔍 Search Icon */}
  <svg
    className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>

  {/* ❌ Clear Button */}
  {searchQuery && (
    <button
      type="button"
      onClick={() => onSearchChange("")}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  )}

  {/* Input */}
  <Input
    placeholder="Quick search..."
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    className="h-10 w-full pl-9 pr-9 text-sm rounded-xl border-border bg-background focus:ring-0 focus:border-border/80 shadow-premium/50"
  />
</div>
      {/* Filter Popover */}
      {!mounted ? (
        <button
          disabled
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 px-4 rounded-xl border-border opacity-50 flex items-center gap-2"
          )}
        >
          <svg className="h-4 w-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      ) : (
        <Popover>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 px-4 rounded-xl border-border font-semibold text-xs flex items-center gap-2 hover:bg-muted shadow-premium transition-all duration-300"
            )}
          >
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white animate-in zoom-in-50">
                {activeFiltersCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 rounded-2xl shadow-xl border-border/50" align="end" sideOffset={8}>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sort Mechanism</p>
                <div className="flex items-center gap-2">
                  <Select value={sortField} onValueChange={(v) => v && onSortFieldChange(v as SortField)}>
                    <SelectTrigger className="h-9 flex-1 text-xs rounded-lg border-border">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value} className="text-xs">
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="h-9 px-2 rounded-lg border-border flex items-center gap-1.5 min-w-[70px]"
                    onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      {sortOrder === "asc" ? "Asc" : "Desc"}
                    </span>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      {sortOrder === "asc" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  </Button>
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filter By Status</p>
                <Select value={activeStatus} onValueChange={(v) => v && onStatusChange(v as ApplicantStatus | "all")}>
                  <SelectTrigger className="h-9 w-full text-xs rounded-lg border-border">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filter by Role</p>
                <Select value={selectedRole} onValueChange={(v) => v && onRoleChange(v as Role | "all")}>
                  <SelectTrigger className="h-9 w-full text-xs rounded-lg border-border">
                    <SelectValue placeholder="Filter role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {departmentRoles.map((role) => (
                      <SelectItem key={role} value={role} className="text-xs">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-2 flex items-center justify-between">
                <button 
                  onClick={() => {
                    onRoleChange("all");
                    onStatusChange("all");
                    onSortFieldChange("created_time");
                    onSortOrderChange("desc");
                  }}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Reset all
                </button>
                <p className="text-[10px] text-muted-foreground">
                  {activeFiltersCount} active
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
