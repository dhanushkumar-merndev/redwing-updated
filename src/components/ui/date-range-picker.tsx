"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  date,
  setDate,
  className,
}: DatePickerWithRangeProps) {
  const [mounted, setMounted] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync internal state when external changes or when opening
  React.useEffect(() => {
    if (open) {
      setInternalDate(date)
    }
  }, [open, date])

  const minDate = new Date("2026-02-22")

  const triggerContent = (
    <Button
      id="date-range-picker-trigger"
      variant={"outline"}
      className={cn(
        "h-7 justify-start text-left font-normal px-2.5 text-[10px] md:h-8 md:text-xs min-w-[120px]",
        !date && "text-muted-foreground"
      )}
      suppressHydrationWarning
    >
      <CalendarIcon className="mr-2 h-3 w-3" />
      {date?.from ? (
        date.to ? (
          <>
            {format(date.from, "LLL dd, y")} -{" "}
            {format(date.to, "LLL dd, y")}
          </>
        ) : (
          format(date.from, "LLL dd, y")
        )
      ) : (
        <span>Pick a date</span>
      )}
    </Button>
  )

  if (!mounted) {
    return (
      <div className={cn("grid gap-2", className)}>
        {triggerContent}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          {triggerContent}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onSelect={(range) => {
              // Ensure we only ever have a range object { from, to }
              if (range) {
                setInternalDate(range);
              }
            }}
            numberOfMonths={2}
            className="rounded-md border-none"
            fromDate={minDate}
            toDate={new Date()}
            disabled={{ before: minDate }}
          />


          <div className="border-t p-3 flex items-center justify-between gap-3 bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">From</span>
                <div className="h-8 min-w-[90px] px-2 flex items-center justify-center rounded-md border border-zinc-200 bg-white text-[10px] font-bold text-zinc-800 shadow-sm">
                  {internalDate?.from ? format(internalDate.from, "dd MMM yyyy") : "—"}
                </div>
              </div>
              <div className="w-1.5 h-px bg-zinc-300 mt-3" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">To</span>
                <div className="h-8 min-w-[90px] px-2 flex items-center justify-center rounded-md border border-zinc-200 bg-white text-[10px] font-bold text-zinc-800 shadow-sm">
                  {internalDate?.to ? format(internalDate.to, "dd MMM yyyy") : "—"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[11px] font-bold text-[#cd1e22] hover:text-[#b01a1d] hover:bg-red-50 px-3 transition-colors"
                onClick={() => setInternalDate(undefined)}
              >
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 px-3 transition-colors"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-9 px-4 text-[11px] font-bold bg-[#cd1e22] hover:bg-[#b01a1d] text-white shadow-md active:scale-95 transition-all"
                onClick={() => {
                  setDate(internalDate);
                  setOpen(false);
                }}
              >
                Search Range
              </Button>
            </div>
          </div>

        </PopoverContent>
      </Popover>
    </div>
  )
}
