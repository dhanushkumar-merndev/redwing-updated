"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/dashboard/Header";
import StatsRow from "@/components/dashboard/StatsRow";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import DepartmentTabs from "@/components/dashboard/DepartmentTabs";
import FilterBar from "@/components/dashboard/FilterBar";
import ApplicantCard from "@/components/dashboard/ApplicantCard";
import MobileFilters from "@/components/dashboard/MobileFilters";
import { useApplicants } from "@/hooks/useApplicants";
import { getDepartment } from "@/lib/roles";
import type { Department, ApplicantStatus, SortField, SortOrder, Role, Applicant } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { resizeLenis } from "@/lib/lenis";

const ITEMS_PER_PAGE = 12;

export default function DashboardPage() {
  const { applicants, isPending, fetchApplicants, saveApplicant } = useApplicants();

  // Filters & UI State
  const [activeDepartment, setActiveDepartment] = useState<Department>("sales");
  const [activeStatus, setActiveStatus] = useState<ApplicantStatus | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created_time");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Sync scroll height on dynamic content changes
  useEffect(() => {
    resizeLenis();
  }, [applicants, displayLimit, activeDepartment, activeStatus]);

  // Helper to reset pagination
  const handleFilterChange = useCallback((updater: () => void) => {
    updater();
    setDisplayLimit(ITEMS_PER_PAGE);
  }, []);

  // Derived Stats
  const stats = useMemo(() => {
    const s = { pending: 0, interested: 0, inprocess: 0, rejected: 0 };
    applicants.forEach((a) => {
      const status = a.status as keyof typeof s;
      if (status in s) s[status]++;
    });
    return s;
  }, [applicants]);

  const departmentCounts = useMemo(() => {
    const counts = { sales: 0, service: 0 };
    applicants.forEach((a) => {
      const dept = getDepartment(a.position);
      if (dept in counts) counts[dept]++;
    });
    return counts;
  }, [applicants]);

  const statusCountsForActiveDept = useMemo(() => {
    const s = { all: 0, pending: 0, interested: 0, inprocess: 0, rejected: 0 };
    applicants.forEach((a) => {
      if (getDepartment(a.position) === activeDepartment) {
        s.all++;
        const status = a.status as keyof typeof s;
        if (status in s) s[status]++;
      }
    });
    return s;
  }, [applicants, activeDepartment]);

  // Filtering Logic
  const filteredApplicants = useMemo(() => {
    return applicants
      .filter((a) => {
        if (getDepartment(a.position) !== activeDepartment) return false;
        if (activeStatus !== "all" && a.status !== activeStatus) return false;
        if (selectedRole !== "all" && a.position !== selectedRole) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            a.full_name.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            a.phone.includes(q) ||
            a.position.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortField === "updated") {
          valA = a.updated.length > 0 ? a.updated[a.updated.length - 1] : a.created_time;
          valB = b.updated.length > 0 ? b.updated[b.updated.length - 1] : b.created_time;
        } else {
          const field = sortField as keyof Applicant;
          const aVal = a[field];
          const bVal = b[field];
          valA = Array.isArray(aVal) ? aVal.length : (aVal as string | number);
          valB = Array.isArray(bVal) ? bVal.length : (bVal as string | number);
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [applicants, activeDepartment, activeStatus, searchQuery, selectedRole, sortField, sortOrder]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-20">
      <Header
        onRefresh={fetchApplicants}
        isPending={isPending}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-5 space-y-6 md:px-6 md:py-8 md:space-y-8">
        {/* Mobile Filter Trigger - Hidden On Desktop */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="relative w-full">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full pl-10 pr-4 text-sm font-medium rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFiltersOpen(true)}
            className="h-12 w-full rounded-2xl border-zinc-200 bg-white font-bold text-zinc-700 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(selectedRole !== "all" || activeStatus !== "pending" || sortField !== "created_time") && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">!</span>
            )}
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="hidden md:block"
        >
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">Welcome Back</h2>
          <p className="text-sm text-zinc-500">Manage your applicant pipeline and track performance.</p>
        </motion.div>

        <StatsRow stats={stats} />
        <AnalyticsSection />

        <div className="space-y-4 md:space-y-6">
          <div className="hidden md:flex flex-row md:items-end md:justify-between gap-3">
            <DepartmentTabs
              activeDepartment={activeDepartment}
              activeStatus={activeStatus}
              departmentCounts={departmentCounts}
              statusCounts={statusCountsForActiveDept}
              onDepartmentChange={(d) => handleFilterChange(() => {
                setActiveDepartment(d);
                setSelectedRole("all");
              })}
              onStatusChange={(s) => handleFilterChange(() => setActiveStatus(s))}
            />
            
            <FilterBar
              department={activeDepartment}
              searchQuery={searchQuery}
              onSearchChange={(q) => handleFilterChange(() => setSearchQuery(q))}
              selectedRole={selectedRole}
              onRoleChange={(r) => handleFilterChange(() => setSelectedRole(r))}
              sortField={sortField}
              onSortFieldChange={(f) => handleFilterChange(() => setSortField(f))}
              sortOrder={sortOrder}
              onSortOrderChange={(o) => handleFilterChange(() => setSortOrder(o))}
            />
          </div>


          <div className="min-h-[600px] relative">
            <AnimatePresence mode="wait">
              {applicants.length === 0 && isPending ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4"
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-3xl border border-zinc-200 bg-white p-4 space-y-4">
                      {/* Header skeleton */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-2.5 flex-1">
                          <Skeleton className="h-5 w-3/4 rounded-lg" />
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3 w-8 rounded-md" />
                            <Skeleton className="h-3 w-16 rounded-md" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      
                      {/* Contact rows skeleton */}
                      <div className="bg-zinc-50/50 rounded-2xl p-2.5 space-y-2">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </div>

                      {/* Footer actions skeleton */}
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-9 flex-1 rounded-xl" />
                        <Skeleton className="h-9 w-24 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : filteredApplicants.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex h-[450px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white/50 backdrop-blur-sm"
                >
                  <div className="rounded-full bg-zinc-100 p-4 mb-4">
                    <svg className="h-8 w-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-zinc-900">No applicants found</p>
                  <p className="text-sm text-zinc-500 mt-1 max-w-[250px] text-center">We couldn&apos;t find any results matching your search or filters.</p>
                  <button
                    onClick={() => handleFilterChange(() => {
                      setActiveStatus("all");
                      setSelectedRole("all");
                      setSearchQuery("");
                    })}
                    className="mt-6 rounded-full bg-zinc-900 px-6 py-2 text-xs font-bold text-white transition-transform active:scale-95 hover:bg-zinc-800"
                  >
                    Clear all filters
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {filteredApplicants.slice(0, displayLimit).map((applicant, i) => (
                        <ApplicantCard
                          key={applicant.id}
                          applicant={applicant}
                          onSave={saveApplicant}
                          isPending={isPending}
                          index={i}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {filteredApplicants.length > displayLimit && (
                    <div className="flex items-center justify-center gap-3 pt-6 flex-col sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => setDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                        className="w-full sm:w-auto font-bold text-xs px-8 rounded-full h-10 transition-all hover:bg-zinc-900 hover:text-white"
                      >
                        Load More ({filteredApplicants.length - displayLimit} left)
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setDisplayLimit(filteredApplicants.length)}
                        className="w-full sm:w-auto font-bold text-xs px-8 rounded-full h-10 transition-all hover:bg-zinc-100"
                      >
                        View All Applicants
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <MobileFilters
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        activeDepartment={activeDepartment}
        departmentCounts={departmentCounts}
        statusCounts={statusCountsForActiveDept}
        onDepartmentChange={(d: Department) => handleFilterChange(() => {
          setActiveDepartment(d);
          setSelectedRole("all");
        })}
        activeStatus={activeStatus}
        onStatusChange={(s: ApplicantStatus | "all") => handleFilterChange(() => setActiveStatus(s))}
        selectedRole={selectedRole}
        onRoleChange={(r: Role | "all") => handleFilterChange(() => setSelectedRole(r))}
        sortField={sortField}
        onSortFieldChange={(f: SortField) => handleFilterChange(() => setSortField(f))}
        sortOrder={sortOrder}
        onSortOrderChange={(o: SortOrder) => handleFilterChange(() => setSortOrder(o))}
      />
    </div>
  );
}
