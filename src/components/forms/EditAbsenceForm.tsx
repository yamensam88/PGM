"use client";

import { useTransition, useState } from "react";
import { updateDriverAbsence, deleteDriverAbsence } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditAbsenceFormProps {
  event: any;
  drivers: { id: string; first_name: string; last_name: string }[];
  onSuccess?: () => void;
}

export function EditAbsenceForm({ event, drivers, onSuccess }: EditAbsenceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateDriverAbsence(formData);
        if (result.success) {
          if (onSuccess) onSuccess();
        } else {
          setError((result as any).error || "Erreur lors de la modification.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Voulez-vous vraiment annuler cet événement RH de manière définitive ?")) return;
    
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteDriverAbsence(event.id);
        if (result.success) {
          if (onSuccess) onSuccess();
        } else {
          setError((result as any).error || "Erreur lors de la suppression.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  const startDateISO = new Date(event.start_date).toISOString().split('T')[0];
  const endDateISO = event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : "";

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 py-4">
      <input type="hidden" name="event_id" value={event.id} />
      
      <input type="hidden" name="driver_id" value={event.driver_id} />
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="driver_id_display" className="text-right font-medium text-slate-600 text-[13px]">Chauffeur <span className="text-red-500">*</span></Label>
        <select 
          id="driver_id_display" 
          disabled
          defaultValue={event.driver_id}
          className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-[13px] text-slate-500 pointer-events-none"
        >
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>
              {driver.first_name} {driver.last_name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="event_type" className="text-right font-medium text-slate-600 text-[13px]">Type <span className="text-red-500">*</span></Label>
        <select 
          id="event_type" 
          name="event_type" 
          required 
          defaultValue={event.event_type}
          className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
        >
          <option value="presence">Présence (non affecté / en base)</option>
          <option value="sick_leave">Arrêt Maladie</option>
          <option value="vacation">Congés Payés</option>
          <option value="absence">Absence Injustifiée</option>
        </select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="start_date" className="text-right font-medium text-slate-600 text-[13px]">Du <span className="text-red-500">*</span></Label>
        <Input id="start_date" name="start_date" type="date" required defaultValue={startDateISO} className="col-span-3 bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 [color-scheme:dark]" />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="end_date" className="text-right font-medium text-slate-600 text-[13px]">Au</Label>
        <Input id="end_date" name="end_date" type="date" defaultValue={endDateISO} className="col-span-3 bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 [color-scheme:dark]" />
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="notes" className="text-right font-medium mt-2 text-slate-600 text-[13px]">Notes</Label>
        <Textarea 
          id="notes" 
          name="notes" 
          defaultValue={event.notes || ""}
          placeholder="Détails supplémentaires..." 
          className="col-span-3 min-h-[80px] bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 placeholder:text-zinc-600" 
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[13px] mt-2 font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
        <Button 
          type="button" 
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending}
          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold border-0"
        >
          Annuler l'événement
        </Button>
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => { if(onSuccess) onSuccess() }}
            disabled={isPending}
            className="border-slate-200 bg-transparent text-slate-600 hover:bg-white hover:text-slate-900 shadow-sm"
          >
            Fermer
          </Button>
          <Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20">
            {isPending ? "Modification..." : "Modifier l'événement"}
          </Button>
        </div>
      </div>
    </form>
  );
}
