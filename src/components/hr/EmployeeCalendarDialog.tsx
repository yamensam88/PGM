"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface EmployeeCalendarDialogProps {
  title: string
  dates: Date[]
  children: React.ReactNode
  colorType: 'emerald' | 'red' | 'orange' | 'blue'
  subtitle?: string
}

export function EmployeeCalendarDialog({ title, dates, children, colorType, subtitle }: EmployeeCalendarDialogProps) {
  const [open, setOpen] = useState(false)

  const colorMap = {
    emerald: "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white rounded-md",
    red: "bg-red-500 text-white hover:bg-red-600 hover:text-white rounded-md",
    orange: "bg-orange-500 text-white hover:bg-orange-600 hover:text-white rounded-md",
    blue: "bg-blue-500 text-white hover:bg-blue-600 hover:text-white rounded-md",
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="hover:opacity-75 transition-opacity cursor-pointer block w-full">
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col items-center">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          {subtitle && <p className="text-xs text-center text-slate-500 mt-1">{subtitle}</p>}
        </DialogHeader>
        
        <div className="mt-4 bg-slate-50/50 p-2 rounded-xl ring-1 ring-slate-100 flex justify-center w-full">
          {dates.length > 0 ? (
            <Calendar
              mode="multiple"
              selected={dates}
              classNames={{
                nav: "space-x-1 flex items-center",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 cursor-default"
              }}
              modifiers={{
                highlighted: dates
              }}
              modifiersClassNames={{
                highlighted: colorMap[colorType]
              }}
              defaultMonth={dates.length > 0 ? dates[0] : new Date()}
              disableNavigation={false}
            />
          ) : (
            <div className="py-12 text-sm text-slate-400">Aucune date à afficher</div>
          )}
        </div>
        
        <div className="mt-4 flex justify-center w-full">
           <Badge variant="outline" className="shadow-none">
              Total : {dates.length} jour(s)
           </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
