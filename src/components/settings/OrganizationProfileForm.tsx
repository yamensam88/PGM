"use client";

import { useTransition, useState } from "react";
import { updateOrganizationProfile } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function OrganizationProfileForm({ name, taxId, address }: { name: string; taxId?: string | null; address?: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await updateOrganizationProfile(fd);
        if (res?.success) { setSaved(true); toast.success("Profil de l'entreprise enregistré."); }
        else { toast.error(res?.error || "Erreur lors de l'enregistrement."); }
      } catch (err: any) {
        toast.error(err?.message || "Erreur inattendue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
          <Input id="companyName" name="companyName" defaultValue={name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siret">Numéro de SIRET</Label>
          <Input id="siret" name="siret" defaultValue={taxId || ""} placeholder="ex : 80012345600010" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Adresse du Siège</Label>
        <Input id="address" name="address" defaultValue={address || ""} placeholder="ex : 14 Avenue de l'Opéra, 75001 Paris" />
      </div>
      <Button type="submit" disabled={isPending} className="bg-indigo-600 text-white hover:bg-indigo-700 w-fit mt-4">
        {isPending ? "Enregistrement…" : saved ? "Enregistré ✓" : "Sauvegarder les modifications"}
      </Button>
    </form>
  );
}
