"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createRun } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BaseDoc = { id: string; [key: string]: any };

export function CreateRunForm({
  drivers,
  vehicles,
  clients,
  zones,
  rateCards,
  onSuccess,
}: {
  drivers: BaseDoc[];
  vehicles: BaseDoc[];
  clients: BaseDoc[];
  zones: BaseDoc[];
  rateCards: BaseDoc[];
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClient, setSelectedClient] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const result = await createRun(formData);
        if (result.success) {
          router.refresh();
          if (onSuccess) onSuccess();
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        } else {
          setError((result as any).error || "Erreur lors de la création.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Ligne 1 */}
        <div className="space-y-2">
          <Label htmlFor="date">Date de livraison prévue</Label>
          <Input id="date" name="date" type="date" required value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client_id">Client / Commanditaire</Label>
          <select id="client_id" name="client_id" required value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:text-zinc-50 dark:focus:ring-zinc-300">
             <option value="">Sélectionner un client</option>
             {clients.filter(c => c.status !== 'suspended').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate_card_id">Grille Tarifaire</Label>
          <select id="rate_card_id" name="rate_card_id" required disabled={!selectedClient} className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:text-zinc-50 dark:focus:ring-zinc-300">
             <option value="">Sélectionner une grille</option>
             {rateCards.filter((rc: any) => rc.client_id === selectedClient).map((rc: any) => (
                <option key={rc.id} value={rc.id}>{rc.name}</option>
             ))}
          </select>
        </div>

        {/* Ligne 2 */}
        <div className="space-y-2">
          <Label htmlFor="zone_id">Zone de livraison</Label>
          <select id="zone_id" name="zone_id" required className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:text-zinc-50 dark:focus:ring-zinc-300">
             <option value="">Sélectionner une zone</option>
             {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver_id">Chauffeur Assigné</Label>
          <select id="driver_id" name="driver_id" required className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:text-zinc-50 dark:focus:ring-zinc-300">
             <option value="">Assigner un chauffeur</option>
             {drivers.map(d => {
                const [y, m, day] = selectedDate.split('-');
                const dt = new Date(Number(y), Number(m)-1, Number(day), 12, 0, 0, 0);

                const isOnLeave = (d.hr_events || []).find((e: any) => {
                   const s = new Date(e.start_date); s.setHours(0,0,0,0);
                   const end = e.end_date ? new Date(e.end_date) : new Date(e.start_date); 
                   end.setHours(23,59,59,999);
                   return dt >= s && dt <= end;
                });
                
                if (isOnLeave) {
                   return <option key={d.id} value={d.id}>⚠️ {d.first_name} {d.last_name} (En {isOnLeave.event_type === 'vacation' ? 'Congés' : 'Arrêt'})</option>;
                }
                return <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>;
             })}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle_id">Véhicule Assigné</Label>
          <select id="vehicle_id" name="vehicle_id" required className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:text-zinc-50 dark:focus:ring-zinc-300">
             <option value="">Assigner un véhicule</option>
             {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} ({v.category || "Standard"})</option>)}
          </select>
        </div>

        {/* Section: Objectifs / Planification */}
        <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-zinc-200 dark:border-slate-800">
           <h3 className="text-lg font-bold text-zinc-900 mb-4">Planification / Bilan de la Tournée</h3>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="direct_parcels" className="text-xs font-semibold text-slate-500 uppercase">Colis Prévus / Chargés</Label>
                <Input id="direct_parcels" name="direct_parcels" type="number" required defaultValue="0" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="colis_collected" className="text-xs font-semibold text-slate-500 uppercase">Colis Collectés</Label>
                <Input id="colis_collected" name="colis_collected" type="number" required defaultValue="0" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packages_delivered" className="text-xs font-semibold text-slate-500 uppercase">Colis Livrés</Label>
                <Input id="packages_delivered" name="packages_delivered" type="number" defaultValue="0" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packages_returned" className="text-xs font-semibold text-slate-500 uppercase">Colis Retournés</Label>
                <Input id="packages_returned" name="packages_returned" type="number" defaultValue="0" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="packages_relay" className="text-xs font-semibold text-slate-500 uppercase">Colis Relais</Label>
                <Input id="packages_relay" name="packages_relay" type="number" defaultValue="0" className="h-10" />
              </div>
           </div>
        </div>
        
        {/* Section: Clôture (Optionnelle) */}
        <div className="col-span-1 md:col-span-2 pt-2">
           <h3 className="text-sm font-semibold text-slate-700 mb-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">Paramètres de Clôture (Saisie a posteriori)</h3>
           <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="km_start" className="text-xs font-semibold text-slate-500 uppercase">KM Départ</Label>
                <Input id="km_start" name="km_start" type="number" placeholder="Ex: 50000" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km_end" className="text-xs font-semibold text-slate-500 uppercase">KM Arrivée</Label>
                <Input id="km_end" name="km_end" type="number" placeholder="Ex: 50150" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_liters" className="text-xs font-semibold text-slate-500 uppercase">Gasoil (Litres)</Label>
                <Input id="fuel_liters" name="fuel_liters" type="number" step="0.01" placeholder="Ex: 40" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_price" className="text-xs font-semibold text-slate-500 uppercase">Prix/L (€)</Label>
                <Input id="fuel_price" name="fuel_price" type="number" step="0.001" placeholder="Optionnel" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_receipt" className="text-xs font-semibold text-slate-500 uppercase">Justificatif</Label>
                <Input id="fuel_receipt" name="fuel_receipt" type="file" accept="image/*,.pdf" className="h-10 pt-2 text-xs" />
              </div>
              <div className="space-y-2 pb-2">
                 <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-800">
                   <input type="checkbox" id="mark_completed" name="mark_completed" value="yes" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                   <Label htmlFor="mark_completed" className="text-sm font-bold text-blue-700 dark:text-blue-400 cursor-pointer">Tournée Terminée</Label>
                 </div>
              </div>
           </div>
        </div>

        </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-slate-200">
         <Button type="button" variant="outline" className="mr-4" onClick={() => router.back()}>
           Annuler
         </Button>
         <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-slate-900" disabled={isPending}>
           {isPending ? "Création..." : "Planifier la tournée"}
         </Button>
      </div>

    </form>
  );
}
