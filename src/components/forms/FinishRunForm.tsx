/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { finishRun } from "@/lib/actions";

interface FinishRunFormProps {
  runId: string;
  initialKmStart: number | null;
}

export function FinishRunForm({ runId, initialKmStart }: FinishRunFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
       try {
         const result = await finishRun(formData);
         if (result.success) {
           router.push('/dispatch/dashboard');
           router.refresh();
         } else {
           setError(result.error || "Une erreur est survenue lors de la clôture.");
         }
       } catch (err: any) {
         setError(err.message || "Une erreur inattendue est survenue.");
       }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Clôturer la Tournée
      </h2>
      
      {/* Metrics Section */}
      <div className="grid grid-cols-2 gap-4 bg-zinc-50/5 p-4 rounded-xl border border-zinc-200/10 shadow-sm backdrop-blur-sm">
        <div className="space-y-2">
          <Label htmlFor="km_start">Kilométrage (Départ)</Label>
          <Input 
            id="km_start" 
            name="km_start" 
            type="number" 
            step="0.1" 
            required 
            defaultValue={initialKmStart ?? ""}
            placeholder="ex: 125000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="km_end">Kilométrage (Fin)</Label>
          <Input 
            id="km_end" 
            name="km_end" 
            type="number" 
            step="0.1" 
            required 
            placeholder="ex: 125430"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stops_done">Stops Réalisés</Label>
          <Input id="stops_done" name="stops_done" type="number" min="0" required defaultValue="0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="failed_stops">Stops Échoués</Label>
          <Input id="failed_stops" name="failed_stops" type="number" min="0" required defaultValue="0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="advised_parcels_direct">Colis Directs Avisés</Label>
          <Input id="advised_parcels_direct" name="advised_parcels_direct" type="number" min="0" required defaultValue="0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="advised_parcels_relay">Colis Relais Avisés</Label>
          <Input id="advised_parcels_relay" name="advised_parcels_relay" type="number" min="0" required defaultValue="0" />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="packages_returned">Colis Retournés (Dépôt)</Label>
          <Input id="packages_returned" name="packages_returned" type="number" min="0" required defaultValue="0" />
        </div>
      </div>

      {/* Fuel Section (Financial Entries) */}
      <div className="space-y-4 bg-white border-l-4 border-blue-500 p-5 rounded-r-xl shadow-sm text-slate-800">
        <h3 className="font-semibold text-lg">Point Carburant (Optionnel)</h3>
        <p className="text-xs text-slate-500 mb-2">Les informations saisies ici impacteront directement la rentabilité journalière affichée pour la Direction.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fuel_liters" className="text-slate-600">Litres ajoutés</Label>
            <Input id="fuel_liters" name="fuel_liters" type="number" step="0.01" placeholder="ex: 25.5" className="bg-white border-slate-300 text-slate-900" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuel_price" className="text-slate-600">Prix au litre à la pompe (€)</Label>
            <Input id="fuel_price" name="fuel_price" type="number" step="0.001" placeholder="ex: 1.850" className="bg-white border-slate-300 text-slate-900" />
          </div>
        </div>
        <div className="space-y-2 pt-3">
          <Label htmlFor="fuel_receipt" className="text-slate-600">Ticket / Reçu Gasoil (Photo)</Label>
          <Input 
             id="fuel_receipt" 
             name="fuel_receipt" 
             type="file" 
             accept="image/*,.pdf" 
             className="text-slate-500 bg-white border-slate-300 file:bg-blue-600 file:text-slate-900 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 hover:file:bg-blue-700 cursor-pointer" 
          />
        </div>
      </div>

      {/* Media & Notes Section */}
      <div className="space-y-4">
         <div className="space-y-2">
          <Label htmlFor="return_notes">Remarques (état du véhicule, pannes, casses...)</Label>
          <Textarea id="return_notes" name="return_notes" placeholder="Observations, entretiens à prévoir, incidents..." />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="proof_of_return_photo_url">Photo Fiche Retour (URL locale provisoire)</Label>
          <Input id="proof_of_return_photo_url" name="proof_of_return_photo_url" type="text" placeholder="/placeholder-return.jpg" />
        </div>
      </div>

      <input type="hidden" name="runId" value={runId} />

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-slate-900" disabled={isPending}>
        {isPending ? "Validation en cours..." : "Terminer et Valider"}
      </Button>
    </form>
  );
}
