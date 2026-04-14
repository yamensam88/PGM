"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveUnifiedDelivery } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function UnifiedDeliveryForm({
  driverId,
  vehicles,
  clients,
  runs
}: {
  driverId: string;
  vehicles: { id: string; plate_number: string }[];
  clients: { id: string; name: string }[];
  runs: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // We keep a consolidated state for the vehicle inputs
  const firstRun = runs[0] || {};
  const [kmStart, setKmStart] = useState(firstRun.km_start?.toString() || "");
  const [kmEnd, setKmEnd] = useState(firstRun.km_end?.toString() || "");
  const [fuelLiters, setFuelLiters] = useState(firstRun.fuel_consumed_liters?.toString() || "");
  const [fuelPrice, setFuelPrice] = useState("");
  const [vehicleId, setVehicleId] = useState(firstRun.vehicle_id || vehicles[0]?.id || "");
  const [routeNumber, setRouteNumber] = useState(firstRun.run_code?.startsWith('AUTO-') ? "" : (firstRun.run_code || ""));

  // Dynamic state for each run
  const [runStats, setRunStats] = useState<Record<string, { loaded: string, returned: string, relay: string, collected: string }>>(
    runs.reduce((acc, r) => ({
      ...acc,
      [r.id]: {
         loaded: r.packages_loaded?.toString() || "",
         returned: r.packages_returned?.toString() || "",
         relay: r.packages_relay?.toString() || "",
         collected: r.stops_completed?.toString() || ""
      }
    }), {})
  );

  const handleStatChange = (runId: string, field: string, value: string) => {
    setRunStats(prev => ({ ...prev, [runId]: { ...prev[runId], [field]: value } }));
  };

  const totalLoaded = Object.values(runStats).reduce((sum, s) => sum + (parseInt(s.loaded) || 0), 0);
  const totalReturned = Object.values(runStats).reduce((sum, s) => sum + (parseInt(s.returned) || 0), 0);
  const totalDelivered = Object.values(runStats).reduce((sum, s) => sum + Math.max(0, (parseInt(s.loaded) || 0) - (parseInt(s.returned) || 0)), 0);
  const totalRelais = Object.values(runStats).reduce((sum, s) => sum + (parseInt(s.relay) || 0), 0);
  const totalCollected = Object.values(runStats).reduce((sum, s) => sum + (parseInt(s.collected) || 0), 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    const formData = new FormData(e.currentTarget);
    formData.append("driverId", driverId);
    formData.append("runIds", JSON.stringify(runs.map(r => r.id)));
    formData.append("runStats", JSON.stringify(runStats));

    startTransition(async () => {
      try {
        const result = await saveUnifiedDelivery(formData);
        if (result.success) {
           // Wait a bit to ensure UI reflects
           router.refresh();
        } else {
          setError(result.error || "Erreur lors de l'enregistrement.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Nouvelle Livraison</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Ligne 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
             <Label htmlFor="date" className="text-sm font-semibold text-zinc-700">Date</Label>
             <Input type="date" id="date" name="date" defaultValue={todayStr} required className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="route_number" className="text-sm font-semibold text-zinc-700">Zone</Label>
             <Input type="text" id="route_number" name="route_number" value={routeNumber} onChange={e => setRouteNumber(e.target.value)} placeholder="Ex: Zone Nord" className="h-10 w-full" />
          </div>
        </div>

        {/* Ligne 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-1.5">
             <Label htmlFor="vehicle_id" className="text-sm font-semibold text-zinc-700">Immatriculation du Véhicule</Label>
             <select 
               id="vehicle_id" 
               name="vehicle_id" 
               required 
               value={vehicleId}
               onChange={e => setVehicleId(e.target.value)}
               className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
             >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
             </select>
          </div>
        </div>

        {runs.map((r, i) => {
          const l = parseInt(runStats[r.id]?.loaded) || 0;
          const ret = parseInt(runStats[r.id]?.returned) || 0;
          const liv = Math.max(0, l - ret);
          const clientName = r.client?.name || `Client ${i + 1}`;

          return (
            <div key={r.id} className="space-y-4 pt-4 border-t border-slate-100">
               <h3 className="text-base font-bold text-zinc-900">{clientName}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                     <Label className="text-sm font-semibold text-zinc-600">Colis Chargés</Label>
                     <Input type="number" value={runStats[r.id]?.loaded} onChange={e => handleStatChange(r.id, 'loaded', e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-sm font-semibold text-zinc-600">Colis Avisés</Label>
                     <Input type="number" value={runStats[r.id]?.returned} onChange={e => handleStatChange(r.id, 'returned', e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-sm font-semibold text-zinc-600">Colis Relais</Label>
                     <Input type="number" value={runStats[r.id]?.relay} onChange={e => handleStatChange(r.id, 'relay', e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-sm font-semibold text-zinc-600">Enlèvements</Label>
                     <Input type="number" value={runStats[r.id]?.collected} onChange={e => handleStatChange(r.id, 'collected', e.target.value)} className="h-10" />
                  </div>
               </div>
               <p className="text-sm text-slate-500 mt-2">Livrés (Calculé): <span className="font-bold text-emerald-600">{liv}</span></p>
            </div>
          );
        })}

        {/* Résumé */}
        <div className="bg-[#f8f9fa] rounded-lg p-6 mt-6">
           <h3 className="text-base font-bold text-zinc-900 mb-4">Résumé Total</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Colis Chargés</p>
                <p className="text-xl font-bold">{totalLoaded}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Colis Avisés</p>
                <p className="text-xl font-bold">{totalReturned}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Colis Livrés</p>
                <p className="text-xl font-bold">{totalDelivered}</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Colis Relais</p>
                <p className="text-xl font-bold">{totalRelais}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Colis Collectés</p>
                <p className="text-xl font-bold">{totalCollected}</p>
              </div>
           </div>
        </div>

        {/* Data Véhicule Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
           <div className="space-y-1.5">
             <Label htmlFor="km_start" className="text-sm font-semibold text-zinc-700">Kilométrage Départ</Label>
             <Input type="number" id="km_start" name="km_start" value={kmStart} onChange={e => setKmStart(e.target.value)} required className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="km_end" className="text-sm font-semibold text-zinc-700">Kilométrage Arrivée</Label>
             <Input type="number" id="km_end" name="km_end" value={kmEnd} onChange={e => setKmEnd(e.target.value)} required className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="fuel_liters" className="text-sm font-semibold text-zinc-700">Quantité de Carburant (L)</Label>
             <Input type="number" step="0.01" id="fuel_liters" name="fuel_liters" value={fuelLiters} onChange={e => setFuelLiters(e.target.value)} className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="fuel_price" className="text-sm font-semibold text-zinc-700">Prix du Carburant (€/L)</Label>
             <Input type="number" step="0.001" id="fuel_price" name="fuel_price" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} placeholder="Prix à la pompe" className="h-10 w-full" />
          </div>
        </div>
        
        {/* Ligne Gasoil Photo */}
        <div className="pt-2">
           <Label htmlFor="fuel_receipt" className="text-sm font-semibold text-zinc-700 block mb-1.5">Ticket / Reçu Gasoil (Photo)</Label>
           <Input 
             id="fuel_receipt" 
             name="fuel_receipt" 
             type="file" 
             accept="image/*,.pdf" 
             className="text-slate-500 file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 hover:file:bg-blue-100 cursor-pointer h-10 pt-1.5 w-full" 
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <div className="pt-6 flex justify-end">
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-slate-900 px-6 py-2.5 rounded-md font-medium text-[15px] transition-colors disabled:opacity-50"
          >
            {isPending ? "Enregistrement..." : "Enregistrer la livraison"}
          </button>
        </div>

      </form>
    </div>
  );
}
