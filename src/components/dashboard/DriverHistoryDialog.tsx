"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDriverFinancialHistory } from "@/lib/actions";
import { useSearchParams } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// @ts-ignore
import Draggable from "react-draggable";

interface DriverHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  driverName: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-slate-900/5">
        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="text-xs font-extrabold text-slate-900">
              {Number(entry.value).toFixed(2)} €
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DriverHistoryDialog({ open, onOpenChange, driverId, driverName }: DriverHistoryDialogProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;

  useEffect(() => {
    if (open && driverId) {
      setLoading(true);
      getDriverFinancialHistory(driverId, filter, from, to).then((res) => {
        if (res.success) {
          setData(res.data);
        }
        setLoading(false);
      });
    }
  }, [open, driverId, filter, from, to]);

  if (!open) return null;

  // Render variables
  let chartData: any[] = [];
  if (data?.recentRuns) {
     chartData = [...data.recentRuns].reverse().map((r: any) => ({
       date: new Date(r.date).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' }),
       revenue: Number(r.revenue_calculated || 0),
       cost: Number(r.cost_driver || 0) + Number(r.cost_vehicle || 0) + Number(r.cost_fuel || 0)
     }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* We make the Radix DialogContent completely invisible and non-blocking, 
          so the inner Draggable component acts as the real window */}
      <DialogContent 
        className="max-w-[95vw] sm:max-w-none w-auto max-h-[90vh] bg-transparent border-none ring-0 shadow-none outline-none rounded-none p-0 overflow-visible pointer-events-none" 
        showCloseButton={false}
      >
        <Draggable nodeRef={dragRef} handle=".drag-handle">
          <div 
            ref={dragRef} 
            className="pointer-events-auto w-[95vw] md:w-[1200px] h-[95vh] md:h-auto max-h-[90vh] mx-auto bg-slate-50/95 backdrop-blur-xl p-0 rounded-3xl border border-slate-200/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden relative isolate"
          >
            
            {/* Draggable Header Area */}
            <div className="drag-handle p-5 md:p-6 flex-shrink-0 border-b border-slate-200/50 bg-white/60 cursor-move hover:bg-white/80 transition-colors flex items-start justify-between group select-none">
              <div className="flex-1">
                <DialogTitle className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-3">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-orange-500 transition-colors hidden sm:block"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                   <span className="truncate">Historique Financier : <span className="text-orange-600 truncate">{driverName}</span></span>
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500 mt-1 sm:ml-9 pointer-events-none">
                  Fenêtre dynamique détachable &bull; Vue consolidée des performances
                </DialogDescription>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onOpenChange(false); }} 
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                title="Fermer la fenêtre"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-4 flex-1">
                <div className="w-10 h-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none">Initialisation du Cockpit...</p>
              </div>
            ) : data ? (
              <div className="overflow-y-auto flex-1 p-5 md:p-8 space-y-6 md:space-y-8 custom-scrollbar bg-slate-50/50">
                
                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 overflow-hidden group">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-slate-500 transition-colors">Salaires versés</p>
                     <p className="text-lg md:text-2xl font-extrabold text-slate-900 truncate">{data.totalPay.toFixed(2)} €</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 overflow-hidden group">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-slate-500 transition-colors">Coût Mobilité</p>
                     <p className="text-lg md:text-2xl font-extrabold text-slate-900 truncate">{data.totalFleetCost.toFixed(2)} €</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 overflow-hidden group">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-slate-500 transition-colors">Coût Absences</p>
                     <p className="text-lg md:text-2xl font-extrabold text-slate-900 truncate">{data.totalAbsenceCost.toFixed(2)} €</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-red-50 ring-1 ring-red-900/5 hover:shadow-[0_8px_30px_rgba(239,68,68,0.06)] transition-all duration-300 overflow-hidden group">
                     <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-red-500 transition-colors">Casses & Sinistres</p>
                     <p className="text-lg md:text-2xl font-extrabold text-red-600 truncate">{data.totalDamages.toFixed(2)} €</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-orange-50 ring-1 ring-orange-900/5 hover:shadow-[0_8px_30px_rgba(249,115,22,0.06)] transition-all duration-300 overflow-hidden group">
                     <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-orange-500 transition-colors">Pénalités Client</p>
                     <p className="text-lg md:text-2xl font-extrabold text-orange-600 truncate">{data.totalPenalties.toFixed(2)} €</p>
                  </div>
                  <div className="bg-slate-900 p-5 rounded-2xl shadow-xl ring-1 ring-slate-900/20 flex flex-col justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-50"></div>
                     <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                     </div>
                     <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1.5 truncate z-10 group-hover:text-white transition-colors">Revient Total Ops</p>
                     <p className="text-lg md:text-2xl font-extrabold text-white truncate z-10">{data.totalCompanyCost?.toFixed(2)} €</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 overflow-hidden group">
                     <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 truncate group-hover:text-slate-500 transition-colors">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                       Chiffre d'Affaires
                     </p>
                     <p className="text-lg md:text-2xl font-extrabold text-slate-900 truncate">{data.totalRevenue?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                  </div>
                  <div className={`p-5 rounded-2xl flex flex-col justify-center relative overflow-hidden group ${data.finalNetMargin >= 0 ? 'bg-emerald-500' : 'bg-red-500'} shadow-[0_2px_10px_rgba(0,0,0,0.1)] ring-1 ${data.finalNetMargin >= 0 ? 'ring-emerald-600' : 'ring-red-600'}`}>
                     <p className="flex items-center gap-1.5 text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1.5 truncate z-10 hover:text-white transition-colors">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                       Marge Nette Centrale
                     </p>
                     <p className="text-lg md:text-2xl font-extrabold text-white truncate z-10">{data.finalNetMargin > 0 ? '+' : ''}{data.finalNetMargin?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                  </div>
                </div>

                {/* HR Attendance Sub-Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between group">
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">Jours Présents</p>
                       <p className="text-xl font-extrabold text-slate-800">{data.presentDays || 0}</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                     </div>
                  </div>
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/60 flex items-center justify-between group">
                     <div>
                       <p className="text-[10px] font-bold text-orange-400/80 uppercase tracking-widest mb-0.5 truncate">Abs. Injustifiées</p>
                       <p className="text-xl font-extrabold text-orange-600">{data.unjustifiedAbsenceDays || 0}</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-orange-100/50 flex items-center justify-center text-orange-500">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                     </div>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/60 flex items-center justify-between group">
                     <div>
                       <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest mb-0.5 truncate">Congés Pris</p>
                       <p className="text-xl font-extrabold text-blue-600">{data.vacationDays || 0}</p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-500">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 12 2l10 20Z"/><path d="M12 12v10"/></svg>
                     </div>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60 flex items-center justify-between group">
                     <div>
                       <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest mb-0.5 truncate">Solde Vacances</p>
                       <p className="text-xl font-extrabold text-emerald-600">{data.vacationBalance || 0} <span className="text-xs text-emerald-600/70 font-bold tracking-normal">j</span></p>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-500">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                     </div>
                  </div>
                </div>

                {/* Area Chart: Revenue vs Cost History */}
                {chartData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm">
                       <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2 pointer-events-none">
                         <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> 
                         </div>
                         Évolution de la Rentabilité Directe (CA vs Coûts)
                       </h3>
                    </div>
                    <div className="p-6 h-[260px] md:h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevModal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCostModal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={11} 
                            fontWeight={600}
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                            minTickGap={15}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={11} 
                            fontWeight={600}
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `${value}€`}
                            dx={-10}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            name="Chiffre d'Affaires"
                            stroke="#f97316" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRevModal)" 
                            activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cost" 
                            name="Charges Directes"
                            stroke="#cbd5e1" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorCostModal)" 
                            activeDot={{ r: 4, fill: "#94a3b8", stroke: "#fff", strokeWidth: 2 }} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6 pb-6">
                  {/* Financial Entries List */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 flex flex-col h-[340px]">
                     <div className="px-6 py-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm flex-shrink-0">
                       <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase pointer-events-none">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                         Mouvements Exceptionnels Isolés
                       </h3>
                     </div>
                     <div className="p-3 overflow-y-auto space-y-1.5 flex-1 custom-scrollbar">
                        {data.financialEntries.length > 0 ? data.financialEntries.map((entry: any) => (
                          <div key={entry.id} className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div className="mr-3 overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{entry.description}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate">
                                 {new Date(entry.entry_date).toLocaleDateString("fr-FR")} &bull; {entry.category}
                              </p>
                            </div>
                            <div className={`font-extrabold text-sm whitespace-nowrap flex-shrink-0 ${entry.entry_type === 'cost' ? 'text-slate-600' : 'text-emerald-500'}`}>
                              {entry.entry_type === 'cost' ? '-' : '+'}{Number(entry.amount).toFixed(2)} €
                            </div>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-12 h-12 rounded-full border border-dashed border-slate-200 flex items-center justify-center mb-3">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-center">Aucun mouvement<br/>isolé enregistré</span>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Recent Runs */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 flex flex-col h-[340px]">
                     <div className="px-6 py-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm flex-shrink-0">
                       <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase pointer-events-none">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                         Récapitulatif des Tournées Opérées
                       </h3>
                     </div>
                     <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                       <table className="w-full text-left border-collapse table-fixed">
                          <tbody className="divide-y divide-slate-100/60">
                             {data.recentRuns.length > 0 ? data.recentRuns.map((run: any) => (
                               <tr key={run.id} className="hover:bg-slate-50/80 transition-colors group">
                                 <td className="px-4 py-3.5 w-[90px] align-middle">
                                   <div className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-md px-2 py-1 text-center group-hover:bg-slate-200 transition-colors">
                                     {new Date(run.date).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}
                                   </div>
                                 </td>
                                 <td className="px-3 py-3.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <p className="text-xs font-extrabold text-[#0A1A2F] truncate">{run.client?.name || '-'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate flex items-center gap-1">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                      {run.vehicle?.plate_number || '-'}
                                    </p>
                                 </td>
                                 <td className="px-4 py-3.5 text-right w-[110px]">
                                    <p className="text-xs font-extrabold text-slate-800 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded ml-auto w-max">{Number(run.cost_driver || 0).toFixed(2)} €</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">Main d'Oeuvre</p>
                                 </td>
                               </tr>
                             )) : (
                               <tr>
                                 <td colSpan={3} className="px-4 py-16 text-center text-slate-400 flex flex-col items-center">
                                   <div className="w-12 h-12 rounded-full border border-dashed border-slate-200 flex items-center justify-center mb-3">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                   </div>
                                   <span className="text-xs font-bold uppercase tracking-widest pointer-events-none">Aucune tournée récente</span>
                                 </td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                     </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-24 text-center flex flex-col items-center flex-1 justify-center bg-slate-50/50">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-red-600">Erreur lors du chargement des données sécurisées.</p>
              </div>
            )}
          </div>
        </Draggable>
      </DialogContent>
    </Dialog>
  );
}
