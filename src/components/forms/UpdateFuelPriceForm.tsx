"use client";

import { useTransition, useState } from "react";
import { updateFuelPrice } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplet } from "lucide-react";

export function UpdateFuelPriceForm({ currentPrice }: { currentPrice: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateFuelPrice(formData);
        if (!result.success) {
          setError((result as any).error || "Erreur.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border border-zinc-200 dark:border-slate-200 rounded-lg space-y-3 bg-white dark:bg-white mt-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="fuel_price" className="text-sm font-medium flex items-center gap-1.5 text-zinc-700 dark:text-slate-600">
           <Droplet className="w-4 h-4 text-slate-500" /> Prix au Litre (€)
        </Label>
        <span className="text-xs text-slate-500">Calcul auto des frais gasoil</span>
      </div>
      <div className="flex gap-2">
        <Input 
          id="fuel_price" 
          name="fuel_price" 
          type="number" 
          step="0.001" 
          defaultValue={currentPrice} 
          required 
          className="bg-zinc-50 dark:bg-[#f8f9fc]"
        />
        <Button type="submit" disabled={isPending} className="bg-white text-slate-900 hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900">
          {isPending ? "..." : "Maj"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
