"use client";

import { useTransition, useState } from "react";
import { reportVehicleDamage } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateDamageForm({ runId, vehicleId, drivers, onSuccess }: { runId?: string, vehicleId: string, drivers: {id: string, first_name: string, last_name: string}[], onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("vehicle_id", vehicleId);
    if (runId) formData.append("run_id", runId);

    startTransition(async () => {
      try {
        const result = await reportVehicleDamage(formData);
        if (result.success) {
          if (onSuccess) onSuccess();
        } else {
          setError((result as any).error || "Erreur lors de l'enregistrement.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 py-4">
      <div className="bg-red-500/10 text-red-400 p-3 rounded-md text-[13px] mb-2 border border-red-500/20 font-medium leading-relaxed">
        Déclarez une casse ou un sinistre. Le montant saisi sera enregistré comme une charge financière imputée au véhicule ainsi qu'au chauffeur responsable sélectionné.
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="driver_id" className="text-right font-medium text-slate-600 text-[13px]">Chauffeur Resp.</Label>
        <select 
          id="driver_id" 
          name="driver_id" 
          required 
          className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
        >
           <option value="">Sélectionner un chauffeur</option>
           {drivers.map(d => (
             <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
           ))}
        </select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right font-medium text-slate-600 text-[13px]">Date du sinistre</Label>
        <Input id="date" name="date" type="date" required className="col-span-3 bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 [color-scheme:dark]" defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="cost" className="text-right font-medium text-slate-600 text-[13px]">Coût Estimé (€)</Label>
        <Input id="cost" name="cost" type="number" step="0.01" required className="col-span-3 bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" placeholder="500.00" />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right font-medium text-slate-600 text-[13px]">Détails casse</Label>
        <Input id="description" name="description" required className="col-span-3 bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 placeholder:text-zinc-600" placeholder="Rétroviseur cassé, pare-choc enfoncé..." />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="document" className="text-right font-medium text-slate-600 text-[13px]">Justificatif (Optionnel)</Label>
        <Input id="document" name="document" type="file" accept="image/*,.pdf" className="col-span-3 cursor-pointer file:cursor-pointer bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 file:text-slate-600 file:bg-white" />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[13px] mt-2 font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        {onSuccess && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onSuccess()}
            disabled={isPending}
            className="border-slate-200 bg-transparent text-slate-600 hover:bg-white hover:text-slate-900"
          >
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="bg-red-600 text-slate-900 hover:bg-red-700 shadow-sm shadow-red-900/20">
          {isPending ? "Enregistrement..." : "Signaler la casse"}
        </Button>
      </div>
    </form>
  );
}
