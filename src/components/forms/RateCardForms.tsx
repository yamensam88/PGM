"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createRateCard, deleteRateCard, updateRateCard } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateRateCardForm({ clientId, clientName, onSuccess }: { clientId: string, clientName: string, onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('client_id', clientId);
    
    startTransition(async () => {
      try {
        const result = await createRateCard(formData);
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
        <Label htmlFor="name">Nom de la Grille ({clientName})</Label>
        <Input id="name" name="name" required placeholder="Ex: Tarif Weekend 2026" className="h-10" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Prix par colis (€)</Label>
            <Input name="unit_price_package" type="number" step="0.01" defaultValue={0} />
        </div>
        <div className="space-y-2">
            <Label>Colis relais (€)</Label>
            <Input name="bonus_relay_point" type="number" step="0.01" defaultValue={0} />
        </div>
        <div className="space-y-2">
            <Label>Collecte (€)</Label>
            <Input name="unit_price_stop" type="number" step="0.01" defaultValue={0} />
        </div>
        <div className="space-y-2">
            <Label>Forfait Fixe (€)</Label>
            <Input name="base_daily_flat" type="number" step="0.01" defaultValue={0} />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
         <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto" disabled={isPending}>
           {isPending ? "Création..." : "Ajouter la grille"}
         </Button>
      </div>
    </form>
  );
}

export function DeleteRateCardForm({ rateCardId, onSuccess }: { rateCardId: string, onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.append('id', rateCardId);
    
    startTransition(async () => {
      await deleteRateCard(formData);
      router.refresh();
      if (onSuccess) onSuccess();
    });
  };

  return (
      <Button variant="ghost" size="sm" onClick={handleDelete} className="text-xs h-6 text-red-500 hover:text-red-700 hover:bg-red-50 px-2 mt-2 w-full justify-start" disabled={isPending}>
        {isPending ? "..." : "Supprimer cette grille"}
      </Button>
  );
}

export function EditRateCardForm({ rateCard, onSuccess }: { rateCard: any, onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.append('id', rateCard.id);
    
    startTransition(async () => {
      try {
        const result = await updateRateCard(formData);
        if (result.success) {
          router.refresh();
          if (onSuccess) onSuccess();
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        } else {
          setError((result as any).error || "Erreur lors de la modification.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la Grille</Label>
        <Input id="name" name="name" required defaultValue={rateCard.name} className="h-10" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label>Prix par colis (€)</Label>
            <Input name="unit_price_package" type="number" step="0.01" defaultValue={Number(rateCard.unit_price_package || 0)} />
        </div>
        <div className="space-y-2">
            <Label>Colis relais (€)</Label>
            <Input name="bonus_relay_point" type="number" step="0.01" defaultValue={Number(rateCard.bonus_relay_point || 0)} />
        </div>
        <div className="space-y-2">
            <Label>Collecte (€)</Label>
            <Input name="unit_price_stop" type="number" step="0.01" defaultValue={Number(rateCard.unit_price_stop || 0)} />
        </div>
        <div className="space-y-2">
            <Label>Forfait Fixe (€)</Label>
            <Input name="base_daily_flat" type="number" step="0.01" defaultValue={Number(rateCard.base_daily_flat || 0)} />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
         <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto" disabled={isPending}>
           {isPending ? "Enregistrement..." : "Modifier la grille"}
         </Button>
      </div>
    </form>
  );
}
