"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { updateRun } from "@/lib/actions";

export function UpdateRunForm({ initialData, onSuccess }: { initialData: any; onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Saisies qui déterminent le calcul de référence des colis livrés.
  const [loaded, setLoaded] = useState<string>(String(initialData.packages_loaded ?? 0));
  const [advisedDirect, setAdvisedDirect] = useState<string>(String(initialData.packages_advised_direct ?? 0));
  const [returned, setReturned] = useState<string>(String(initialData.packages_returned ?? 0));
  // Colis livrés saisis par l'exploitant (comptage terrain), à réconcilier avec le calcul.
  const [deliveredInput, setDeliveredInput] = useState<string>(String(initialData.packages_delivered ?? 0));

  const calculated = Math.max(0, (Number(loaded) || 0) - (Number(advisedDirect) || 0) - (Number(returned) || 0));
  const deliveredNum = Number(deliveredInput) || 0;
  const mismatch = deliveredNum !== calculated;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;
    if (mismatch) {
      setError(`Écart sur les colis livrés : vous avez saisi ${deliveredNum}, mais le calcul (Chargés − Avisés direct − Retournés) donne ${calculated}. Corrigez les chiffres avant d'enregistrer.`);
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.append("runId", initialData.id);
    startTransition(async () => {
       try {
         const result = await updateRun(formData);
         if (result.success) {
           router.refresh();
           if (onSuccess) onSuccess();
         } else {
           setError(result.error || "Une erreur est survenue lors de la mise à jour.");
         }
       } catch (err: any) {
         setError(err.message || "Une erreur inattendue est survenue.");
       }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 md:col-span-1">
          <Label htmlFor="status">Statut de la tournée</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialData.status}
            className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
          >
            <option value="planned">Planifiée</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="failed">Échec</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-zinc-50/5 p-4 rounded-xl border border-zinc-200/10 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="packages_loaded">Colis Chargés (Total)</Label>
          <Input id="packages_loaded" name="packages_loaded" type="number" min="0" value={loaded} onChange={(e) => setLoaded(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_advised_direct">Avisés Direct</Label>
          <Input id="packages_advised_direct" name="packages_advised_direct" type="number" min="0" value={advisedDirect} onChange={(e) => setAdvisedDirect(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_returned">Colis Retournés</Label>
          <Input id="packages_returned" name="packages_returned" type="number" min="0" value={returned} onChange={(e) => setReturned(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_delivered">Colis Livrés (saisi)</Label>
          <Input id="packages_delivered" name="packages_delivered" type="number" min="0" value={deliveredInput} onChange={(e) => setDeliveredInput(e.target.value)} className={mismatch ? "border-red-500 ring-1 ring-red-400 text-red-700 font-semibold" : ""} />
          <p className={`text-[11px] ${mismatch ? "text-red-600 font-semibold" : "text-slate-400"}`}>
            {mismatch
              ? `⚠ Écart : le calcul (Chargés − Avisés − Retournés) donne ${calculated}. Corrigez avant d'enregistrer.`
              : `OK · = Chargés − Avisés direct − Retournés (${calculated}). Facturé 1,50 €/colis.`}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_relay">Colis Relais</Label>
          <Input id="packages_relay" name="packages_relay" type="number" min="0" defaultValue={initialData.packages_relay || 0} />
          <p className="text-[11px] text-slate-400">Facturés au tarif relais (0,30 €/colis).</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="packages_advised_relay">Avisés Relais</Label>
          <Input id="packages_advised_relay" name="packages_advised_relay" type="number" min="0" defaultValue={initialData.packages_advised_relay || 0} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="colis_collected">Colis Collectés</Label>
          <Input id="colis_collected" name="colis_collected" type="number" min="0" defaultValue={initialData.stops_completed || 0} />
          <p className="text-[11px] text-slate-400">Colis ramassés, facturés au tarif collecte (0,30 €/colis).</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="km_start">Km Départ</Label>
          <Input id="km_start" name="km_start" type="number" step="0.1" defaultValue={initialData.km_start ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="km_end">Km Arrivée</Label>
          <Input id="km_end" name="km_end" type="number" step="0.1" defaultValue={initialData.km_end ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fuel_liters">Gasoil ajouté (Litres)</Label>
          <Input id="fuel_liters" name="fuel_liters" type="number" step="0.01" defaultValue={initialData.fuel_consumed_liters ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuel_price">Prix Unit. (€/L)</Label>
          <Input id="fuel_price" name="fuel_price" type="number" step="0.001" placeholder="Ex: 1.85 (Optionnel)" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="fuel_receipt" className="text-slate-600">Justificatif Carburant (Optionnel)</Label>
          <Input id="fuel_receipt" name="fuel_receipt" type="file" accept="image/*,.pdf" className="text-slate-500 bg-white border-slate-300 file:bg-indigo-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 hover:file:bg-indigo-700 cursor-pointer" />
        </div>
      </div>

      {mismatch && (
        <div className="p-3 bg-red-50 text-sm text-red-700 border-l-4 border-red-500 rounded-r">
          <strong>Écart à corriger.</strong> Colis livrés saisis : <strong>{deliveredNum}</strong> · Calcul (Chargés − Avisés − Retournés) : <strong>{calculated}</strong>. Ajustez les colis livrés, ou les chargés / avisés / retournés, pour que les deux coïncident.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-sm text-red-600 border-l-4 border-red-500">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="button" variant="outline" className="mr-4 text-slate-700" onClick={onSuccess}>
          Annuler
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending || mismatch}>
          {isPending ? "Mise à jour..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
