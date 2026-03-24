"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { DateRange } from "react-day-picker";

export function RunsDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Legacy support for "date" parsing it as both start and end if needed
  const legacyDate = searchParams.get("date");
  const startDateParam = searchParams.get("from");
  const endDateParam = searchParams.get("to");
  
  let initialDateRange: DateRange | undefined;
  if (startDateParam || endDateParam) {
    initialDateRange = {
      from: startDateParam ? new Date(startDateParam) : undefined,
      to: endDateParam ? new Date(endDateParam) : undefined,
    };
  } else if (legacyDate) {
    initialDateRange = {
      from: new Date(legacyDate),
      to: new Date(legacyDate),
    };
  }

  const [date, setDate] = useState<DateRange | undefined>(initialDateRange);

  const handleSelect = (newDateRange: DateRange | undefined) => {
    setDate(newDateRange);
    const params = new URLSearchParams(searchParams.toString());
    
    // Always clear the legacy date parameter
    params.delete("date");

    if (newDateRange?.from) {
      const year = newDateRange.from.getFullYear();
      const month = String(newDateRange.from.getMonth() + 1).padStart(2, '0');
      const day = String(newDateRange.from.getDate()).padStart(2, '0');
      params.set("from", `${year}-${month}-${day}`);
    } else {
      params.delete("from");
    }

    if (newDateRange?.to) {
      const year = newDateRange.to.getFullYear();
      const month = String(newDateRange.to.getMonth() + 1).padStart(2, '0');
      const day = String(newDateRange.to.getDate()).padStart(2, '0');
      params.set("to", `${year}-${month}-${day}`);
    } else {
      params.delete("to");
    }

    router.push(`?${params.toString()}`);
  };

  const clearFilter = (e: React.MouseEvent) => {
     e.stopPropagation();
     handleSelect(undefined);
  };

  return (
    <div className="flex items-center space-x-2">
       <span className="text-sm text-slate-500 font-medium">Test par période :</span>
       <Popover>
         <PopoverTrigger render={
           <Button
             variant={"outline"}
             className={cn(
               "w-[280px] justify-start text-left font-normal bg-white",
               !date && "text-muted-foreground"
             )}
           >
             <CalendarIcon className="mr-2 h-4 w-4" />
             {date?.from ? (
               date.to ? (
                 <>
                   {format(date.from, "dd/MM/yyyy")} -{" "}
                   {format(date.to, "dd/MM/yyyy")}
                 </>
               ) : (
                 format(date.from, "PPP", { locale: fr })
               )
             ) : (
               <span>Toutes les dates</span>
             )}
             {(date?.from || date?.to) && (
                <X 
                  className="ml-auto h-4 w-4 opacity-50 hover:opacity-100" 
                  onClick={clearFilter} 
                />
             )}
           </Button>
         } />
         <PopoverContent className="w-auto p-0" align="start">
           <Calendar
             mode="range"
             defaultMonth={date?.from}
             selected={date}
             onSelect={handleSelect}
             initialFocus
             locale={fr}
             numberOfMonths={2}
           />
         </PopoverContent>
       </Popover>
    </div>
  );
}
