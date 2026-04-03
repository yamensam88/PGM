"use client";

import { useTransition, useState } from "react";
import { updateDriverBonusAmount } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function EditBonusForm({ driverId, initialAmount }: { driverId: string, initialAmount: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    const formData = new FormData(e.currentTarget);
    formData.append("driverId", driverId);

    startTransition(async () => {
      try {
        const result = await updateDriverBonusAmount(formData);
        if (result.success) {
          toast.success("Droit à la prime mis à jour avec succès.");
        } else {
          setError(result.error || "Erreur lors de la mise à jour.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
         <Label htmlFor="amount" className="text-[13px] font-medium text-slate-600">Montant théorique de la prime (€) *</Label>
         <Input id="amount" name="amount" type="number" step="1" defaultValue={initialAmount} required className="w-full bg-white border-slate-200 text-slate-700 focus-visible:ring-blue-600" />
      </div>

      {error && <div className="text-red-500 text-[13px] font-medium bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}

      <div className="pt-2">
        <Button disabled={isPending} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
          {isPending ? "Mise à jour..." : "Enregistrer la prime par défaut"}
        </Button>
      </div>
    </form>
  );
}
