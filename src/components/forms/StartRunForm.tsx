"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { startRun } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation, Truck, Package } from "lucide-react";

export function StartRunForm({
  runId,
  vehicles,
  defaultVehicleId,
  defaultPackagesLoaded,
  defaultPackagesRelay,
}: {
  runId: string;
  vehicles: { id: string; plate_number: string }[];
  defaultVehicleId?: string | null;
  defaultPackagesLoaded: number;
  defaultPackagesRelay: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("runId", runId);

    startTransition(async () => {
      try {
        const result = await startRun(formData);
        if (result.success) {
          router.push("/driver");
        } else {
          setError((result as any).error || "Erreur lors du démarrage.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div className="bg-white dark:bg-white shadow-sm border border-zinc-200 dark:border-slate-200 rounded-xl p-5 space-y-5">
        
        <div className="space-y-2">
          <Label htmlFor="vehicle_id" className="flex items-center gap-2"><Truck className="w-4 h-4 text-blue-500" /> Véhicule utilisé</Label>
          <select 
            id="vehicle_id" 
            name="vehicle_id" 
            required 
            defaultValue={defaultVehicleId || ""}
            className="flex h-12 w-full items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-base text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-300 dark:bg-[#f8f9fc] dark:text-zinc-50"
          >
             <option value="">Sélectionner un véhicule</option>
             {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="km_start" className="flex items-center gap-2">Kilométrage de Départ</Label>
          <Input 
            id="km_start" 
            name="km_start" 
            type="number" 
            required 
            placeholder="Ex: 145000"
            className="h-12 text-lg font-medium" 
          />
        </div>

      </div>

      <div className="bg-white dark:bg-white shadow-sm border border-zinc-200 dark:border-slate-200 rounded-xl p-5 space-y-5">
         <h3 className="font-semibold text-zinc-900 dark:text-slate-900 flex items-center gap-2 border-b border-zinc-100 dark:border-slate-200 pb-3 mb-4">
            <Package className="w-5 h-5 text-emerald-500" /> Validation du Chargement
         </h3>

        <div className="space-y-2">
          <Label htmlFor="packages_loaded">Colis pour Clients Directs</Label>
          <Input 
            id="packages_loaded" 
            name="packages_loaded" 
            type="number" 
            required 
            defaultValue={defaultPackagesLoaded}
            className="h-12 text-lg font-medium" 
          />
        </div>

         <div className="space-y-2">
          <Label htmlFor="packages_relay">Colis pour Points Relais</Label>
          <Input 
            id="packages_relay" 
            name="packages_relay" 
            type="number" 
            required 
            defaultValue={defaultPackagesRelay}
            className="h-12 text-lg font-medium" 
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-sm text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-xl h-14 text-lg shadow-lg shadow-blue-500/20" disabled={isPending}>
        {isPending ? "Démarrage en cours..." : <><Navigation className="mr-2 w-6 h-6" /> Confirmer & Démarrer</>}
      </Button>
      
      <Button type="button" variant="ghost" className="w-full h-12 text-slate-500" onClick={() => router.back()} disabled={isPending}>
        Annuler
      </Button>

    </form>
  );
}
