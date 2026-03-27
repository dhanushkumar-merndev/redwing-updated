import { useState, useTransition } from "react";
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
import type { Department, Role, SortField, SortOrder } from "@/types";
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
}

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "created_time", label: "Date Created" },
  { value: "updated", label: "Last Updated" },
  { value: "full_name", label: "Name" },
  { value: "position", label: "Role" },
  { value: "status", label: "Status" },
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
}: FilterBarProps) {
  const mounted = useMounted();
  const [, startTransition] = useTransition();

  const departmentRoles = ROLES_BY_DEPARTMENT[department];
  const activeFiltersCount = (selectedRole !== "all" ? 1 : 0) + (sortField !== "created_time" || sortOrder !== "desc" ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <svg
          className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
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
        <Input
          placeholder="Quick search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full pl-9 text-sm rounded-xl border-zinc-200 bg-white focus:ring-0 focus:border-zinc-300"
        />
      </div>

      {/* Filter Popover - Use button for placeholder to match PopoverTrigger tag and avoid hydration mismatch */}
      {!mounted ? (
        <button
          disabled
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-10 px-4 rounded-xl opacity-50 border-zinc-200 flex items-center gap-2"
          )}
        >
          <svg className="h-4 w-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Loading...
        </button>
      ) : (
        <Popover>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 px-4 rounded-xl border-zinc-200 font-semibold text-xs flex items-center gap-2 hover:bg-zinc-50"
            )}
          >
            <svg
              className="h-4 w-4 text-zinc-600"
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
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                {activeFiltersCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-zinc-100" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Sort Mechanism</p>
                <div className="flex items-center gap-2">
                  <Select value={sortField} onValueChange={(v) => v && onSortFieldChange(v as SortField)}>
                    <SelectTrigger className="h-9 flex-1 text-xs rounded-lg border-zinc-200">
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
                    className="h-9 px-2 rounded-lg border-zinc-200 flex items-center gap-1.5 min-w-[70px]"
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

              <Separator className="bg-zinc-100" />

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Filter by Role</p>
                <Select value={selectedRole} onValueChange={(v) => v && onRoleChange(v as Role | "all")}>
                  <SelectTrigger className="h-9 w-full text-xs rounded-lg border-zinc-200">
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
                    onSortFieldChange("created_time");
                    onSortOrderChange("desc");
                  }}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Reset all
                </button>
                <p className="text-[10px] text-zinc-400">
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
