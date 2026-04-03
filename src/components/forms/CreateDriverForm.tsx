"use client";

import { useTransition, useState } from "react";
import { createDriver } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateDriverFormProps {
  onSuccess?: () => void;
}

export function CreateDriverForm({ onSuccess }: CreateDriverFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (isPending) return;

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await createDriver(formData);
        if (result.success) {
          if (onSuccess) onSuccess();
        } else {
          setError((result as any).error || "Erreur lors de la création.");
        }
      } catch (err: any) {
        setError(err.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="pt-2 pb-4">
      <div className="flex flex-col lg:flex-row items-end gap-3">
        <div className="flex-1 space-y-1.5 w-full">
          <Label htmlFor="firstName" className="text-sm font-semibold text-zinc-700">Prénom</Label>
          <Input 
            id="firstName" 
            name="firstName" 
            type="text" 
            required 
            className="w-full h-10" 
            placeholder="Jean" 
          />
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <Label htmlFor="lastName" className="text-sm font-semibold text-zinc-700">Nom</Label>
          <Input 
            id="lastName" 
            name="lastName" 
            type="text" 
            required 
            className="w-full h-10" 
            placeholder="Dupont" 
          />
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <Label htmlFor="email" className="text-sm font-semibold text-zinc-700">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="off"
            required 
            className="w-full h-10" 
            placeholder="jean.dupont@email.com" 
          />
        </div>

        <div className="flex-1 space-y-1.5 w-full">
          <Label htmlFor="phone" className="text-sm font-semibold text-zinc-700">Téléphone</Label>
          <Input 
            id="phone" 
            name="phone" 
            type="tel" 
            className="w-full h-10" 
            placeholder="06 12 34 56 78" 
          />
        </div>
        
        <div className="flex-1 space-y-1.5 w-full">
          <Label htmlFor="password" className="text-sm font-semibold text-zinc-700">Mot de passe</Label>
          <Input 
            id="password" 
            name="password" 
            type="text" 
            autoComplete="off"
            required 
            className="w-full h-10" 
            placeholder="Mot de passe" 
          />
        </div>

        <div className="w-full md:w-auto pt-4 md:pt-0">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full md:w-auto h-10 bg-blue-600 text-slate-900 hover:bg-blue-700 font-medium px-6 shadow-sm"
          >
            {isPending ? "Création..." : "Ajouter"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm mt-4">
          {error}
        </div>
      )}
    </form>
  );
}
