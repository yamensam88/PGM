"use client";

import { useState } from "react";
import { simulateRetroactiveCosts, applyRetroactiveCosts, SimulationSummary } from "@/lib/retroactive";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Euro,
  Loader2,
  RefreshCw,
  Search,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RetroactiveSimulationForm() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [isLoadingSim, setIsLoadingSim] = useState(false);
  const [isLoadingApp, setIsLoadingApp] = useState(false);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  const handleSimulate = async () => {
    if (!startDate || !endDate) {
      setError("Veuillez sélectionner une date de début et de fin.");
      return;
    }
    
    setIsLoadingSim(true);
    setError(null);
    setSuccess(null);
    setSummary(null);
    setHasApplied(false);

    try {
      const res = await simulateRetroactiveCosts(startDate, endDate);
      if (res.success && res.data) {
        setSummary(res.data);
        if (res.data.results.length === 0) {
          setError("Aucune différence de marge détectée. Vos tournées utilisent déjà les tarifs actuels.");
        }
      } else {
        setError(res.error || "Une erreur est survenue lors de la simulation.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsLoadingSim(false);
    }
  };

  const handleApply = async () => {
    if (!summary || summary.results.length === 0) return;
    
    if (!confirm(`Etes-vous sûr de vouloir remplacer définitivement les données financières de ces ${summary.total_runs_affected} tournées ? Cette action va modifier votre grand livre comptable de façon permanente.`)) {
      return;
    }

    setIsLoadingApp(true);
    setError(null);
    
    try {
      const res = await applyRetroactiveCosts(startDate, endDate);
      if (res.success) {
        setSuccess(res.message || "Opération terminée avec succès.");
        setHasApplied(true);
      } else {
        setError(res.error || "Une erreur est survenue lors de l'application.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setIsLoadingApp(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Moteur de Rétroactivité
            </h3>
            <p className="text-sm text-slate-500 mt-1">Calculez et appliquez l'impact financier de vos nouveaux tarifs sur les tournées passées.</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Date de début</Label>
              <Input 
                type="date" 
                className="h-11 border-slate-200"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoadingSim || isLoadingApp}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Date de fin</Label>
              <Input 
                type="date" 
                className="h-11 border-slate-200"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoadingSim || isLoadingApp}
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-start gap-3 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <Button 
                onClick={handleSimulate} 
                disabled={isLoadingSim || isLoadingApp || !startDate || !endDate}
                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              {isLoadingSim ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Simulation en cours...</>
              ) : (
                <><Calculator className="w-4 h-4 mr-2" /> Simuler l'impact</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Card */}
      {summary && summary.results.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Résultat de la simulation</h3>
              <p className="text-sm text-slate-500 mt-1">{summary.total_runs_affected} tournées historisées seront impactées.</p>
            </div>
            
            <div className="flex gap-4 items-center">
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${summary.total_delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <Euro className="w-4 h-4" />
                    Impact Net : {summary.total_delta > 0 ? '+' : ''}{summary.total_delta.toFixed(2)} €
                </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Chauffeur</th>
                  <th className="px-6 py-4">Véhicule</th>
                  <th className="px-6 py-4 text-right">Ancienne Marge</th>
                  <th className="px-6 py-4 text-right">Nouvelle Marge</th>
                  <th className="px-6 py-4 text-right">Écart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {summary.results.map((item, idx) => (
                  <tr key={item.run_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">{format(new Date(item.date), "dd MMM yyyy", { locale: fr })}</td>
                    <td className="px-6 py-4 font-medium">{item.driver_name}</td>
                    <td className="px-6 py-4">{item.vehicle_plate}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-slate-500">{item.old_margin.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-right text-indigo-600 font-semibold tabular-nums">{item.new_margin.toFixed(2)} €</td>
                    <td className="px-6 py-4 text-right tabular-nums">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.delta > 0 ? 'bg-emerald-100/50 text-emerald-700' : 'bg-red-100/50 text-red-700'}`}>
                            {item.delta > 0 ? '+' : ''}{item.delta.toFixed(2)} €
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!hasApplied && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-sm text-slate-500 max-w-lg">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1 text-amber-500" />
                    En appliquant, ces résultats remplaceront définitivement les données actuelles dans la base et le grand livre.
                </div>
                <Button 
                    onClick={handleApply} 
                    disabled={isLoadingApp || hasApplied}
                    className="h-11 px-6 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
                >
                {isLoadingApp ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Application en cours...</>
                ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Appliquer à l'historique</>
                )}
                </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
