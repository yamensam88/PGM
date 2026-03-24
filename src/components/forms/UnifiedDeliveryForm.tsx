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
  runId,
  initialData
}: {
  driverId: string;
  vehicles: { id: string; plate_number: string }[];
  clients: { id: string; name: string }[];
  runId?: string;
  initialData?: any; // To allow same-day editing
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state for calculation
  const [loaded1, setLoaded1] = useState(initialData?.packages_loaded?.toString() || "");
  const [returned1, setReturned1] = useState(initialData?.packages_returned?.toString() || "");
  const [loaded2, setLoaded2] = useState("");
  const [returned2, setReturned2] = useState("");
  const [relais, setRelais] = useState(initialData?.packages_relay?.toString() || "");
  const [collected, setCollected] = useState(initialData?.stops_completed?.toString() || "");

  const l1 = parseInt(loaded1) || 0;
  const r1 = parseInt(returned1) || 0;
  const l2 = parseInt(loaded2) || 0;
  const r2 = parseInt(returned2) || 0;
  
  const liv1 = Math.max(0, l1 - r1);
  const liv2 = Math.max(0, l2 - r2);

  const totalLoaded = l1 + l2;
  const totalReturned = r1 + r2;
  const totalDelivered = liv1 + liv2;
  const totalRelais = parseInt(relais) || 0;
  const totalCollected = parseInt(collected) || 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    // Explicitly append computed fields if needed, but backend recalculates them anyway
    // Just append the IDs
    formData.append("driverId", driverId);
    if (runId) formData.append("runId", runId);

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
             <Input type="text" id="route_number" name="route_number" defaultValue={initialData?.run_code?.startsWith('AUTO-') ? "" : (initialData?.run_code || "")} placeholder="Ex: Zone Nord" className="h-10 w-full" />
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
               defaultValue={initialData?.vehicle_id || ""}
               className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
             >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
             </select>
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="client_id" className="text-sm font-semibold text-zinc-700">Client Principal</Label>
             <select 
               id="client_id" 
               name="client_id" 
               required 
               defaultValue={initialData?.client_id || ""}
               className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
             >
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>

        {/* Client 1 */}
        <div className="space-y-4 pt-4">
           <h3 className="text-base font-bold text-zinc-900">Client 1</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <Label htmlFor="client1_loaded" className="text-sm font-semibold text-zinc-600">Colis Chargés (1)</Label>
                 <Input type="number" id="client1_loaded" name="client1_loaded" value={loaded1} onChange={e => setLoaded1(e.target.value)} className="h-10" />
                 <p className="text-sm text-slate-500 mt-2">Colis Livrés (1): <span className="font-bold text-zinc-900">{liv1}</span></p>
              </div>
              <div className="space-y-1.5">
                 <Label htmlFor="client1_returned" className="text-sm font-semibold text-zinc-600">Colis Retournés (1)</Label>
                 <Input type="number" id="client1_returned" name="client1_returned" value={returned1} onChange={e => setReturned1(e.target.value)} className="h-10" />
              </div>
           </div>
        </div>

        {/* Client 2 */}
        <div className="space-y-4 pt-2">
           <h3 className="text-base font-bold text-zinc-900">Client 2</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <Label htmlFor="client2_loaded" className="text-sm font-semibold text-zinc-600">Colis Chargés (2)</Label>
                 <Input type="number" id="client2_loaded" name="client2_loaded" value={loaded2} onChange={e => setLoaded2(e.target.value)} className="h-10" />
                 <p className="text-sm text-slate-500 mt-2">Colis Livrés (2): <span className="font-bold text-zinc-900">{liv2}</span></p>
              </div>
              <div className="space-y-1.5">
                 <Label htmlFor="client2_returned" className="text-sm font-semibold text-zinc-600">Colis Retournés (2)</Label>
                 <Input type="number" id="client2_returned" name="client2_returned" value={returned2} onChange={e => setReturned2(e.target.value)} className="h-10" />
              </div>
           </div>
        </div>

        {/* Relais */}
        <div className="space-y-4 pt-2">
           <h3 className="text-base font-bold text-zinc-900">Colis Relais et Collectés</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <Label htmlFor="colis_relay" className="text-sm font-semibold text-zinc-600">Colis Relais</Label>
                 <Input type="number" id="colis_relay" name="colis_relay" value={relais} onChange={e => setRelais(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                 <Label htmlFor="colis_collected" className="text-sm font-semibold text-zinc-600">Colis Collectés</Label>
                 <Input type="number" id="colis_collected" name="colis_collected" value={collected} onChange={e => setCollected(e.target.value)} className="h-10" />
              </div>
           </div>
        </div>

        {/* Résumé */}
        <div className="bg-[#f8f9fa] rounded-lg p-6 mt-6">
           <h3 className="text-base font-bold text-zinc-900 mb-4">Résumé Total</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Colis Chargés</p>
                <p className="text-xl font-bold">{totalLoaded}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Colis Retournés</p>
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
             <Input type="number" id="km_start" name="km_start" defaultValue={initialData?.km_start || ""} required className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="km_end" className="text-sm font-semibold text-zinc-700">Kilométrage Arrivée</Label>
             <Input type="number" id="km_end" name="km_end" defaultValue={initialData?.km_end || ""} required className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="fuel_liters" className="text-sm font-semibold text-zinc-700">Quantité de Carburant (L)</Label>
             <Input type="number" step="0.01" id="fuel_liters" name="fuel_liters" defaultValue={initialData?.fuel_consumed_liters || ""} className="h-10 w-full" />
          </div>
          <div className="space-y-1.5">
             <Label htmlFor="fuel_price" className="text-sm font-semibold text-zinc-700">Prix du Carburant (€/L)</Label>
             <Input type="number" step="0.001" id="fuel_price" name="fuel_price" placeholder="Prix à la pompe" className="h-10 w-full" />
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
