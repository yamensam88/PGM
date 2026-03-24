"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDriver } from "@/lib/actions";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DriversTable({ drivers }: { drivers: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteDriver(id);
      if (result.success) {
        toast.success(`Chauffeur ${name} supprimé avec succès.`);
      } else {
        toast.error(result.error || "Erreur lors de la suppression.");
      }
    });
  };

  if(!drivers || drivers.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Aucun chauffeur enregistré pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader className="bg-zinc-50 dark:bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-zinc-600">Nom & Prénom</TableHead>
            <TableHead className="font-semibold text-zinc-600">Email / Identifiant</TableHead>
            <TableHead className="font-semibold text-zinc-600">Téléphone</TableHead>
            <TableHead className="font-semibold text-zinc-600">Statut</TableHead>
            <TableHead className="text-right font-semibold text-orange-600">Entretien (€)</TableHead>
            <TableHead className="text-right font-semibold text-red-600">Sinistres (€)</TableHead>
            <TableHead className="text-right font-semibold text-zinc-600">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => {
            return (
              <TableRow key={driver.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/30 transition-colors">
                <TableCell className="font-medium">
                  {driver.first_name} {driver.last_name}
                </TableCell>
                <TableCell className="text-zinc-600">
                  {driver.email || '-'}
                </TableCell>
                <TableCell className="text-zinc-600">
                  {driver.phone || '-'}
                </TableCell>
                <TableCell>
                  {driver.status === 'active' ? (
                     <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Actif</Badge>
                  ) : (
                     <Badge variant="outline">{driver.status}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium text-orange-600">
                  {driver.financial_entries?.filter((e: any) => e.category === 'maintenance_cost').reduce((sum: number, entry: any) => sum + Number(entry.amount), 0).toFixed(2) || '0.00'}
                </TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  {driver.financial_entries?.filter((e: any) => e.category === 'damage_cost').reduce((sum: number, entry: any) => sum + Number(entry.amount), 0).toFixed(2) || '0.00'}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                         <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Elle supprimera définitivement le profil de {driver.first_name} {driver.last_name} et ses accès.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(driver.id, `${driver.first_name} ${driver.last_name}`)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isPending ? "Suppression..." : "Oui, supprimer"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                   </AlertDialog>
                </TableCell>
             </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
