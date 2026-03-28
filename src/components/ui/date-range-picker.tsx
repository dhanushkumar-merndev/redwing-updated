"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useMediaQuery } from "@/hooks/useMediaQuery"

interface DatePickerWithRangeProps {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  minDate?: Date;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
  minDate,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date)

  // Sync internal state when popover opens
  React.useEffect(() => {
    if (open) {
      setInternalDate(date)
    }
  }, [open, date])

  const triggerContent = (
    <Button
      id="date-range-picker-trigger"
      variant="outline"
      className={cn(
        "h-7 justify-between text-left font-bold border-border bg-background hover:bg-muted transition-colors shadow-none text-[10px] md:h-8 md:text-xs px-2.5",
        !date && "text-muted-foreground",
        className
      )}
      suppressHydrationWarning
    >
      <CalendarIcon className="mr-1.5 h-3 w-3 text-muted-foreground" />

      {date?.from ? (
        date.to ? (
          <>
            {format(date.from, "LLL dd yyyy")} - {format(date.to, "LLL dd yyyy")}
          </>
        ) : (
          format(date.from, "LLL dd yyyy")
        )
      ) : (
        <span>Pick range</span>
      )}
     
      <ChevronDown className="ml-1.5 h-3 w-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
  </Button>
  )

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={triggerContent} />
        <PopoverContent className="w-auto min-w-fit max-w-[calc(100vw-16px)] overflow-x-auto p-0" align="end" sideOffset={8}>
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={internalDate?.from}
              selected={internalDate}
              onSelect={(range) => {
                if (range) {
                  setInternalDate(range);
                }
              }}
              numberOfMonths={isMobile ? 1 : 2}
              showOutsideDays={false}
              fromDate={minDate}
              toDate={new Date()}
              disabled={minDate ? { before: minDate } : undefined}
            />

            <div className="border-t p-3 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/50">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
                <div className="h-8 min-w-[85px] px-2 flex items-center justify-center rounded-md border border-border bg-background text-[10px] font-bold text-foreground shadow-sm">
                  {internalDate?.from ? format(internalDate.from, "dd MMM yy") : "—"}
                </div>
                <div className="w-1.5 h-px bg-border shrink-0" />
                <div className="h-8 min-w-[85px] px-2 flex items-center justify-center rounded-md border border-border bg-background text-[10px] font-bold text-foreground shadow-sm">
                  {internalDate?.to ? format(internalDate.to, "dd MMM yy") : "—"}
                </div>
              </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:justify-end">
  
  <Button
    variant="ghost"
    size="sm"
    className="h-9 text-[11px] font-bold text-[#cd1e22] hover:text-[#b01a1d] hover:bg-red-50 px-3 transition-colors w-full sm:w-auto"
    onClick={() => setInternalDate(undefined)}
  >
    Reset
  </Button>

  <Button
    size="sm"
    className="h-9 px-4 text-[11px] font-bold bg-[#cd1e22] hover:bg-[#b01a1d] text-white shadow-md active:scale-95 transition-all w-full sm:w-auto"
    onClick={() => {
      setDate(internalDate);
      setOpen(false);
    }}
  >
    Apply
  </Button>

</div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
