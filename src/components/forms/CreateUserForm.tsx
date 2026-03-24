"use client";

import { useState } from "react";
import { Copy, PlusCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAdminUser } from "@/lib/actions";
import { toast } from "sonner";

export function CreateUserForm() {
  const [isPending, setIsPending] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string, password: string } | null>(null);

  async function action(formData: FormData) {
    setIsPending(true);
    setSuccessData(null);
    try {
      const result = await createAdminUser(formData);
      if (result.success && result.email && result.password) {
        setSuccessData({ email: result.email, password: result.password });
        toast.success("Utilisateur créé avec succès !");
      } else {
        toast.error(result.error || "Une erreur est survenue.");
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur serveur.");
    } finally {
      setIsPending(false);
    }
  }

  const copyCredentials = () => {
    if (successData) {
      navigator.clipboard.writeText(`Identifiant : ${successData.email}\nMot de passe : ${successData.password}`);
      toast.info("Identifiants copiés dans le presse-papiers.");
    }
  };

  if (successData) {
    return (
      <div className="space-y-6 flex flex-col items-center justify-center p-6 bg-white dark:bg-white rounded-xl">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-slate-900">Compte Utilisateur Créé !</h3>
          <p className="text-slate-500 text-sm max-w-sm">Le compte a été généré avec succès. Veuillez communiquer ces identifiants à l'utilisateur concerné.</p>
        </div>
        
        <div className="w-full bg-zinc-50 dark:bg-white p-4 rounded-xl space-y-3 border border-zinc-200 dark:border-slate-300 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-slate-500 hover:text-blue-600"
            onClick={copyCredentials}
            title="Copier les identifiants"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <div className="pr-8">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Identifiant de connexion</p>
            <p className="font-mono text-zinc-900 dark:text-slate-700 bg-white dark:bg-white px-3 py-2 rounded border border-zinc-200 dark:border-slate-300">{successData.email}</p>
          </div>
          <div>
             <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Mot de passe provisoire</p>
             <p className="font-mono text-zinc-900 dark:text-slate-700 bg-white dark:bg-white px-3 py-2 rounded border border-zinc-200 dark:border-slate-300 select-all">{successData.password}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setSuccessData(null)}
        >
          Créer un autre utilisateur
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom <span className="text-red-500">*</span></Label>
          <Input id="firstName" name="firstName" placeholder="Jean" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom <span className="text-red-500">*</span></Label>
          <Input id="lastName" name="lastName" placeholder="Dupont" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Poste / Niveau d'Accès <span className="text-red-500">*</span></Label>
        <Select name="role" required defaultValue="dispatcher">
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Direction (Accès total)</SelectItem>
            <SelectItem value="dispatcher">Exploitation (Tournées, Flotte)</SelectItem>
            <SelectItem value="hr">Ressources Humaines (Salariés, Absences)</SelectItem>
            <SelectItem value="finance">Finance (Facturation, Statistiques)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
        <p className="text-sm text-blue-800 dark:text-blue-300">
           <strong>Note :</strong> L'identifiant (@delivertech.fr) et le mot de passe sécurisé seront générés automatiquement et affichés à l'étape suivante.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-slate-900">
        {isPending ? "Création en cours..." : "Créer l'utilisateur"}
      </Button>
    </form>
  );
}
