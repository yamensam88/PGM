"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Calculator, Clock } from "lucide-react";
import { RunsTable } from "@/components/dashboard/RunsTable";
import { DriverHistoryDialog } from "@/components/dashboard/DriverHistoryDialog";

type SynthesisRow = {
  driver: { id: string; first_name: string; last_name: string };
  runs_count: number;
  packages_loaded: number;
  packages_delivered: number;
  packages_advised: number;
  packages_returned: number;
  packages_relay: number;
  km_utiles: number;
  margin_net: number;
  maintenance_cost: number;
  damage_cost: number;
  penalty_cost: number;
  runs: any[];
};

export function DriverSynthesisTable({ data }: { data: SynthesisRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyDriver, setHistoryDriver] = useState<any>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Aucune donnée disponible pour cette période.
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader className="bg-slate-50/80 border-b border-slate-100">
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="w-10 px-2"></TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-4">Chauffeur</TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Tournées</TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Total Colis</TableHead>
            <TableHead className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest text-center">Livrés</TableHead>
            <TableHead className="text-[11px] font-semibold text-orange-600 uppercase tracking-widest text-center">Avisés</TableHead>
            <TableHead className="text-[11px] font-semibold text-rose-500 uppercase tracking-widest text-center">Retours</TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Écart</TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Km Utiles</TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right px-4">Entretien / Incidents</TableHead>
            <TableHead className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest text-right px-4">Marge Nette</TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right px-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100/80">
          {data.map((row) => {
            const ecart = (row.packages_loaded + row.packages_relay) - (row.packages_delivered + row.packages_advised + row.packages_returned);
            const isExpanded = expandedId === row.driver.id;
            const finalMargin = row.margin_net - (row.maintenance_cost || 0) - (row.damage_cost || 0) - (row.penalty_cost || 0);

            return (
              <React.Fragment key={row.driver.id}>
                <TableRow 
                  onClick={() => toggleExpand(row.driver.id)}
                  className={`cursor-pointer transition-colors duration-200 group border-0 ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}
                >
                  <TableCell className="w-10 px-2 text-center text-slate-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4 mx-auto text-indigo-500" /> : <ChevronRight className="w-4 h-4 mx-auto group-hover:text-indigo-500 transition-colors" />}
                  </TableCell>
                  <TableCell className="font-bold text-[13px] text-slate-800 px-4">
                    {row.driver.first_name} {row.driver.last_name}
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <span className="text-[12px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md border border-indigo-100/50">
                      {row.runs_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-[13px] text-slate-600 font-semibold">{row.packages_loaded + row.packages_relay}</div>
                    {row.packages_relay > 0 && <div className="text-[10px] text-slate-400 leading-tight">dont {row.packages_relay} relais</div>}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-emerald-600 font-bold">{row.packages_delivered}</TableCell>
                  <TableCell className="text-center text-[13px] text-orange-500 font-bold">{row.packages_advised}</TableCell>
                  <TableCell className="text-center text-[13px] text-rose-500 font-bold">{row.packages_returned}</TableCell>
                  
                  <TableCell className="text-center">
                    {ecart !== 0 ? (
                      <Badge variant="outline" className="border-red-100 text-red-600 bg-red-50 font-semibold rounded-full px-2">
                        {ecart > 0 ? `-${ecart}` : `+${Math.abs(ecart)}`}
                      </Badge>
                    ) : (
                      <span className="text-slate-300 font-medium text-[13px]">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center font-medium text-[13px] text-slate-600">
                    {row.km_utiles.toLocaleString('fr-FR')} <span className="text-slate-400 text-[11px]">km</span>
                  </TableCell>
                  
                  <TableCell className="text-right px-4">
                    <div className="flex flex-col items-end gap-0.5">
                       {row.maintenance_cost > 0 && (
                         <span className="text-[11px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                           {row.maintenance_cost.toFixed(0)}€ Maint.
                         </span>
                       )}
                       {row.damage_cost > 0 && (
                         <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                           {row.damage_cost.toFixed(0)}€ Casse
                         </span>
                       )}
                       {row.penalty_cost > 0 && (
                         <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                           {row.penalty_cost.toFixed(0)}€ Pénalité
                         </span>
                       )}
                       {row.maintenance_cost === 0 && row.damage_cost === 0 && row.penalty_cost === 0 && (
                         <span className="text-slate-300 font-medium text-[13px]">-</span>
                       )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right px-4">
                    <span className={`text-[13px] font-extrabold px-2.5 py-1 rounded border ${finalMargin >= 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100/50" : "text-red-600 bg-red-50 border-red-100/50"}`}>
                      {finalMargin > 0 ? '+' : ''}{finalMargin.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </TableCell>

                  <TableCell className="text-right px-4">
                    <div className="flex items-center justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" 
                        onClick={(e) => { e.stopPropagation(); setHistoryDriver(row.driver); }} 
                        title="Historique Financier du Chauffeur (Cockpit)"
                        type="button"
                      >
                         <Clock className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {isExpanded && (
                  <TableRow className="bg-slate-50/30 hover:bg-slate-50/30 border-0">
                    <TableCell colSpan={10} className="p-0 border-b border-indigo-100/50">
                      <div className="pl-14 pr-6 py-6 border-l-2 border-indigo-400 bg-gradient-to-r from-indigo-50/40 to-transparent">
                         <div className="mb-4 flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-[12px] font-bold text-indigo-900 uppercase tracking-widest">
                               Détail des Tournées de {row.driver.first_name} {row.driver.last_name}  ({row.runs.length})
                            </h4>
                         </div>
                         <div className="rounded-xl overflow-hidden border border-slate-200/60 shadow-sm bg-white">
                            <RunsTable data={row.runs} showHistoryAction={true} />
                         </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Cockpit / Driver Financial History Modal */}
      {historyDriver && (
        <DriverHistoryDialog 
          open={!!historyDriver} 
          onOpenChange={(open) => !open && setHistoryDriver(null)} 
          driverId={historyDriver.id}
          driverName={`${historyDriver.first_name} ${historyDriver.last_name}`}
        />
      )}
    </div>
  );
}
