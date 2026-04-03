"use client";

import { useTransition, useState } from "react";
import { updateDriverGlobalCost } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditGlobalCostForm({ driverId, initialCost }: { driverId: string, initialCost: string | number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Parse the initial cost efficiently for display
  const displayValue = typeof initialCost === 'number' ? initialCost.toFixed(2) : initialCost;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    formData.append("driverId", driverId);

    startTransition(async () => {
      try {
        const result = await updateDriverGlobalCost(formData);
        if (result.success) {
          setSuccess(true);
          // Fermer la modale Shadcn automatiquement
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setError((result as any).error || "Erreur de mise à jour.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="globalCost" className="text-[13px] font-medium text-slate-600">Nouveau Coût Global / Mois (€)</Label>
        <p className="text-[11px] text-slate-500 mb-2">Le coût journalier du chauffeur sera recalculé automatiquement (sur une base de 25.33 jours travaillés / mois).</p>
        <Input 
           id="globalCost" 
           name="globalCost" 
           type="number" 
           step="0.01" 
           defaultValue={displayValue}
           placeholder="ex: 3500.00" 
           required
           className="w-full bg-[#f8f9fc] border-slate-200 text-slate-900 focus-visible:ring-emerald-500" 
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-[13px]">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[13px]">
          Mise à jour réussie.
        </div>
      )}

      <Button disabled={isPending} type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
