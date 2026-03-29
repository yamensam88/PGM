"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClient, toggleClientStatus } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ClientActions({ clientId, clientName, currentStatus }: { clientId: string, clientName: string, currentStatus: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isSuspended = currentStatus === "suspended";

  const handleToggleStatus = () => {
    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('status', isSuspended ? 'active' : 'suspended');
    
    startTransition(async () => {
      setError(null);
      const result = await toggleClientStatus(formData);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Erreur lors de la modification du statut.");
      }
    });
  };

  const handleDelete = () => {
    const formData = new FormData();
    formData.append('client_id', clientId);
    
    startTransition(async () => {
      setError(null);
      const result = await deleteClient(formData);
      if (result.success) {
        router.refresh();
        setIsDeleteDialogOpen(false);
      } else {
        setError(result.error || "Impossible de supprimer ce client.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bouton Suspendre / Réactiver */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleToggleStatus} 
        disabled={isPending}
        className={`h-8 px-2 text-xs font-medium ${isSuspended ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
      >
        {isSuspended ? (
          <><PlayCircle className="w-3.5 h-3.5 mr-1" /> Réactiver</>
        ) : (
          <><PauseCircle className="w-3.5 h-3.5 mr-1" /> Suspendre</>
        )}
      </Button>

      {/* Bouton de Suppression avec Confirmation */}
      <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setIsDeleteDialogOpen(true)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement ce client ?</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de supprimer le client <strong>{clientName}</strong> ainsi que toutes ses grilles tarifaires.
              <br/><br/>
              Cette action est irréversible. Si des tournées ont déjà été créées pour ce client, la suppression sera refusée. Dans ce cas, privilégiez le bouton <strong>Suspendre</strong>.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={isPending}>
              {isPending ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
