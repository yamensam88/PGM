"use client";

import { useTransition, useState } from "react";
import { updateVehicle } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditVehicleFormProps {
  vehicle: any;
  onSuccess?: () => void;
}

export function EditVehicleForm({ vehicle, onSuccess }: EditVehicleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ownershipType, setOwnershipType] = useState<string>(vehicle.ownership_type || "owned");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateVehicle(formData);
        if (result.success) {
          if (onSuccess) onSuccess();
        } else {
          setError((result as any).error || "Erreur lors de la mise à jour.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <input type="hidden" name="vehicleId" value={vehicle.id} />
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="plate_number" className="text-right">Plaque</Label>
        <Input id="plate_number" name="plate_number" defaultValue={vehicle.plate_number} required className="col-span-3" />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="category" className="text-right">Catégorie</Label>
        <Input id="category" name="category" defaultValue={vehicle.category || ''} className="col-span-3" />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="ownership_type" className="text-right">Propriété</Label>
        <select 
          id="ownership_type" 
          name="ownership_type" 
          required 
          value={ownershipType}
          onChange={(e) => setOwnershipType(e.target.value)}
          className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:ring-offset-zinc-950 dark:placeholder:text-slate-500 dark:focus:ring-zinc-300"
        >
           <option value="owned">En Propre (Acheté)</option>
           <option value="rented">Locatier (Loué)</option>
        </select>
      </div>

      {ownershipType === 'rented' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lessor_name" className="text-right">Nom Locatier</Label>
          <Input id="lessor_name" name="lessor_name" defaultValue={vehicle.lessor_name || ''} required className="col-span-3" />
        </div>
      )}

      {ownershipType === 'owned' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="fixed_monthly_cost" className="text-right">Coût Fixe / Mensualité (€)</Label>
          <Input id="fixed_monthly_cost" name="fixed_monthly_cost" type="number" step="0.01" defaultValue={Number(vehicle.fixed_monthly_cost || 0)} className="col-span-3" />
        </div>
      )}

      {ownershipType === 'rented' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rental_monthly_cost" className="text-right">Loyer Mensuel (€)</Label>
          <Input id="rental_monthly_cost" name="rental_monthly_cost" type="number" step="0.01" defaultValue={Number(vehicle.rental_monthly_cost || 0)} required className="col-span-3" />
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="insurance_monthly_cost" className="text-right">Assurance Mensuelle (€)</Label>
        <Input id="insurance_monthly_cost" name="insurance_monthly_cost" type="number" step="0.01" defaultValue={Number(vehicle.insurance_monthly_cost || 0)} className="col-span-3" />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm mt-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <Button type="submit" disabled={isPending} className="bg-blue-600 text-slate-900 hover:bg-blue-700">
          {isPending ? "Mise à jour..." : "Mettre à jour"}
        </Button>
      </div>
    </form>
  );
}
