"use client";

import { useTransition, useState } from "react";
import { setVehicleAppointment } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetAppointmentFormProps {
  vehicleId: string;
  currentDate?: string;
  currentNature?: string;
  onSuccess?: () => void;
}

export function SetAppointmentForm({ vehicleId, currentDate, currentNature, onSuccess }: SetAppointmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const nature = formData.get("nature") as string;

    startTransition(async () => {
      try {
        const result = await setVehicleAppointment(vehicleId, date, nature);
        if (result.success) {
          if (onSuccess) onSuccess();
        } else {
          setError((result as any).error || "Erreur lors de l'enregistrement du RDV.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  const defaultDate = currentDate ? new Date(currentDate).toISOString().split('T')[0] : "";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">Date du RDV</Label>
        <Input id="date" name="date" type="date" required defaultValue={defaultDate} className="col-span-3" />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="nature" className="text-right">Nature</Label>
        <select 
          id="nature" 
          name="nature" 
          required 
          defaultValue={currentNature || "oil_change"}
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

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm mt-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <Button type="submit" disabled={isPending} className="bg-blue-600 text-slate-900 hover:bg-blue-700">
          {isPending ? "Enregistrement..." : "Enregistrer RDV"}
        </Button>
      </div>
    </form>
  );
}
