"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createZone } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateZoneForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
         const result = await createZone(formData);
         if (result.success) {
           router.refresh();
           if (onSuccess) onSuccess();
           document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
         } else {
           setError((result as any).error || "Erreur lors de la création.");
         }
      } catch (err: any) {
         setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la Zone</Label>
        <Input id="name" name="name" required placeholder="Ex: Paris Nord" className="h-10" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="code">Code Zone (Optionnel)</Label>
        <Input id="code" name="code" placeholder="Ex: 75N" className="h-10" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="zone_type">Type de Zone</Label>
        <select id="zone_type" name="zone_type" className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-200 dark:bg-[#f8f9fc] dark:text-zinc-50 dark:focus:ring-zinc-300">
           <option value="urban">Urbaine</option>
           <option value="suburban">Périurbaine</option>
           <option value="rural">Rurale</option>
           <option value="mixed">Mixte</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
         <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-slate-900 w-full md:w-auto" disabled={isPending}>
           {isPending ? "Création..." : "Ajouter la zone"}
         </Button>
      </div>
    </form>
  );
}
