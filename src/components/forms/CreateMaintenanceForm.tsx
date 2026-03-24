"use client";

import { useTransition, useState } from "react";
import { addMaintenanceLog } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateMaintenanceFormProps {
  vehicleId: string;
  scheduledRdv?: {
    date: string | Date;
    nature?: string;
  };
  onSuccess?: () => void;
}

export function CreateMaintenanceForm({ vehicleId, scheduledRdv, onSuccess }: CreateMaintenanceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append("vehicle_id", vehicleId);

    startTransition(async () => {
      try {
        const result = await addMaintenanceLog(formData);
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
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">Type</Label>
        <select 
          id="type" 
          name="type" 
          required 
          defaultValue={scheduledRdv?.nature || "oil_change"}
          className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:ring-offset-zinc-950 dark:placeholder:text-slate-500 dark:focus:ring-zinc-300"
        >
           <option value="oil_change">Vidange</option>
           <option value="tires">Pneus / Jantes</option>
           <option value="mechanics">Mécanique</option>
           <option value="repair">Réparation / Carrosserie</option>
           <option value="inspection">Contrôle technique</option>
           <option value="other">Autre</option>
        </select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">Date</Label>
        <Input id="date" name="date" type="date" required className="col-span-3" defaultValue={scheduledRdv?.date ? new Date(scheduledRdv.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="cost" className="text-right">Coût (€ HT)</Label>
        <Input id="cost" name="cost" type="number" step="0.01" required className="col-span-3" placeholder="250.00" />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="km" className="text-right">Kilométrage</Label>
        <Input id="km" name="km" type="number" required className="col-span-3" placeholder="125500" />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="vendorName" className="text-right">Garage / Atel.</Label>
        <Input id="vendorName" name="vendorName" className="col-span-3" placeholder="Garage du Centre" />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Détails</Label>
        <Input id="description" name="description" className="col-span-3" placeholder="Changement plaquettes AV" />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="document" className="text-right">Justificatif / Facture</Label>
        <Input id="document" name="document" type="file" accept="image/*,.pdf" className="col-span-3 cursor-pointer file:cursor-pointer" />
      </div>

      {scheduledRdv && (
        <div className="pt-4 border-t border-zinc-200 dark:border-slate-200 flex items-center gap-3">
          <Input id="clear_appointment" name="clear_appointment" type="checkbox" value="true" defaultChecked className="w-5 h-5 text-emerald-600 rounded" />
          <Label htmlFor="clear_appointment" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 leading-snug cursor-pointer">
            Clôturer le RDV prévu du {new Date(scheduledRdv.date).toLocaleDateString('fr-FR')} <br/>
            <span className="text-xs font-normal opacity-80">({scheduledRdv.nature || "Non spécifié"})</span>
          </Label>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm mt-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <Button type="submit" disabled={isPending} className="bg-amber-600 text-slate-900 hover:bg-amber-700">
          {isPending ? "Enregistrement..." : "Valider l'entretien"}
        </Button>
      </div>
    </form>
  );
}
