"use client";

import { useMemo, useState, useTransition, useEffect, useCallback } from "react";
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
import { motion } from "framer-motion";
import { ROLE_SHORT_NAMES } from "@/lib/roles";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {  format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Role } from "@/lib/roles";
import type { AnalyticsEntry } from "@/app/api/analytics/route";

const chartConfig = {
  pending: { label: "Pending", color: "#f59e0b" },
  interested: { label: "Interested", color: "#10b981" },
  inprocess: { label: "In Process", color: "#3b82f6" },
  rejected: { label: "Rejected", color: "#ef4444" },
} as const;

const STATUS_KEYS = ["pending", "interested", "inprocess", "rejected"] as const;

const START_DATE = new Date("2026-02-22");


interface AggregatedPoint {
  date: string;
  pending: number;
  interested: number;
  inprocess: number;
  rejected: number;
}

export default function AnalyticsSection() {
  const [entries, setEntries] = useState<AnalyticsEntry[]>([]);
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [trendDateRange, setTrendDateRange] = useState<DateRange | undefined>({
    from: START_DATE,
    to: new Date(),
  });
  const [roleDateRange, setRoleDateRange] = useState<DateRange | undefined>({
    from: START_DATE,
    to: new Date(),
  });
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);


  const fetchAnalytics = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) return;
        const data = await res.json() as { entries: AnalyticsEntry[] };
        setEntries(data.entries ?? []);
      } catch {
        // Handle error
      }
    });
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Aggregate Trends on client
  const filteredAnalytics = useMemo(() => {
    if (!entries.length || !trendDateRange?.from) return [];
    
    const from = startOfDay(trendDateRange.from);
    const to = endOfDay(trendDateRange.to || trendDateRange.from);

    const dateMap = new Map<string, Omit<AggregatedPoint, 'date'>>();

    entries.forEach(entry => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start: from, end: to })) {
        const key = format(entryDate, "dd MMM");
        if (!dateMap.has(key)) {
          dateMap.set(key, { pending: 0, interested: 0, inprocess: 0, rejected: 0 });
        }
        const counts = dateMap.get(key)!;
        if (entry.status in counts) {
          counts[entry.status as keyof typeof counts]++;
        }
      }
    });

    const result: AggregatedPoint[] = Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }));

    if (statusFilter === "all") return result;
    
    return result.map(point => ({
      date: point.date,
      pending: statusFilter === "pending" ? point.pending : 0,
      interested: statusFilter === "interested" ? point.interested : 0,
      inprocess: statusFilter === "inprocess" ? point.inprocess : 0,
      rejected: statusFilter === "rejected" ? point.rejected : 0,
    } as AggregatedPoint));
  }, [entries, statusFilter, trendDateRange]);

  // Aggregate Role Breakdown on client
  const formattedRoleData = useMemo(() => {
    if (!entries.length || !roleDateRange?.from) return [];

    const from = startOfDay(roleDateRange.from);
    const to = endOfDay(roleDateRange.to || roleDateRange.from);
    
    const roleMap = new Map<string, Omit<AggregatedPoint, 'date'>>();

    entries.forEach(entry => {
      const entryDate = parseISO(entry.date);
      if (isWithinInterval(entryDate, { start: from, end: to })) {
        if (!roleMap.has(entry.role)) {
          roleMap.set(entry.role, { pending: 0, interested: 0, inprocess: 0, rejected: 0 });
        }
        const counts = roleMap.get(entry.role)!;
        if (entry.status in counts) {
          counts[entry.status as keyof typeof counts]++;
        }
      }
    });

    return Array.from(roleMap.entries()).map(([role, counts]) => ({
      role,
      ...counts,
      shortRole: ROLE_SHORT_NAMES[role as Role] || role,
      fullName: role
    }));
  }, [entries, roleDateRange]);

  const downloadCSV = () => {
    const headers = ["Date", "Pending", "Interested", "In Process", "Rejected"];
    const rows = filteredAnalytics.map((d: AggregatedPoint) =>
      [d.date, d.pending, d.interested, d.inprocess, d.rejected].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trends_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeKeys = statusFilter === "all"
    ? STATUS_KEYS
    : STATUS_KEYS.filter((k) => k === statusFilter);

  if (!mounted) return <div className="grid gap-3 md:grid-cols-2 h-[350px] opacity-0" />;

  return (
    <motion.div
      className="grid gap-3 md:grid-cols-2 md:gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Trend Chart */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="p-3 pb-2 md:p-4 md:pb-3 space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground md:text-sm">
              Application Trends
            </CardTitle>
            <DatePickerWithRange date={trendDateRange} setDate={setTrendDateRange} />
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

            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-[10px] px-3 font-bold text-zinc-600 bg-white" 
              onClick={downloadCSV}
            >
              CSV
            </Button>

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

        <CardContent className="h-56 p-3 pt-0 md:h-64 md:p-4 md:pt-0">
          {filteredAnalytics.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No data in selected range
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              {chartType === "area" ? (
                <AreaChart data={filteredAnalytics}>
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
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={filteredAnalytics} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="date" className="text-[10px] md:text-xs" />
                  <YAxis className="text-[10px] md:text-xs" width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {activeKeys.map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={chartConfig[key].color}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              )}
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Role Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="p-3 pb-2 md:p-4 md:pb-3 space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground md:text-sm">
              Role Breakdown
            </CardTitle>
            <DatePickerWithRange date={roleDateRange} setDate={setRoleDateRange} />
          </div>
        </CardHeader>
        <CardContent className="h-56 p-3 pt-0 md:h-64 md:p-4 md:pt-0">
          {formattedRoleData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No data in range
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={formattedRoleData} layout="vertical" margin={{ left: 10, right: 10 }}>
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
                  cursor={{ fill: 'transparent' }}
                  content={
                    <ChartTooltipContent 
                      labelFormatter={(value, payload) => {
                        return payload?.[0]?.payload?.fullName || value;
                      }}
                    />
                  } 
                />
                {STATUS_KEYS.map((key) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    fill={chartConfig[key].color} 
                    stackId="a" 
                    radius={0} 
                  />
                ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Subordinate components to avoid hydration text node collisions
const SelectSeparator = () => <div className="h-px bg-zinc-100 my-1 mx-[-4px]" />;
