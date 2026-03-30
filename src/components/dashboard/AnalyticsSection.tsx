"use client";

import { useMemo, useState, useTransition, useEffect, useCallback, memo, useDeferredValue } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, isWithinInterval, startOfDay, endOfDay, parseISO, eachDayOfInterval } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { AnalyticsEntry } from "@/app/api/analytics/route";
import type { Applicant } from "@/types";
import { ChartNoAxesCombined, BarChart3, Filter, Download } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface PreparedEntry extends AnalyticsEntry {
  _created: Date;
  _completed: Date | null;
}

// ─── Constants & Config ──────────────────────────────────────────────────────

const chartConfig = {
  pending:    { label: "Pending",    color: "var(--chart-1)" },
  interested: { label: "Interested", color: "var(--chart-3)" },
  inprocess:  { label: "In Process", color: "var(--chart-4)" },
  rejected:   { label: "Rejected",   color: "var(--chart-2)" },
  backlog:    { label: "Carry Pending (Total)", color: "var(--chart-1)" },
  completed:  { label: "Completed Today", color: "var(--chart-3)" },
  newLeads:   { label: "Actually Pending (New)", color: "var(--chart-4)" },
} as const;

const STATUS_KEYS = ["pending", "interested", "inprocess", "rejected"] as const;

interface AggregatedPoint {
  date: string;
  pending: number;
  interested: number;
  inprocess: number;
  rejected: number;
}

const isStatus = (s: string): s is keyof Omit<AggregatedPoint, "date"> => {
  return (STATUS_KEYS as readonly string[]).includes(s);
};

// ─── Sub-Components (Memoized) ────────────────────────────────────────────────

interface PillBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * PillBarUpright: Rounds only the top two corners for vertical bars.
 */
const PillBarUpright = memo((props: PillBarProps) => {
  const { x = 0, y = 0, width = 0, height = 0, fill = "" } = props;
  if (!width || !height || height <= 0 || width <= 0) return null;
  const r = Math.min(width / 2, 6);
  return (
    <path
      d={`M ${x + r},${y} H ${x + width - r} Q ${x + width},${y} ${x + width},${y + r} V ${y + height} H ${x} V ${y + r} Q ${x},${y} ${x + r},${y} Z`}
      fill={fill}
    />
  );
});
PillBarUpright.displayName = "PillBarUpright";

/**
 * PillBarHorizontal: Rounds ends of stacked horizontal bars.
 */
const PillBarHorizontal = memo((props: PillBarProps) => {
  const { x = 0, y = 0, width = 0, height = 0, fill = "", isFirst, isLast } = props;
  if (!width || !height || height <= 0 || width <= 0) return null;
  const r  = Math.min(height / 2, 7);
  const lR = isFirst ? r : 0;
  const rR = isLast  ? r : 0;
  return (
    <path
      d={`M ${x + lR},${y} H ${x + width - rR} Q ${x + width},${y} ${x + width},${y + r} V ${y + height - r} Q ${x + width},${y + height} ${x + width - rR},${y + height} H ${x + lR} Q ${x},${y + height} ${x},${y + height - r} V ${y + r} Q ${x},${y} ${x + lR},${y} Z`}
      fill={fill}
    />
  );
});
PillBarHorizontal.displayName = "PillBarHorizontal";

/**
 * 📈 TrendChart: Isolated Trend rendering
 */
const TrendChart = memo(({ data, type, activeKeys }: { data: AggregatedPoint[], type: "area" | "bar", activeKeys: (keyof typeof chartConfig)[] }) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  if (data.length === 0) return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data in range</div>;
  
  return (
    <ChartContainer config={chartConfig} className="h-full w-full px-0 sm:px-2">
      {type === "area" ? (
        <AreaChart 
          data={data} 
          margin={{ left: isMobile ? -5 : -15, right: 10, top: 10, bottom: 0 }} 
          accessibilityLayer={false}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis dataKey="date" className="text-[10px]" tickMargin={12} />
          <YAxis className="text-[10px]" width={isMobile ? 30 : 40} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {activeKeys.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              fill={chartConfig[key as keyof typeof chartConfig].color}
              stroke={chartConfig[key as keyof typeof chartConfig].color}
              fillOpacity={0.12}
              strokeWidth={2}
              animationDuration={600}
            />
          ))}
        </AreaChart>
      ) : (
        <BarChart 
          data={data} 
          margin={{ left: isMobile ? 0 : -10, right: 10, top: 10, bottom: isMobile ? -5 : 10}} 
          barSize={isMobile ? 12 : 14} 
          accessibilityLayer={false}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
          <XAxis dataKey="date" className="text-[10px]" tickMargin={8} />
          <YAxis className="text-[10px]" width={isMobile ? 25 : 35} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {activeKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={chartConfig[key as keyof typeof chartConfig].color}
              animationDuration={600}
              shape={(p: PillBarProps) => <PillBarUpright {...p} />}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );
});
TrendChart.displayName = "TrendChart";

/**
 * 📊 RoleBreakdownChart: Isolated Role rendering
 */
const RoleBreakdownChart = memo(({ data }: { data: (Omit<AggregatedPoint, "date"> & { shortRole: string, fullName: string })[] }) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  if (data.length === 0) return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No data in range</div>;

  return (
    <ChartContainer config={chartConfig} className="h-full w-full px-0 sm:px-2">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: isMobile ? 0 : -20, right: 10, top: 10 ,bottom:-13}}
        barSize={isMobile ? 12 : 14}
        accessibilityLayer={false}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} className="stroke-border/50" />
        <XAxis type="number" className="text-[10px]" />
        <YAxis
          dataKey="shortRole"
          type="category"
          className="text-[9px] font-bold text-muted-foreground"
          width={isMobile ? 40 : 60}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <ChartTooltip
          cursor={{ fill: "transparent" }}
          content={<ChartTooltipContent labelFormatter={(v, p) => p?.[0]?.payload?.fullName || v} />}
        />
        {STATUS_KEYS.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={chartConfig[key].color}
            stackId="a"
            animationDuration={400}
            shape={(p: PillBarProps) => (
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
  );
});
RoleBreakdownChart.displayName = "RoleBreakdownChart";

/**
 * ⚡ WorkflowEfficiencyChart: Isolated Workflow rendering
 */
interface WorkflowPoint {
  date: string;
  backlog: number;
  completed: number;
  newLeads: number;
}

const WorkflowEfficiencyChart = memo(({ data, mode, tooltip: WorkflowTooltip }: { data: WorkflowPoint[], mode: string, tooltip: React.ComponentType<{ active?: boolean, payload?: { dataKey: string, value: number, name: string, color: string }[] }> }) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  if (data.length === 0) return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Calculating metrics...</div>;

  return (
    <ChartContainer config={chartConfig} className="h-full w-full px-0 sm:px-2">
      <AreaChart 
        data={data} 
        margin={{ left: isMobile ? 10 : 0, right: 10, top: 10, bottom: -10 }} 
        accessibilityLayer={false}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
        <XAxis dataKey="date" className="text-[10px]" />
        <YAxis className="text-[10px]" width={isMobile ? 25 : 35} />
        <ChartTooltip content={<WorkflowTooltip />} />
        
        <Area
          type="monotone"
          dataKey="newLeads"
          fill={chartConfig.newLeads.color}
          stroke={chartConfig.newLeads.color}
          fillOpacity={0.05}
          strokeWidth={2}
          animationDuration={800}
        />

        {mode === "carry" && (
          <Area
            type="monotone"
            dataKey="backlog"
            fill={chartConfig.backlog.color}
            stroke={chartConfig.backlog.color}
            fillOpacity={0.08}
            strokeWidth={2}
            animationDuration={800}
          />
        )}

        <Area
          type="monotone"
          dataKey="completed"
          fill={chartConfig.completed.color}
          stroke={chartConfig.completed.color}
          fillOpacity={0.15}
          strokeWidth={2}
          animationDuration={800}
        />
      </AreaChart>
    </ChartContainer>
  );
});
WorkflowEfficiencyChart.displayName = "WorkflowEfficiencyChart";


// ─── Main Component (Memoized) ────────────────────────────────────────────────

const analyticsVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4, 
      ease: "easeOut", 
      delay: 0.1 
    } 
  },
};

interface AnalyticsSectionProps {
  applicants: Applicant[];
  on404?: () => void;
}

const AnalyticsSection = memo(function AnalyticsSection({ applicants, on404 }: AnalyticsSectionProps) {
  const [entries, setEntries]               = useState<PreparedEntry[]>([]);
  const deferredEntries                     = useDeferredValue(entries);
  
  const [earliestDate, setEarliestDate]     = useState<Date | undefined>(undefined);
  const [chartType, setChartType]           = useState<"area" | "bar">("area");
  const [statusFilter, setStatusFilter]     = useState<string>("all");
  
  const [trendDateRange, setTrendDateRange] = useState<DateRange | undefined>(undefined);
  const [roleDateRange, setRoleDateRange]   = useState<DateRange | undefined>(undefined);
  const [workflowDateRange, setWorkflowDateRange] = useState<DateRange | undefined>(undefined);
  
  const [workflowMode, setWorkflowMode]     = useState<"carry" | "unique">("carry");
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [csvDateRange, setCSVDateRange]     = useState<DateRange | undefined>(undefined);
  
  const [, startTransition] = useTransition();

  // Helper date parser
  const toLocalDate = useCallback((dateStr: string): Date => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, []);

  const fetchAnalytics = useCallback(() => {
    startTransition(async () => {
      try {
        const res  = await fetch("/api/analytics");
        if (!res.ok) {
          if (res.status === 404) on404?.();
          return;
        }
        const data = (await res.json()) as { entries: AnalyticsEntry[] };
        const fetched = data.entries ?? [];
        
        if (fetched.length > 0) {
          // Pre-parse dates to avoid expensive repeated parseISO/new Date calls in useMemo
          const prepared: PreparedEntry[] = fetched.map(e => ({
            ...e,
            _created: toLocalDate(e.createdDate),
            _completed: e.completedDate ? toLocalDate(e.completedDate) : null
          }));
          setEntries(prepared);

          const earliest = prepared.reduce<Date>((min, e) => {
            return e._created < min ? e._created : min;
          }, prepared[0]._created);

          const latest = prepared.reduce<Date>((max, e) => {
            return e._created > max ? e._created : max;
          }, prepared[0]._created);

          setEarliestDate(earliest);
          setTrendDateRange((prev) => prev ?? { from: earliest, to: latest });
          setRoleDateRange((prev)  => prev ?? { from: earliest, to: latest });
          setWorkflowDateRange((prev) => prev ?? { from: earliest, to: new Date() });
        }
      } catch (err) { console.error("Analytics fetch error:", err); }
    });
  }, [on404, toLocalDate]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Aggregation Logic (Now using deferred entries for buttery scroll)
  const trendData = useMemo(() => {
    if (!deferredEntries.length || !trendDateRange?.from) return [];
    const from = startOfDay(trendDateRange.from);
    const to   = endOfDay(trendDateRange.to || trendDateRange.from);
    const map  = new Map<string, AggregatedPoint>();

    eachDayOfInterval({ start: from, end: to }).forEach((day) => {
      map.set(format(day, "dd MMM"), { date: format(day, "dd MMM"), pending: 0, interested: 0, inprocess: 0, rejected: 0 });
    });

    (deferredEntries as unknown as PreparedEntry[]).forEach((e) => {
      const d = (e.status !== "pending" && e._completed) ? e._completed : e._created;
      if (d >= from && d <= to) {
        const key = format(d, "dd MMM");
        const point = map.get(key);
        if (point && isStatus(e.status)) {
          const statusKey = e.status as keyof Omit<AggregatedPoint, "date">;
          point[statusKey] = (Number(point[statusKey]) || 0) + 1;
        }
      }
    });

    const result = Array.from(map.values());
    if (statusFilter === "all") return result;
    return result.map(p => ({
      ...p,
      pending:    statusFilter === "pending"    ? p.pending : 0,
      interested: statusFilter === "interested" ? p.interested : 0,
      inprocess:  statusFilter === "inprocess"  ? p.inprocess : 0,
      rejected:   statusFilter === "rejected"   ? p.rejected : 0,
    }));
  }, [deferredEntries, trendDateRange, statusFilter]);

  const roleDataCalculated = useMemo(() => {
    if (!deferredEntries.length || !roleDateRange?.from) return { data: [], total: 0 };
    const from = startOfDay(roleDateRange.from);
    const to   = endOfDay(roleDateRange.to || roleDateRange.from);
    const map  = new Map<string, Omit<AggregatedPoint, "date">>();
    let total = 0;

    (deferredEntries as unknown as PreparedEntry[]).forEach((e) => {
      const d = e._created;
      if (d >= from && d <= to) {
        total++;
        if (!map.has(e.role)) map.set(e.role, { pending: 0, interested: 0, inprocess: 0, rejected: 0 });
        const counts = map.get(e.role)!;
        if (isStatus(e.status)) {
          const statusKey = e.status as keyof Omit<AggregatedPoint, "date">;
          counts[statusKey] = (Number(counts[statusKey]) || 0) + 1;
        }
      }
    });

    const data = Array.from(map.entries()).map(([role, counts]) => ({
      role, ...counts, shortRole: ROLE_SHORT_NAMES[role.trim()] || role, fullName: role
    }));

    return { data, total };
  }, [deferredEntries, roleDateRange]);

  const roleData = roleDataCalculated.data;
  const roleTotal = roleDataCalculated.total;

  const workflowData = useMemo(() => {
    if (!deferredEntries.length || !workflowDateRange?.from) return [];
    const from = startOfDay(workflowDateRange.from);
    const to   = endOfDay(workflowDateRange.to || workflowDateRange.from);
    const dateList = eachDayOfInterval({ start: from, end: to }).map(d => format(d, "yyyy-MM-dd"));

    // 🚀 Performance Optimization: Pre-calculate counts in O(N) using Frequency Maps
    const createdCountMap = new Map<string, number>();
    const completedCountMap = new Map<string, number>();

    deferredEntries.forEach(e => {
      createdCountMap.set(e.createdDate, (createdCountMap.get(e.createdDate) || 0) + 1);
      if (e.completedDate) {
        completedCountMap.set(e.completedDate, (completedCountMap.get(e.completedDate) || 0) + 1);
      }
    });

    let cCreated = 0, cCompleted = 0;
    if (workflowMode === "carry") {
      deferredEntries.forEach(e => {
        // Use pre-parsed _created instead of toLocalDate()
        if (e._created < from) cCreated++;
        if (e._completed && e._completed < from) cCompleted++;
      });
    }

    return dateList.map(str => {
      const d = toLocalDate(str); // str is from dateList which is yyyy-MM-dd
      const createdToday = createdCountMap.get(str) || 0;
      const completedToday = completedCountMap.get(str) || 0;

      if (workflowMode === "carry") {
        cCreated += createdToday; 
        cCompleted += completedToday;
        return { 
          date: format(d, "dd MMM"), 
          backlog: Math.max(0, cCreated - cCompleted), 
          completed: completedToday, 
          newLeads: createdToday 
        };
      }
      return { 
        date: format(d, "dd MMM"), 
        backlog: createdToday, 
        completed: completedToday, 
        newLeads: createdToday 
      };
    });
  }, [deferredEntries, workflowDateRange, workflowMode, toLocalDate]);

  const WorkflowTooltip = useCallback((props: { active?: boolean, payload?: { dataKey: string, value: number, name: string, color: string }[] }) => {
    const { payload, active } = props;
    if (!active || !payload?.length) return null;
    const filtered = workflowMode === "unique" ? payload.filter((i) => i.dataKey !== "backlog") : payload;
    return <ChartTooltipContent {...props} payload={filtered as unknown as React.ComponentProps<typeof ChartTooltipContent>["payload"]} />;
  }, [workflowMode]);

  const handleCSVExport = useCallback(() => {
    if (!csvDateRange?.from) return;
    const from = startOfDay(csvDateRange.from);
    const to   = endOfDay(csvDateRange.to || csvDateRange.from);

    const filtered = applicants.filter((a) => {
      let d = parseISO(a.created_time);
      if (isNaN(d.getTime())) d = new Date(a.created_time);
      return !isNaN(d.getTime()) && isWithinInterval(d, { start: from, end: to });
    });

    if (filtered.length === 0) { alert("No records found."); return; }
    const headers = ["Created Time", "Name", "Position", "Email", "Phone", "Status", "Feedback"];
    const rows = filtered.map(a => {
      let d = parseISO(a.created_time); if (isNaN(d.getTime())) d = new Date(a.created_time);
      return [isNaN(d.getTime()) ? a.created_time : format(d, "yyyy-MM-dd HH:mm:ss"), `"${a.full_name.replace(/"/g, '""')}"`, `"${a.position}"`, a.email, a.phone, a.status, `"${a.feedback.replace(/"/g, '""')}"`].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `applicants_${format(from, "yyyyMMdd")}.csv`; link.click();
    URL.revokeObjectURL(url); setIsCSVModalOpen(false);
  }, [applicants, csvDateRange]);

  const activeTrendKeys = useMemo(() => statusFilter === "all" ? STATUS_KEYS : [statusFilter], [statusFilter]);

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2 performance-chart p-1"
      variants={analyticsVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 📈 Trends Chart */}
      <Card className="rounded-[var(--dash-card-radius)] bg-card border-[var(--dash-border)] shadow-sm hover:shadow-md transition-all duration-[var(--dash-transition-slow)] min-h-[360px]">
        <CardHeader className="py-4 px-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <ChartNoAxesCombined className="w-3 h-3" /> Application Trends
            </CardTitle>
            <DatePickerWithRange date={trendDateRange} setDate={setTrendDateRange} minDate={earliestDate} />
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center p-1 bg-muted/30 rounded-xl border border-border/40">
              <Button
                variant={chartType === "area" ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 text-[10px] px-3 font-bold rounded-lg  ${chartType === "area" ? "border-1 border-primary/20" : ""}`}
                onClick={() => setChartType("area")}
              >
                Line
              </Button>
              <Button
                variant={chartType === "bar" ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 text-[10px] px-3 font-bold rounded-lg  ${chartType === "bar" ? "border-1 border-primary/20" : ""}`}
                onClick={() => setChartType("bar")}
              >
                Bar
              </Button>
            </div>

            {/* CSV Export */}
            <Dialog open={isCSVModalOpen} onOpenChange={setIsCSVModalOpen}>
              <DialogTrigger 
                render={
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 w-9 p-0 rounded-xl border-dashed hover:bg-primary/5 hover:text-primary transition-colors"
                  />
                }
              >
                <Download className="w-4 h-4" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[2rem] border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-xl mt-2 font-black italic text-primary text-center">EXPORT PERFORMANCE</DialogTitle>
                </DialogHeader>
                <div className="p-2 space-y-6">
                  <p className="text-sm text-muted-foreground font-medium">Export raw candidate data for external auditing.</p>
                  <DatePickerWithRange date={csvDateRange} setDate={setCSVDateRange} minDate={earliestDate} />
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setIsCSVModalOpen(false)} className="rounded-2xl font-bold">CLOSE</Button>
                  <Button onClick={handleCSVExport} disabled={!csvDateRange?.from} className="bg-primary hover:scale-105 transition-transform rounded-2xl font-bold px-8">DOWNLOAD CSV</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-border/40 mx-1" />

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => startTransition(() => setStatusFilter(v as keyof typeof chartConfig))}>
              <SelectTrigger className="h-9 w-36 text-xs font-bold border-border/60 bg-background/50 rounded-xl hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-3 h-3 text-muted-foreground" />
                  <SelectValue placeholder="STATUS: ALL" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-primary/10">
                <SelectItem value="all" className="font-bold text-xs">ALL PERFORMANCE</SelectItem>
                <div className="h-px bg-border/40 my-1 mx-1" />
                <SelectItem value="pending" className="text-chart-1 font-bold text-xs">PENDING</SelectItem>
                <SelectItem value="interested" className="text-chart-3 font-bold text-xs">INTERESTED</SelectItem>
                <SelectItem value="inprocess" className="text-chart-4 font-bold text-xs">IN PROCESS</SelectItem>
                <SelectItem value="rejected" className="text-chart-2 font-bold text-xs">REJECTED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="h-[240px] px-5 pb-5 pt-0">
          {!deferredEntries.length && trendData.length === 0 ? <div className="h-full w-full bg-muted/20 animate-pulse rounded-2xl" /> : (
            <TrendChart data={trendData} type={chartType} activeKeys={activeTrendKeys as (keyof typeof chartConfig)[]} />
          )}
        </CardContent>
      </Card>

      {/* 📊 Role Breakdown Chart */}
      <Card className="rounded-[var(--dash-card-radius)] bg-card border-[var(--dash-border)] shadow-sm hover:shadow-md transition-all duration-[var(--dash-transition-slow)] min-h-[360px]">
        <CardHeader className="py-4 px-6 space-y-4">
      <div className="flex items-center justify-between">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" /> Role Breakdown
              </div>
              {roleData.length > 0 && (
                <span className="sm:ml-1.5 px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground border border-muted text-[9px] font-black shrink-0">
                  {roleTotal} RECORDS
                </span>
              )}
            </CardTitle>
            <DatePickerWithRange date={roleDateRange} setDate={setRoleDateRange} minDate={earliestDate} />
          </div>
        </CardHeader>
        <CardContent className="h-[280px] px-5 pb-5 pt-0">
          <RoleBreakdownChart data={roleData} />
        </CardContent>
      </Card>

      {/* ⚡ Workflow Efficiency */}
      <Card className="md:col-span-2 rounded-[var(--dash-card-radius)] bg-card border-[var(--dash-border)] shadow-sm hover:shadow-md transition-all duration-[var(--dash-transition-slow)]">
        <CardHeader className="py-4 px-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xs font-bold text-muted-foreground">Workflow Efficiency & Lag Response</CardTitle>
              <p className="text-[10px] text-muted-foreground/80 leading-relaxed max-w-sm">
                {workflowMode === "carry" ? "Total cumulative backlog vs. daily closures." : "Daily unique velocity of leads and closures."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:ml-auto w-full sm:w-auto">
              <div className="flex-1 sm:flex-none min-w-[140px]">
                <DatePickerWithRange date={workflowDateRange} setDate={setWorkflowDateRange} minDate={earliestDate} />
              </div>
              <Tabs value={workflowMode} onValueChange={(v) => startTransition(() => setWorkflowMode(v as "carry" | "unique"))} className="h-9 p-1 bg-muted/30 rounded-xl border border-border/40 shrink-0">
                <TabsList className="h-full bg-transparent p-0 gap-1">
                  <TabsTrigger value="carry" className="h-full text-[9px] font-black uppercase px-2.5 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">CARRY</TabsTrigger>
                  <TabsTrigger value="unique" className="h-full text-[9px] font-black uppercase px-2.5 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">DAILY</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[280px] px-5 pb-5 pt-0">
          <WorkflowEfficiencyChart data={workflowData} mode={workflowMode} tooltip={WorkflowTooltip} />
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default AnalyticsSection;