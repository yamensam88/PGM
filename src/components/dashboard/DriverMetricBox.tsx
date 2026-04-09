"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DriverMetricBoxProps {
  valueClass: string;
  labelClass: string;
  count: number;
  label: string;
  title: string;
  drivers: any[];
}

export function DriverMetricBox({ 
  valueClass, 
  labelClass, 
  count, 
  label, 
  title, 
  drivers 
}: DriverMetricBoxProps) {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -m-2 rounded-lg transition-colors flex flex-col items-center justify-center h-full w-full">
        <div className={`text-3xl font-extrabold ${valueClass}`}>{count}</div>
        <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${labelClass}`}>{label}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title} ({count})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-1">
          {drivers.length === 0 ? (
             <p className="text-sm text-slate-500 italic py-4 text-center">Aucun chauffeur dans cette catégorie.</p>
          ) : (
             <ul className="space-y-1">
               {drivers.map(d => (
                 <li key={d.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
                   <span className="font-medium text-slate-900 dark:text-slate-100">{d.first_name} {d.last_name}</span>
                   <span className="text-sm text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">{d.phone || "Pas de numéro"}</span>
                 </li>
               ))}
             </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
