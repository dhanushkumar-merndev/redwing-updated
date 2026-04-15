"use client";

import { useState, useEffect, useMemo, useCallback, useDeferredValue } from "react";
import { AnimatePresence, LayoutGroup, motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import Header from "@/components/dashboard/Header";
import StatsRow from "@/components/dashboard/StatsRow";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import DepartmentTabs from "@/components/dashboard/DepartmentTabs";
import FilterBar from "@/components/dashboard/FilterBar";
import ApplicantCard from "@/components/dashboard/ApplicantCard";
import { useApplicants } from "@/hooks/useApplicants";
import { useMounted } from "@/hooks/useMounted";
import UserRegistrationDialog from "@/components/dashboard/UserRegistrationDialog";
import SessionErrorDialog from "@/components/dashboard/SessionErrorDialog";

import { getDepartment } from "@/lib/roles";
import type { Department, ApplicantStatus, SortField, SortOrder, Role, Applicant } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { resizeLenis, scrollToPosition } from "@/lib/lenis";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getFromDB } from "@/lib/db";
import { decryptName } from "@/lib/crypto";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOBILE_ITEMS_PER_PAGE = 15;
const DESKTOP_DEFAULT_PAGE_SIZE = 18; // Keep 18 as default, then user can select 25, 50, 100


const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.4, // Slightly faster
      ease: [0.22, 1, 0.36, 1] as const, 
      delay: delay * 0.5 // Reduce delay factor for snappier feel
    },
  },
});

export default function DashboardPage() {
  const { applicants, isPending, updatingId, fetchApplicants, saveApplicant, consecutive404Count, handle404 } = useApplicants();
  const mounted = useMounted();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [activeDepartment, setActiveDepartment] = useState<Department>("sales");
  const [activeStatus, setActiveStatus] = useState<ApplicantStatus | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
  const [sortField, setSortField] = useState<SortField>("created_time");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DESKTOP_DEFAULT_PAGE_SIZE);
  const [showAllWarning, setShowAllWarning] = useState(false);
  const [pendingPageSize, setPendingPageSize] = useState<number>(DESKTOP_DEFAULT_PAGE_SIZE);

  const [activeMobileView, setActiveMobileView] = useState<"dashboard" | "applicants">("dashboard");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  
  
  // -- Identity & Motivation --
  const [userName, setUserName] = useState<string>("User");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const quotes = useMemo(() => [
    "Manage your applicant pipeline and track performance.",
    "The secret of getting ahead is getting started.",
    "Opportunities don't happen, you create them.",
    "The only way to do great work is to love what you do.",
    "Don't count the days, make the days count.",
    "Focus on your goals, everything else is just noise."
  ], []);

  useEffect(() => {
    const fetchUser = async () => {
      const encrypted = await getFromDB();
      if (encrypted) {
        const decrypted = await decryptName(encrypted);
        if (decrypted) setUserName(decrypted);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes]);

  useEffect(() => {
    fetchApplicants(() => setLastUpdated(new Date()));
  }, [fetchApplicants]);

  const effectivePageSize = mounted && isDesktop ? pageSize : MOBILE_ITEMS_PER_PAGE;

  useEffect(() => {
    const timer = setTimeout(() => resizeLenis(), 100);
    return () => clearTimeout(timer);
  }, [applicants, effectivePageSize, currentPage, activeDepartment, activeStatus]);

  const handleFilterChange = useCallback((updater: () => void) => {
    updater();
    setCurrentPage(1);
  }, []);

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
    const s = { all: 0, pending: 0, interested: 0, inprocess: 0, rnr: 0, rejected: 0 };
    applicants.forEach((a) => {
      if (getDepartment(a.position) === activeDepartment) {
        s.all++;
        const status = a.status as keyof typeof s;
        if (status in s) s[status]++;
      }
    });
    return s;
  }, [applicants, activeDepartment]);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSelectedRole = useDeferredValue(selectedRole);

  const filteredApplicants = useMemo(() => {
    return applicants
      .filter((a) => {
        if (getDepartment(a.position) !== activeDepartment) return false;
        if (activeStatus !== "all" && a.status !== activeStatus) return false;
        if (deferredSelectedRole !== "all" && a.position !== deferredSelectedRole) return false;
        if (deferredSearchQuery) {
          const q = deferredSearchQuery.toLowerCase();
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
        
        if (sortField === "created_time" || sortField === "updated") {
          const getTimestamp = (app: Applicant) => {
            if (sortField === "updated" && app.updated.length > 0) {
              const lastUpdate = app.updated[app.updated.length - 1].split("|")[0];
              return new Date(lastUpdate).getTime() || 0;
            }
            return new Date(app.created_time).getTime() || 0;
          };
          valA = getTimestamp(a);
          valB = getTimestamp(b);
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
  }, [applicants, activeDepartment, activeStatus, deferredSearchQuery, deferredSelectedRole, sortField, sortOrder]);

  const { paginatedApplicants, totalPages } = useMemo(() => {
    const total = filteredApplicants.length;
    const pages = Math.ceil(total / effectivePageSize);
    const start = (currentPage - 1) * effectivePageSize;
    const end = start + effectivePageSize;
    return {
      paginatedApplicants: filteredApplicants.slice(start, end),
      totalPages: pages,
    };
  }, [filteredApplicants, currentPage, effectivePageSize]);

  const handlePageSizeChange = (val: string | null) => {
    if (!val) return;
    const size = parseInt(val);
    if (size === 72 || size === 90) {
      setPendingPageSize(size);
      setShowAllWarning(true);
    } else {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  const confirmShowAll = () => {
    setPageSize(pendingPageSize);
    setCurrentPage(1);
    setShowAllWarning(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // On mobile, always scroll to the very top of the list view (y=0) 
    // Since the list and dashboard are separated views on mobile.
    if (!isDesktop) {
      scrollToPosition(0);
      return;
    }

    // Scroll to filters/tabs section on desktop (keeping stats/analytics visible at the top)
    const element = document.getElementById("applicants-list-anchor");
    if (element) {
      const rect = element.getBoundingClientRect();
      const offset = 100; // Slightly more offset to see the tabs clearly
      scrollToPosition(window.scrollY + rect.top - offset);
    }
  };

  const departmentTabsProps = {
    activeDepartment,
    activeStatus,
    departmentCounts,
    statusCounts: statusCountsForActiveDept,
    onDepartmentChange: (d: Department) => handleFilterChange(() => {
      setActiveDepartment(d);
      setSelectedRole("all");
    }),
    onStatusChange: (s: ApplicantStatus | "all") => handleFilterChange(() => setActiveStatus(s)),
  };



  const [prevIsDesktop, setPrevIsDesktop] = useState(isDesktop);
  if (isDesktop !== prevIsDesktop) {
    setPrevIsDesktop(isDesktop);
    setCurrentPage(1);
  }

  const WelcomeHeader = useMemo(() => {
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    
    if (hour < 12) {
      greeting = "Good Morning";
    } else if (hour < 17) {
      greeting = "Good Afternoon";
    }

    return (
      <motion.div 
        variants={fadeUp(0)} 
        initial="hidden" 
        animate="visible"
        className="space-y-1.5"
      >
        <div className="flex items-center gap-2">
          <motion.h2 
            className="text-xl font-bold tracking-tight text-foreground md:text-3xl"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {greeting}, {userName}
          </motion.h2>
        </div>
        <AnimatePresence mode="wait">
          <motion.p 
            key={quoteIndex}
            className="text-sm text-muted-foreground md:text-base font-medium max-w-sm h-6"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
          >
            {quotes[quoteIndex]}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    );
  }, [userName, quoteIndex, quotes]);

  const DashboardContent = (
    <div className="space-y-3 mt-2">
      <StatsRow stats={stats} />
      <AnalyticsSection applicants={applicants} on404={handle404} />
      {mounted && !isDesktop && (
        <Button
          onClick={() => {
            setActiveMobileView("applicants");
            setTimeout(() => resizeLenis(), 50);
            setTimeout(() => scrollToPosition(0), 100);
          }}
          className="w-full h-12 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 group mb-6"
        >
          View Applicant Database
          <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      )}
    </div>
  );

  const ApplicantsListContent = (
    <div className="space-y-4 md:space-y-6">
      {mounted && !isDesktop && (
        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveMobileView("dashboard")}
            className="rounded-xl h-9 px-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Overview
          </Button>
          <div className="h-4 w-px bg-border" />
          <h3 className="text-sm font-bold text-foreground">Applicant Database</h3>
        </div>
      )}

      <div id="applicants-list-anchor" className="scroll-mt-24" />
      <motion.div 
        key="filters" 
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-3" 
        variants={fadeUp(0.05)} 
        initial="hidden" 
        animate="visible"
      >
        <div className="w-full min-w-0 sm:flex-1">
          <DepartmentTabs {...departmentTabsProps} />
        </div>
        <div className="w-full sm:w-auto sm:shrink-0">
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
          activeStatus={activeStatus}
          onStatusChange={(s) => handleFilterChange(() => setActiveStatus(s))}
        />
      </div>
      </motion.div>

      <div className="min-h-[600px] relative">
        <AnimatePresence mode="wait">
          {applicants.length === 0 && isPending ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4 p-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl border border-border bg-card p-4 space-y-4 min-h-[220px] md:min-h-[440px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2.5 flex-1">
                      <Skeleton className="h-6 w-3/4 rounded-xl" />
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-4 w-12 rounded-lg" />
                        <div className="text-border/40">/</div>
                        <Skeleton className="h-4 w-24 rounded-lg" />
                      </div>
                    </div>
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-10 flex-1 rounded-full" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filteredApplicants.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex h-[450px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card backdrop-blur-sm">
              <div className="rounded-full bg-accent p-4 mb-4">
                <svg className="h-8 w-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-base font-bold text-foreground">No applicants found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[250px] text-center">We couldn&apos;t find any results matching your search or filters.</p>
              <button onClick={() => handleFilterChange(() => { setActiveStatus("all"); setSelectedRole("all"); setSearchQuery(""); })} className="mt-6 rounded-full bg-primary px-6 py-2 text-xs font-bold text-primary-foreground transition-transform active:scale-95 hover:bg-primary/80">
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <LayoutGroup>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4 p-1">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {paginatedApplicants.map((applicant, i) => (
                      <ApplicantCard 
                        key={applicant.id} 
                        applicant={applicant} 
                        onSave={saveApplicant} 
                        isPending={isPending} 
                        isSaving={updatingId === applicant.id}
                        index={i} 
                        isDesktop={isDesktop}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </LayoutGroup>

              {/* Pagination and Rows Per Page */}
              <div className="flex flex-col gap-6 py-8 border-t border-border mt-8">
                {/* Desktop Layout: 3 Columns [Rows per Page (Left) | Pagination (Center) | Count (Right)] */}
                <div className="hidden md:grid md:grid-cols-[200px_1fr_200px] md:items-center w-full">
                  {/* Left: Rows Per Page */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Rows per page
                    </span>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="h-9 w-[70px] rounded-full text-[11px] font-black bg-secondary border-none shadow-sm hover:bg-secondary/80 transition-colors">
                        <SelectValue placeholder={pageSize.toString()} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border shadow-2xl">
                        {[18, 36, 54, 72, 90].map((v) => (
                          <SelectItem key={v} value={v.toString()} className="text-[11px] font-black py-2 cursor-pointer focus:bg-primary/10">
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Center: Pagination */}
                  <div className="flex justify-center">
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent className="gap-1">
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                              className={cn(
                                "cursor-pointer h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-border bg-background hover:bg-muted active:scale-95 transition-all",
                                currentPage === 1 && "pointer-events-none opacity-30"
                              )}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            if (totalPages > 5) {
                              if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                if (pageNum === 2 || pageNum === totalPages - 1) {
                                  return (
                                    <PaginationItem key={pageNum}>
                                      <PaginationEllipsis className="h-9 w-9 text-muted-foreground/40" />
                                    </PaginationItem>
                                  );
                                }
                                return null;
                              }
                            }
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink 
                                  isActive={currentPage === pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={cn(
                                    "cursor-pointer h-9 w-9 rounded-lg text-[11px] font-black transition-all active:scale-95",
                                    currentPage === pageNum 
                                      ? "bg-primary! text-white! shadow-md shadow-primary/20 hover:bg-primary/90!" 
                                      : "bg-background border border-border text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}

                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                              className={cn(
                                "cursor-pointer h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-border bg-background hover:bg-muted active:scale-95 transition-all text-xs font-black",
                                currentPage === totalPages && "pointer-events-none opacity-30"
                              )}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>

                  {/* Right: Count */}
                  <div className="flex justify-end pr-1">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[11px] font-black text-foreground">
                        {Math.min((currentPage - 1) * effectivePageSize + 1, filteredApplicants.length)}-{Math.min(currentPage * effectivePageSize, filteredApplicants.length)} out of {filteredApplicants.length}
                      </span>
                      <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">
                        Applicants
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout: Row Wise [Count top | Pagination below] */}
                <div className="md:hidden flex flex-col items-center gap-2 w-full">
                  {/* Showing Count (Mobile) */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-black tracking-[0.1em] text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * effectivePageSize + 1, filteredApplicants.length)}-{Math.min(currentPage * effectivePageSize, filteredApplicants.length)} out of {filteredApplicants.length}
                    </span>
                  </div>

                  {/* Pagination (Mobile) */}
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent className="gap-1.5 overflow-x-auto no-scrollbar py-2 max-w-[100vw] justify-center">
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={cn(
                              "cursor-pointer h-9 w-9 p-0 rounded-full border-border bg-background text-foreground shadow-sm",
                              currentPage === 1 && "pointer-events-none opacity-30"
                            )}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (totalPages > 4) {
                            if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                              if (pageNum === 2 || pageNum === totalPages - 1) {
                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationEllipsis className="h-9 w-4 text-muted-foreground/30" />
                                  </PaginationItem>
                                );
                              }
                              return null;
                            }
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                isActive={currentPage === pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={cn(
                                  "cursor-pointer  h-9 w-9 rounded-full text-[11px] font-black transition-all",
                                  currentPage === pageNum 
                                    ? "bg-primary! text-white shadow-lg shadow-primary/20" 
                                    : "bg-background border border-border text-muted-foreground"
                                )}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={cn(
                              "cursor-pointer h-9 w-9 p-0 rounded-full border-border bg-background text-foreground shadow-sm",
                              currentPage === totalPages && "pointer-events-none opacity-30"
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={showAllWarning} onOpenChange={setShowAllWarning}>
        <DialogContent className="max-w-[400px] rounded-3xl border-none p-6 shadow-2xl">
          <DialogHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-bold">Performance Warning</DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground pt-2">
              Showing {pendingPageSize === filteredApplicants.length ? "all" : ""} {pendingPageSize} applicants at once may slow down your browser or cause the application to hang. Do you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:flex-row flex-col">
            <Button variant="ghost" onClick={() => setShowAllWarning(false)} className="flex-1 rounded-full font-bold h-11 text-muted-foreground hover:bg-muted">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmShowAll} className="flex-1 rounded-full font-bold h-11 bg-primary! text-primary-foreground! hover:bg-primary/90!">
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10 selection:text-primary">
      <UserRegistrationDialog onSuccess={setUserName} />
      <SessionErrorDialog consecutive404Count={consecutive404Count} />
      <Header 
        onRefresh={() => fetchApplicants(() => setLastUpdated(new Date()))} 
        isPending={isPending} 
        lastUpdated={lastUpdated}
      />

      <main className="mx-auto md:mt-4 w-full max-w-7xl px-[var(--dash-container-padding)] py-[var(--dash-container-padding)] space-y-[var(--dash-gap)] md:space-y-[var(--dash-section-gap)]">
        {mounted && isDesktop && WelcomeHeader}

        {mounted ? (
          isDesktop ? (
            <>
              {DashboardContent}
              {ApplicantsListContent}
            </>
          ) : (
            <div className="relative">
              {/* Dashboard Content - Always mounted to avoid chart repaint lag */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: activeMobileView === "dashboard" ? 1 : 0,
                  y: activeMobileView === "dashboard" ? 0 : 5
                }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1] as const
                }}
                className={cn(
                  "w-full transition-all duration-300",
                  activeMobileView !== "dashboard" ? "pointer-events-none absolute inset-0 invisible opacity-0 h-0 overflow-hidden" : "visible opacity-100"
                )}
              >
                {DashboardContent}
              </motion.div>

              {/* Applicants List - Keeps filter state and list scroll position */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: activeMobileView === "applicants" ? 1 : 0,
                  y: activeMobileView === "applicants" ? 0 : 5
                }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1] as const
                }}
                className={cn(
                  "w-full transition-all duration-300",
                  activeMobileView !== "applicants" ? "pointer-events-none absolute inset-0 invisible opacity-0 h-0 overflow-hidden" : "visible opacity-100"
                )}
              >
                {ApplicantsListContent}
              </motion.div>
            </div>
          )
        ) : (
          <div className="space-y-8 animate-pulse">
            <div className="h-32 bg-muted/50 rounded-3xl" />
            <div className="h-64 bg-muted/50 rounded-3xl" />
            <div className="h-96 bg-muted/50 rounded-3xl" />
          </div>
        )}
      </main>
    </div>
  );
}
