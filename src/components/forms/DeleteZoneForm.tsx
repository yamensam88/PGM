"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteZone } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type BaseDoc = { id: string; name: string; [key: string]: any };

export function DeleteZoneForm({ zones, onSuccess }: { zones: BaseDoc[], onSuccess?: () => void }) {
  const router = useRouter();
  const [isPendingZone, startTransitionZone] = useTransition();
  const [errorZone, setErrorZone] = useState<string | null>(null);

  const handleZoneSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorZone(null);
    const formData = new FormData(e.currentTarget);
    
    startTransitionZone(async () => {
      try {
        const result = await deleteZone(formData);
        if (result.success) {
          router.refresh();
          if (onSuccess) onSuccess();
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        } else {
          setErrorZone((result as any).error || "Erreur lors de la suppression.");
        }
      } catch (err: any) {
        setErrorZone(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <div className="space-y-6 pt-4">
      <form onSubmit={handleZoneSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="zone_id" className="font-bold text-zinc-900">Sélectionnez la Zone</Label>
          <select id="zone_id" name="zone_id" required className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-zinc-50 dark:focus:ring-red-500">
             <option value="">Sélectionner une zone</option>
             {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <p className="text-xs text-slate-500 mt-2">Impossible de supprimer une zone liée à des tournées.</p>
        </div>

        {errorZone && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-sm text-red-700 dark:text-red-400">
            {errorZone}
          </div>
        )}

        <div className="flex justify-end pt-2">
           <Button type="submit" variant="destructive" className="w-full md:w-auto" disabled={isPendingZone}>
             {isPendingZone ? "Suppression..." : "Supprimer la zone"}
           </Button>
        </div>
      </form>
    </div>
  );
}
