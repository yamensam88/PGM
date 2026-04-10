"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface VehicleMetricBoxProps {
  valueClass: string;
  labelClass: string;
  count: number;
  label: string;
  title: string;
  vehicles: any[];
}

export function VehicleMetricBox({ 
  valueClass, 
  labelClass, 
  count, 
  label, 
  title, 
  vehicles 
}: VehicleMetricBoxProps) {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -m-2 rounded-lg transition-colors flex flex-col items-center justify-center h-full w-full">
        <div className={`text-xl 2xl:text-2xl font-extrabold ${valueClass}`}>{count}</div>
        <div className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${labelClass}`}>{label}</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title} ({count})</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-1">
          {vehicles.length === 0 ? (
             <p className="text-sm text-slate-500 italic py-4 text-center">Aucun véhicule dans cette catégorie.</p>
          ) : (
             <ul className="space-y-1">
               {vehicles.map(v => {
                 const ownershipLabel = v.ownership_type === 'rented' 
                   ? (v.lessor_name ? `Location (${v.lessor_name})` : 'Location') 
                   : 'Propriété';
                 
                 return (
                   <li key={v.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
                     <div className="flex flex-col">
                       <span className="font-bold text-slate-900 dark:text-slate-100 tracking-wider flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 rounded text-sm uppercase">{v.plate_number || "Sans plaque"}</span>
                          {v.internal_code && <span className="text-xs text-slate-400 font-normal">#{v.internal_code}</span>}
                       </span>
                       <span className="text-[11px] text-slate-500 mt-0.5">{v.brand} {v.model}</span>
                     </div>
                     <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-2 sm:mt-0">{ownershipLabel}</span>
                   </li>
                 );
               })}
             </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
