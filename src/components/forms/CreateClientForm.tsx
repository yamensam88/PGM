"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateClientForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const result = await createClient(formData);
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
        <Label htmlFor="name">Nom du Client</Label>
        <Input id="name" name="name" required placeholder="Ex: Auchan Logistique" className="h-10" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="client_code">Code Client (Optionnel)</Label>
        <Input id="client_code" name="client_code" placeholder="Ex: AUC-123" className="h-10" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing_contact_email">Email de Facturation (Optionnel)</Label>
        <Input id="billing_contact_email" name="billing_contact_email" type="email" placeholder="contact@auchan.fr" className="h-10" />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
         <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-slate-900 w-full md:w-auto" disabled={isPending}>
           {isPending ? "Création..." : "Ajouter le client"}
         </Button>
      </div>
    </form>
  );
}
