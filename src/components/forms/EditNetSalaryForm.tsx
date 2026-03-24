"use client";

import { useTransition, useState } from "react";
import { updateDriverNetSalary } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditNetSalaryForm({ driverId, initialNetSalary }: { driverId: string, initialNetSalary: string | number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    formData.append("driverId", driverId);

    startTransition(async () => {
      try {
        const result = await updateDriverNetSalary(formData);
        if (result.success) {
          setSuccess(true);
          // Fermer la modale Shadcn automatiquement (Radix UI écoute l'Event Escape)
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
        <Label htmlFor="netSalary" className="text-[13px] font-medium text-slate-600">Salaire Net Contractuel (€)</Label>
        <Input 
           id="netSalary" 
           name="netSalary" 
           type="number" 
           step="0.01" 
           defaultValue={initialNetSalary || ""}
           placeholder="Laissez vide pour l'estimation automatique (75%)" 
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

      <Button disabled={isPending} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
