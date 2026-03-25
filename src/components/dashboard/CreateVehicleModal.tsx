"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateVehicleForm } from "@/components/forms/CreateVehicleForm";

export function CreateVehicleModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="bg-blue-600 inline-flex items-center justify-center whitespace-nowrap rounded-md h-10 px-4 py-2 text-slate-50 hover:bg-blue-700 font-medium shadow-sm transition-colors">
        + Nouveau Véhicule
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un véhicule</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau véhicule à votre flotte pour vos opérations quotidiennes.
          </DialogDescription>
        </DialogHeader>
        <CreateVehicleForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
