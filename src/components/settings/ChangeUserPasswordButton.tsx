"use client";

import { useState, useTransition } from "react";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminUserPassword } from "@/lib/actions";
import { toast } from "sonner";

export function ChangeUserPasswordButton({ userId, userName, disabled }: { userId: string, userName: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateAdminUserPassword(userId, newPassword);
        if (result.success) {
           toast.success("Nouveau mot de passe enregistré avec succès !");
           setOpen(false);
           setNewPassword("");
        } else {
           toast.error(result.error || "Erreur lors de la modification.");
        }
      } catch (err: any) {
        toast.error("Une erreur inattendue s'est produite.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-ignore */}
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={disabled || isPending}
          className="text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors h-8 w-8"
          title="Modifier le mot de passe"
        >
           <Key className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mise à jour du mot de passe</DialogTitle>
            <DialogDescription>
              Définir un nouveau mot de passe pour <strong>{userName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor={`pwd-${userId}`}>Nouveau mot de passe</Label>
              <Input 
                id={`pwd-${userId}`} 
                type="text" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Entrez le nouveau mot de passe"
                required
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Annuler</Button>
            <Button type="submit" disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-white">
              {isPending ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
