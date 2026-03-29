"use client";

import { useTransition } from "react";
import { updateGlobalSettings } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SettingsForms({ initialSettings }: { initialSettings: any }) {
  const [isPendingCost, startTransitionCost] = useTransition();

  const handleCostSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransitionCost(async () => {
      await updateGlobalSettings(formData);
      alert("Coûts fixes mis à jour avec succès");
    });
  };

  return (
    <div className="w-full">
      <Card className="border-zinc-200 shadow-sm dark:border-slate-200 dark:bg-white/50">
        <form onSubmit={handleCostSubmit}>
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Coûts d'Exploitation Globaux</CardTitle>
            <CardDescription>Détail des charges mensuelles (hors véhicules roulants) pour le calcul de la marge nette.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Loyer des locaux / Entrepôt (€/mois)</Label>
                    <Input name="cost_rent" type="number" step="0.01" defaultValue={initialSettings?.cost_rent || 4500.00} />
                </div>
                <div className="space-y-2">
                    <Label>Salaires du personnel bureau & Direction (€/mois)</Label>
                    <Input name="cost_office_salaries" type="number" step="0.01" defaultValue={initialSettings?.cost_office_salaries || 8000.00} />
                </div>
                <div className="space-y-2">
                    <Label>Location véhicules administratifs (€/mois)</Label>
                    <Input name="cost_admin_vehicles" type="number" step="0.01" defaultValue={initialSettings?.cost_admin_vehicles || 850.00} />
                </div>
                <div className="space-y-2">
                    <Label>Abonnements (Logiciels, Télécoms, etc.) (€/mois)</Label>
                    <Input name="cost_software" type="number" step="0.01" defaultValue={initialSettings?.cost_software || 350.00} />
                </div>
                <div className="space-y-2">
                    <Label>Assurances RC Pro & Locaux (€/mois)</Label>
                    <Input name="cost_insurances" type="number" step="0.01" defaultValue={initialSettings?.cost_insurances || 200.00} />
                </div>
                <div className="space-y-2">
                    <Label>Honoraires (Comptable, Juridique) (€/mois)</Label>
                    <Input name="cost_fees" type="number" step="0.01" defaultValue={initialSettings?.cost_fees || 400.00} />
                </div>
                <div className="space-y-2">
                    <Label>Autres frais fixes généraux (€/mois)</Label>
                    <Input name="cost_others" type="number" step="0.01" defaultValue={initialSettings?.cost_others || 500.00} />
                </div>
            </div>
            
            <div className="space-y-4 border-t border-zinc-200 dark:border-slate-200 mt-6 pt-6">
                <div className="space-y-2">
                    <Label>Coût estimé carburant/KM (€)</Label>
                    <Input name="fuel_price_per_km" type="number" step="0.01" defaultValue={initialSettings?.fuel_price_per_km || 0.18} />
                    <p className="text-xs text-slate-500">Ex: 0.18€ par km si la consommation est approximativement de 10L/100km pour un litre à ~1.80€.</p>
                </div>
                <div className="space-y-2">
                    <Label>Prix du gasoil à la pompe (€/L)</Label>
                    <Input name="fuel_price_per_liter" type="number" step="0.01" defaultValue={initialSettings?.fuel_price_per_liter || 1.80} />
                </div>
            </div>
            <Button disabled={isPendingCost} type="submit" variant="outline" className="w-full mt-4">{isPendingCost ? "Enregistrement..." : "Enregistrer les coûts fixes"}</Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
