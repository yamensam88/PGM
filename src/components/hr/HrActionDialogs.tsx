"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateAbsenceForm } from "@/components/forms/CreateAbsenceForm";
import { CreatePenaltyForm } from "@/components/forms/CreatePenaltyForm";
import { toast } from "sonner";

export function CreateAbsenceDialog({ drivers }: { drivers: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 text-slate-900 hover:bg-blue-700 shadow-sm">
          Déclarer Absence / Maladie / Congés
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
        <DialogHeader>
          <DialogTitle className="text-blue-500">Nouvelle Déclaration RH</DialogTitle>
          <DialogDescription className="text-slate-500">
            Enregistrez une absence, un arrêt maladie ou la pose d'un congé payé pour un chauffeur.
          </DialogDescription>
        </DialogHeader>
        <div>
          <CreateAbsenceForm drivers={drivers} onSuccess={() => { setOpen(false); toast.success("Événement RH enregistré avec succès."); }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreatePenaltyDialog({ drivers }: { drivers: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-red-900/50 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-400">
          Pénalité Client / Exploitation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
        <DialogHeader>
          <DialogTitle className="text-red-500">Pénalité Client / Exploitation</DialogTitle>
          <DialogDescription className="text-slate-500">
            Enregistrez une pénalité financière facturée à l'entreprise (ex: Amazon) due à une erreur ou une non-livraison du chauffeur.
          </DialogDescription>
        </DialogHeader>
        <div>
          <CreatePenaltyForm drivers={drivers} onSuccess={() => { setOpen(false); toast.success("Pénalité enregistrée avec succès."); }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
