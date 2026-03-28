"use client";

import { useMemo, useState, useTransition, useEffect, useCallback } from "react";
import { useMounted } from "@/hooks/useMounted";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { motion, type Variants } from "framer-motion";
import { ROLE_SHORT_NAMES } from "@/lib/roles";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Role } from "@/lib/roles";
import type { AnalyticsEntry } from "@/app/api/analytics/route";
import type { Applicant } from "@/types";

const chartConfig = {
  pending:    { label: "Pending",    color: "var(--chart-1)" },
  interested: { label: "Interested", color: "var(--chart-3)" },
  inprocess:  { label: "In Process", color: "var(--chart-4)" },
  rejected:   { label: "Rejected",   color: "var(--chart-2)" },
} as const;

const STATUS_KEYS = ["pending", "interested", "inprocess", "rejected"] as const;




interface AggregatedPoint {
  date: string;
  pending: number;
  interested: number;
  inprocess: number;
  rejected: number;
}

// ─── Pill shape: upright bars (Trends bar chart) ────────────────────────────
// Rounds only the top two corners so bars sit flush on the axis baseline.
const PillBarUpright = (props: { x: number; y: number; width: number; height: number; fill?: string; }) => {
  const { x, y, width, height, fill = "" } = props;
  if (!width || !height || height <= 0 || width <= 0) return null;
  const r = Math.min(width / 2, 6);
  return (
    <path
      d={`
        M ${x + r},${y}
        H ${x + width - r}
        Q ${x + width},${y} ${x + width},${y + r}
        V ${y + height}
        H ${x}
        V ${y + r}
        Q ${x},${y} ${x + r},${y}
        Z
      `}
      fill={fill}
    />
  );
};

// ─── Pill shape: horizontal stacked bars (Role Breakdown) ───────────────────
// Rounds only the outermost ends of the full stack so each row reads as one pill.
const PillBarHorizontal = (props: { x: number; y: number; width: number; height: number; fill?: string; isFirst: boolean; isLast: boolean; }) => {
  const { x, y, width, height, fill = "", isFirst, isLast } = props;
  if (!width || !height || height <= 0 || width <= 0) return null;
  const r  = Math.min(height / 2, 7);
  const lR = isFirst ? r : 0;
  const rR = isLast  ? r : 0;
  return (
    <path
      d={`
        M ${x + lR},${y}
        H ${x + width - rR}
        Q ${x + width},${y} ${x + width},${y + r}
        V ${y + height - r}
        Q ${x + width},${y + height} ${x + width - rR},${y + height}
        H ${x + lR}
        Q ${x},${y + height} ${x},${y + height - r}
        V ${y + r}
        Q ${x},${y} ${x + lR},${y}
        Z
      `}
      fill={fill}
    />
  );
};

const analyticsVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: 0.15 },
  },
};

interface AnalyticsSectionProps {
  applicants: Applicant[];
}

export default function AnalyticsSection({ applicants }: AnalyticsSectionProps) {
  const [entries, setEntries]               = useState<AnalyticsEntry[]>([]);
  const [earliestDate, setEarliestDate]     = useState<Date | undefined>(undefined);
  const [chartType, setChartType]           = useState<"area" | "bar">("area");
  const [statusFilter, setStatusFilter]     = useState<string>("all");
  const [trendDateRange, setTrendDateRange] = useState<DateRange | undefined>(undefined);
  const [roleDateRange, setRoleDateRange]   = useState<DateRange | undefined>(undefined);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [csvDateRange, setCSVDateRange]     = useState<DateRange | undefined>(undefined);
  const mounted = useMounted();
  const [, startTransition] = useTransition();

  const fetchAnalytics = useCallback(() => {
    startTransition(async () => {
      try {
        const res  = await fetch("/api/analytics");
        if (!res.ok) return;
        const data = (await res.json()) as { entries: AnalyticsEntry[] };
        const fetched = data.entries ?? [];
        setEntries(fetched);

        // Parse "YYYY-MM-DD" as LOCAL date (not UTC) to avoid timezone shifting
        const toLocalDate = (dateStr: string): Date => {
          const [y, m, d] = dateStr.split("-").map(Number);
          return new Date(y, m - 1, d); // local midnight — no UTC offset issue
        };

        // Derive the earliest date dynamically from real data
        if (fetched.length > 0) {
          const earliest = fetched.reduce<Date>((min, e) => {
            const d = toLocalDate(e.date);
            return d < min ? d : min;
          }, toLocalDate(fetched[0].date));
          const today = new Date();
          setEarliestDate(earliest);
          setTrendDateRange((prev) => prev ?? { from: earliest, to: today });
          setRoleDateRange((prev)  => prev ?? { from: earliest, to: today });
        }
      } catch { /* handle error */ }
    });
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // ── Aggregate: Trends ──────────────────────────────────────────────────────
  const filteredAnalytics = useMemo(() => {
    if (!entries.length || !trendDateRange?.from) return [];
    const from    = startOfDay(trendDateRange.from);
    const to      = endOfDay(trendDateRange.to || trendDateRange.from);
    const dateMap = new Map<string, Omit<AggregatedPoint, "date">>();

    entries.forEach((entry) => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start: from, end: to })) {
        const key = format(entryDate, "dd MMM");
        if (!dateMap.has(key))
          dateMap.set(key, { pending: 0, interested: 0, inprocess: 0, rejected: 0 });
        const counts = dateMap.get(key)!;
        if (entry.status in counts)
          counts[entry.status as keyof typeof counts]++;
      }
    });

    const result: AggregatedPoint[] = Array.from(dateMap.entries()).map(
      ([date, counts]) => ({ date, ...counts })
    );
    if (statusFilter === "all") return result;
    return result.map((p) => ({
      date:       p.date,
      pending:    statusFilter === "pending"    ? p.pending    : 0,
      interested: statusFilter === "interested" ? p.interested : 0,
      inprocess:  statusFilter === "inprocess"  ? p.inprocess  : 0,
      rejected:   statusFilter === "rejected"   ? p.rejected   : 0,
    } as AggregatedPoint));
  }, [entries, statusFilter, trendDateRange]);

  // ── Aggregate: Role Breakdown ──────────────────────────────────────────────
  const formattedRoleData = useMemo(() => {
    if (!entries.length || !roleDateRange?.from) return [];
    const from    = startOfDay(roleDateRange.from);
    const to      = endOfDay(roleDateRange.to || roleDateRange.from);
    const roleMap = new Map<string, Omit<AggregatedPoint, "date">>();

    entries.forEach((entry) => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start: from, end: to })) {
        if (!roleMap.has(entry.role))
          roleMap.set(entry.role, { pending: 0, interested: 0, inprocess: 0, rejected: 0 });
        const counts = roleMap.get(entry.role)!;
        if (entry.status in counts)
          counts[entry.status as keyof typeof counts]++;
      }
    });

    return Array.from(roleMap.entries()).map(([role, counts]) => ({
      role,
      ...counts,
      shortRole: ROLE_SHORT_NAMES[role as Role] || role,
      fullName:  role,
    }));
  }, [entries, roleDateRange]);

  const handleCSVExport = () => {
    if (!csvDateRange?.from) {
      console.warn("CSV Export: No start date selected.");
      return;
    }
    const from = startOfDay(csvDateRange.from);
    const to   = endOfDay(csvDateRange.to || csvDateRange.from);

    console.log(`CSV Export: Start=${from}, End=${to}, TotalApplicants=${applicants.length}`);

    const filtered = applicants.filter((a) => {
      // Try parsing as ISO, fallback to direct native parser
      let d = parseISO(a.created_time);
      if (isNaN(d.getTime())) {
        d = new Date(a.created_time);
      }
      
      if (isNaN(d.getTime())) {
        console.error(`CSV Export: Invalid date for applicant ${a.full_name}: ${a.created_time}`);
        return false;
      }
      
      return isWithinInterval(d, { start: from, end: to });
    });

    console.log(`CSV Export: Found ${filtered.length} matching records.`);

    if (filtered.length === 0) {
      alert("No applicant records found for the selected date range.");
      return;
    }

    const headers = ["Created Time", "Name", "Position", "Email", "Phone", "Status", "Feedback"];
    const rows    = filtered.map((a) => {
      let d = parseISO(a.created_time);
      if (isNaN(d.getTime())) {
        d = new Date(a.created_time);
      }
      
      const dateStr = isNaN(d.getTime()) ? a.created_time : format(d, "yyyy-MM-dd HH:mm:ss");

      return [
        dateStr,
        `"${a.full_name.replace(/"/g, '""')}"`,
        `"${a.position}"`,
        a.email,
        a.phone,
        a.status,
        `"${a.feedback.replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `applicants_${format(from, "yyyyMMdd")}_${format(to, "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setIsCSVModalOpen(false);
  };

  const activeKeys =
    statusFilter === "all"
      ? STATUS_KEYS
      : STATUS_KEYS.filter((k) => k === statusFilter);

  return (
    <motion.div
      className="grid gap-3 md:grid-cols-2 md:gap-4"
      variants={analyticsVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Trend Chart ───────────────────────────────────────────────────── */}
      <Card className="shadow-sm overflow-hidden outline-none ring-0 focus:ring-0 focus-within:ring-0">
        <CardHeader className="py-4 px-6 md:px-6 space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground md:text-sm">
              Application Trends
            </CardTitle>
            <DatePickerWithRange date={trendDateRange} setDate={setTrendDateRange} minDate={earliestDate} />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/50">
              <Button
                variant={chartType === "area" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-[10px] px-2.5 font-bold shadow-none hover:bg-white"
                onClick={() => setChartType("area")}
              >
                Line
              </Button>
              <Button
                variant={chartType === "bar" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-[10px] px-2.5 font-bold shadow-none hover:bg-white"
                onClick={() => setChartType("bar")}
              >
                Bar
              </Button>
            </div>

            <Dialog open={isCSVModalOpen} onOpenChange={setIsCSVModalOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] px-3 font-bold text-zinc-600 bg-white"
                  >
                    CSV
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-zinc-900">Export Applicants CSV</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                  <p className="text-sm text-zinc-500">
                    Select a date range to export all applicant records within that period.
                  </p>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date Range</label>
                    <DatePickerWithRange 
                      date={csvDateRange} 
                      setDate={setCSVDateRange} 
                      minDate={earliestDate}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsCSVModalOpen(false)}
                    className="rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCSVExport}
                    disabled={!csvDateRange?.from}
                    className="bg-primary text-white hover:bg-primary/80 cursor-pointer rounded-xl font-bold text-xs px-6"
                  >
                    Download CSV
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="h-4 w-px bg-zinc-200 mx-1" />

            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="h-8 w-28 text-[10px] md:w-32 md:text-xs border-zinc-200 bg-white focus:ring-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                <SelectSeparator />
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="inprocess">In Process</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="h-56 p-3 pr-6 pt-0 md:h-64 md:py-4 md:pr-6 md:pt-0">
          {filteredAnalytics.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No data in selected range
            </div>
          ) : mounted ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              {chartType === "area" ? (
                <AreaChart data={filteredAnalytics} accessibilityLayer={false}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-[10px] md:text-xs" hide={false} />
                  <YAxis className="text-[10px] md:text-xs" width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {activeKeys.map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      fill={chartConfig[key].color}
                      stroke={chartConfig[key].color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                      animationDuration={2000}
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={filteredAnalytics} margin={{ left: 6, right: 6 }} barSize={14} accessibilityLayer={false}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-[10px] md:text-xs" />
                  <YAxis className="text-[10px] md:text-xs" width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {activeKeys.map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={chartConfig[key].color}
                      animationDuration={2000}
                      shape={(p) => <PillBarUpright {...p} />}
                    />
                  ))}
                </BarChart>
              )}
            </ChartContainer>
          ) : (
            <div className="h-full w-full bg-zinc-50/50 rounded-lg animate-pulse" />
          )}
        </CardContent>
      </Card>

      {/* ── Role Breakdown ────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="py-4 px-6 md:px-6 pb-16 space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground md:text-sm">
              Role Breakdown
            </CardTitle>
            <DatePickerWithRange date={roleDateRange} setDate={setRoleDateRange} minDate={earliestDate} />
          </div>
        </CardHeader>

        <CardContent className="h-56 p-3 pt-0 md:h-64 md:p-4 md:pt-0">
          {formattedRoleData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No data in range
            </div>
          ) : mounted ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                data={formattedRoleData}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
                barSize={14}
                accessibilityLayer={false}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis type="number" className="text-[10px] md:text-xs" />
                <YAxis
                  dataKey="shortRole"
                  type="category"
                  className="text-[10px] font-bold text-muted-foreground"
                  width={40}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "transparent" }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) =>
                        payload?.[0]?.payload?.fullName || value
                      }
                    />
                  }
                />
                {STATUS_KEYS.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={chartConfig[key].color}
                    stackId="a"
                    animationDuration={2000}
                    shape={(p) => (
                      <PillBarHorizontal
                        {...p}
                        isFirst={i === 0}
                        isLast={i === STATUS_KEYS.length - 1}
                      />
                    )}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full w-full bg-zinc-50/50 rounded-lg animate-pulse" />
            )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Avoids hydration text-node collisions
const SelectSeparator = () => <div className="h-px bg-zinc-100 my-1 mx-[-4px]" />;