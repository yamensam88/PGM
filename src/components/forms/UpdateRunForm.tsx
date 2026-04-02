"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { updateRun } from "@/lib/actions";

export function UpdateRunForm({ initialData, onSuccess }: { initialData: any; onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("runId", initialData.id);
    
    startTransition(async () => {
       try {
         const result = await updateRun(formData);
         if (result.success) {
           router.refresh();
           if (onSuccess) onSuccess();
         } else {
           setError(result.error || "Une erreur est survenue lors de la mise à jour.");
         }
       } catch (err: any) {
         setError(err.message || "Une erreur inattendue est survenue.");
       }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label htmlFor="status">Statut de la tournée</Label>
          <select 
            id="status" 
            name="status" 
            defaultValue={initialData.status}
            className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
          >
            <option value="planned">Planifiée</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="failed">Échec</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-zinc-50/5 p-4 rounded-xl border border-zinc-200/10 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="packages_loaded">Colis Chargés (Total)</Label>
          <Input id="packages_loaded" name="packages_loaded" type="number" min="0" defaultValue={initialData.packages_loaded || 0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_delivered">Colis Livrés</Label>
          <Input id="packages_delivered" name="packages_delivered" type="number" min="0" defaultValue={initialData.packages_delivered || 0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_advised_direct">Avisés Direct</Label>
          <Input id="packages_advised_direct" name="packages_advised_direct" type="number" min="0" defaultValue={initialData.packages_advised_direct || 0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_advised_relay">Avisés Relais</Label>
          <Input id="packages_advised_relay" name="packages_advised_relay" type="number" min="0" defaultValue={initialData.packages_advised_relay || 0} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="packages_returned">Colis Retournés</Label>
          <Input id="packages_returned" name="packages_returned" type="number" min="0" defaultValue={initialData.packages_returned || 0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="km_start">Km Départ</Label>
          <Input id="km_start" name="km_start" type="number" step="0.1" defaultValue={initialData.km_start ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="km_end">Km Arrivée</Label>
          <Input id="km_end" name="km_end" type="number" step="0.1" defaultValue={initialData.km_end ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fuel_liters">Gasoil ajouté (Litres)</Label>
          <Input id="fuel_liters" name="fuel_liters" type="number" step="0.01" defaultValue={initialData.fuel_consumed_liters ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuel_price">Prix Unit. (€/L)</Label>
          <Input id="fuel_price" name="fuel_price" type="number" step="0.001" placeholder="Ex: 1.85 (Optionnel)" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-sm text-red-600 border-l-4 border-red-500">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="button" variant="outline" className="mr-4 text-slate-700" onClick={onSuccess}>
          Annuler
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
          {isPending ? "Mise à jour..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
