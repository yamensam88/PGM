"use client";

import * as React from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filter = searchParams.get("filter");
  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  // Determine initial date range based on URL
  const initialRange: DateRange | undefined = React.useMemo(() => {
    if (urlFrom && urlTo) {
      return {
        from: new Date(urlFrom),
        to: new Date(urlTo),
      };
    }
    const activeFilter = filter || (!urlFrom ? 'daily' : null);
    if (activeFilter) {
      const today = new Date();
      if (activeFilter === 'daily') {
        return { from: today, to: today };
      }
      if (activeFilter === 'weekly') {
        return { from: subDays(today, 6), to: today };
      }
      if (activeFilter === 'monthly') {
        return { from: subDays(today, 29), to: today };
      }
    }
    return undefined;
  }, [urlFrom, urlTo, filter]);

  const [date, setDate] = React.useState<DateRange | undefined>(initialRange);

  // When a preset is clicked, update the URL
  const handlePresetClick = (preset: "daily" | "weekly" | "monthly") => {
    router.push(`${pathname}?filter=${preset}`);
  };

  // When a custom date range is selected, update URL
  const handleSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    if (selectedDate?.from) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("filter");
      params.set("from", format(selectedDate.from, "yyyy-MM-dd"));
      if (selectedDate.to) {
        params.set("to", format(selectedDate.to, "yyyy-MM-dd"));
      } else {
        // If only start date is selected, 'to' is end of that same day
        params.set("to", format(selectedDate.from, "yyyy-MM-dd"));
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-zinc-100 dark:bg-white p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
        {/* Presets */}
        <div className="flex items-center">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePresetClick("daily")}
                className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-8", 
                    (filter === 'daily' || (!filter && !urlFrom)) ? 'bg-white shadow-sm dark:bg-zinc-700 text-zinc-900 dark:text-slate-900 hover:bg-white' : 'text-slate-500 hover:text-zinc-700 dark:hover:text-slate-600'
                )}
            >
                Aujourd'hui
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePresetClick("weekly")}
                className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-8", 
                    filter === 'weekly' ? 'bg-white shadow-sm dark:bg-zinc-700 text-zinc-900 dark:text-slate-900 hover:bg-white' : 'text-slate-500 hover:text-zinc-700 dark:hover:text-slate-600'
                )}
            >
                Hebdo
            </Button>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePresetClick("monthly")}
                className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-8", 
                    filter === 'monthly' ? 'bg-white shadow-sm dark:bg-zinc-700 text-zinc-900 dark:text-slate-900 hover:bg-white' : 'text-slate-500 hover:text-zinc-700 dark:hover:text-slate-600'
                )}
            >
                Mensuel
            </Button>
        </div>

        {/* Custom Range Picker */}
        <div className="hidden sm:block w-px h-6 bg-zinc-300 dark:bg-zinc-600 mx-1"></div>

        <Popover>
          <PopoverTrigger render={<Button
              id="date"
              variant={"ghost"}
              size="sm"
              className={cn(
                "h-8 justify-start text-left font-normal border-0",
                date || (urlFrom && urlTo) || filter ? "bg-white shadow-sm dark:bg-zinc-700 text-zinc-900 dark:text-slate-900 hover:bg-white" : "text-slate-500 hover:text-zinc-700 dark:hover:text-slate-600"
              )}
            />}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "d MMM yyyy", { locale: fr })} -{" "}
                    {format(date.to, "d MMM yyyy", { locale: fr })}
                  </>
                ) : (
                  format(date.from, "d MMM yyyy", { locale: fr })
                )
              ) : (
                <span>Date personnalisée...</span>
              )}
              <ChevronDown className="ml-2 w-3 h-3 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={fr}
              className="bg-white rounded-lg shadow-lg border-zinc-200"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
