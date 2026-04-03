"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reportIncident } from "@/lib/actions";

interface IncidentFormProps {
  runId: string;
}

export function IncidentForm({ runId }: IncidentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    const formData = new FormData(e.currentTarget);
    formData.append("runId", runId);

    // Mock GPS Fetching for the prototype if valid
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        formData.append("gps_lat", position.coords.latitude.toString());
        formData.append("gps_lng", position.coords.longitude.toString());
      });
    }

    startTransition(async () => {
      try {
        const result = await reportIncident(formData);
        if (result.success) {
           router.push(`/driver/runs/${runId}/finish`);
        } else {
           setError("Erreur de transmission.");
        }
      } catch(err: any) {
          setError(err.message || "Erreur interne.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
        Signaler un Incident
      </h2>

      <div className="space-y-4 bg-zinc-50/5 p-4 rounded-xl border border-red-500/20 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="type">Type d'Incident</Label>
          <select 
            id="type" 
            name="type" 
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Sélectionner...</option>
            <option value="failure">Échec Livraison Client</option>
            <option value="delay">Retard Important (&gt; 1h)</option>
            <option value="accident">Accident Véhicule</option>
            <option value="dispute">Litige Client</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Sévérité (Optionnelle)</Label>
          <select 
            id="severity" 
            name="severity" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="low">Mineure (Low)</option>
            <option value="medium">Modérée (Medium)</option>
            <option value="high">Critique (High)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description détaillée</Label>
          <Textarea id="description" name="description" required placeholder="Que s'est-il passé ?" rows={4} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proof_url">Photo / Preuve associée (URL V1)</Label>
          <Input id="proof_url" name="proof_url" type="text" placeholder="/placeholder-incident.jpg" />
        </div>
      </div>

      <Button type="submit" variant="destructive" className="w-full" disabled={isPending}>
        {isPending ? "Transmission..." : "Transmettre l'Alerte"}
      </Button>
    </form>
  );
}
