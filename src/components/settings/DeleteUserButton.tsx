"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAdminUser } from "@/lib/actions";

export function DeleteUserButton({ userId, disabled }: { userId: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.")) return;

    startTransition(async () => {
      try {
        const result = await deleteAdminUser(userId);
        if (!result.success) {
           alert(result.error || "Erreur lors de la suppression.");
        }
      } catch (err: any) {
        alert(err.message || "Une erreur inattendue s'est produite.");
      }
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete} 
      disabled={disabled || isPending}
      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors h-8 w-8"
      title={disabled ? "Vous ne pouvez pas vous supprimer vous-même" : "Supprimer cet utilisateur"}
    >
       <Trash2 className="w-4 h-4" />
    </Button>
  );
}
