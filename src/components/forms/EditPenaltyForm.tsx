"use client";

import { useTransition, useState } from "react";
import { updateDriverPenalty, deleteDriverPenalty } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditPenaltyFormProps {
  event: any;
  drivers: { id: string; first_name: string; last_name: string }[];
  onSuccess?: () => void;
}

export function EditPenaltyForm({ event, drivers, onSuccess }: EditPenaltyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateDriverPenalty(formData);
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
    if (!confirm("Voulez-vous vraiment annuler cette pénalité de manière définitive ?")) return;
    
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteDriverPenalty(event.id);
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
  
  // Extract amount and description from notes: "Pénalité financière de 50€: Motif..."
  let amount = 0;
  let description = event.notes || "";
  const match = event.notes?.match(/de (\d+(?:\.\d+)?)€:/);
  if (match && match[1]) {
    amount = Number(match[1]);
    const parts = event.notes?.split(': ');
    if (parts.length > 1) {
      parts.shift(); // remove the "Pénalité financière de X€" part
      description = parts.join(': ');
    } else {
      description = "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 py-4">
      <input type="hidden" name="event_id" value={event.id} />
      <input type="hidden" name="driver_id" value={event.driver_id} />
      
      {/* We pass the old date to easily find the associated FinancialEntry during update */}
      <input type="hidden" name="old_date" value={startDateISO} />
      
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
        <Label htmlFor="amount" className="text-right font-medium text-slate-600 text-[13px]">Montant <span className="text-red-500">*</span></Label>
        <div className="col-span-3 relative">
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required defaultValue={amount} className="pl-8 bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600" />
          <span className="absolute left-3 top-2.5 text-slate-500 text-sm">€</span>
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right font-medium text-slate-600 text-[13px]">Date <span className="text-red-500">*</span></Label>
        <Input id="date" name="date" type="date" required defaultValue={startDateISO} className="col-span-3 bg-white border-slate-200 text-slate-700 focus-visible:ring-zinc-600 [color-scheme:dark]" />
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="description" className="text-right font-medium mt-2 text-slate-600 text-[13px]">Motif</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={description}
          placeholder="Raison de la pénalité facturée à l'entreprise..." 
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
          <Button type="submit" disabled={isPending} className="bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20">
            {isPending ? "Modification..." : "Modifier la pénalité"}
          </Button>
        </div>
      </div>
    </form>
  );
}
