"use client";

import { Flame, AlertTriangle, Wrench, HeartCrack, Info, ShieldAlert, BadgeCheck, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FuelAnomaly {
  driverName: string;
  avgConsumption: number;
  totalKm: number;
}

interface DamageAnomaly {
  driverName: string;
  count: number;
  totalCost: number;
}

interface MaintenanceAnomaly {
  driverName: string;
  vehiclePlate: string;
  cost: number;
  reason: string;
}

export function FleetRadarAlerts({
  fuelAnomalies,
  damageAnomalies,
  maintenanceAnomalies
}: {
  fuelAnomalies: FuelAnomaly[],
  damageAnomalies: DamageAnomaly[],
  maintenanceAnomalies: MaintenanceAnomaly[]
}) {
  const isAllClear = fuelAnomalies.length === 0 && damageAnomalies.length === 0 && maintenanceAnomalies.length === 0;

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <Card className="bg-gradient-to-br from-red-50/50 via-white to-red-50/10 border border-red-100 shadow-[0_2px_15px_rgba(220,38,38,0.06)] ring-1 ring-red-900/5 rounded-2xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
          <AlertOctagon className="w-48 h-48 text-red-600" />
        </div>
        
        <CardHeader className="pb-4 border-b border-red-100/50 bg-red-50/30 backdrop-blur-sm flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-extrabold text-red-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Radar des Anomalies Conducteurs
            </CardTitle>
            <CardDescription className="text-xs text-red-900/60 font-medium tracking-wide mt-1">
              Surconsommation de carburant, casses répétées et usure anormale (selon kilomètres parcours).
            </CardDescription>
          </div>
          {isAllClear && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <BadgeCheck className="w-3.5 h-3.5 mr-1" /> Flotte Saine
            </Badge>
          )}
        </CardHeader>

        <CardContent className="pt-6 px-6 pb-6 relative z-10">
          {isAllClear ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Aucune anomalie détectée sur la période filtrée.</p>
              <p className="text-xs text-slate-500 mt-1">Consommations sous les seuils et pas d'usures prématurées.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1 : Carburant */}
              <div className="bg-white/60 border border-orange-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Flame className="w-4 h-4 text-orange-500" /> Gasoil Pied Lourd {">"} 12L/100
                </h3>
                {fuelAnomalies.length > 0 ? (
                  <ul className="space-y-3">
                    {fuelAnomalies.map((a, i) => (
                      <li key={i} className="flex justify-between items-center text-sm border-b border-orange-50 pb-2 last:border-0">
                        <span className="font-semibold text-slate-700">{a.driverName}</span>
                        <div className="text-right">
                          <span className="font-bold text-orange-600">{a.avgConsumption.toFixed(1)} L/100</span>
                          <span className="block text-[10px] text-slate-400">sur {a.totalKm.toFixed(0)} km</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                   <p className="text-xs text-slate-400 italic">Paramètres normaux mesurés.</p>
                )}
              </div>

              {/* Box 2 : Casses */}
              <div className="bg-white/60 border border-red-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <HeartCrack className="w-4 h-4 text-red-500" /> Sinistres / Brise-fer
                </h3>
                {damageAnomalies.length > 0 ? (
                  <ul className="space-y-3">
                    {damageAnomalies.map((a, i) => (
                      <li key={i} className="flex justify-between items-center text-sm border-b border-red-50 pb-2 last:border-0">
                        <div>
                          <span className="font-semibold text-slate-700 block">{a.driverName}</span>
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{a.count} sinistre(s)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-red-600">-{a.totalCost.toFixed(2)} €</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                   <p className="text-xs text-slate-400 italic">Aucune casse recensée.</p>
                )}
              </div>

              {/* Box 3 : Usure Prématurée */}
              <div className="bg-white/60 border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Wrench className="w-4 h-4 text-slate-500" /> Usure (Pneus/Freins)
                </h3>
                {maintenanceAnomalies.length > 0 ? (
                  <ul className="space-y-3">
                    {maintenanceAnomalies.map((a, i) => (
                      <li key={i} className="flex flex-col text-sm border-b border-slate-100 pb-3 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold flex items-center gap-1.5 text-slate-700">
                             {a.driverName}
                          </span>
                          <span className="font-bold text-slate-600">-{a.cost.toFixed(2)} €</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 leading-tight">
                           <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">{a.vehiclePlate}</span>
                           <span className="truncate" title={a.reason}>{a.reason}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                   <p className="text-xs text-slate-400 italic">Usure mécanique cohérente.</p>
                )}
              </div>

            </div>
          )}
          
          <div className="mt-4 flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50 text-[10px] text-red-800/80 font-medium">
             <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
             <p>Les chauffeurs ciblés dans l'usure mécanique (pneus, plaquettes) sont déduits statistiquement car ils ont effectué le plus grand nombre de kilomètres utile avec ce véhicule sur la période observée. L'action est donc imputée indirectement.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
