"use client";

import { useState } from "react";
import { Wrench, AlertTriangle, History } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateMaintenanceForm } from "@/components/forms/CreateMaintenanceForm";
import { CreateDamageForm } from "@/components/forms/CreateDamageForm";
import { VehicleHistory } from "@/components/dashboard/VehicleHistory";

import { EditVehicleForm } from "@/components/forms/EditVehicleForm";
import { archiveVehicle } from "@/lib/actions";

export function VehicleRowActions({ vehicle, drivers }: { vehicle: any, drivers: any }) {
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    await archiveVehicle(vehicle.id);
    setIsArchiving(false);
    setArchiveOpen(false);
  };


  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-slate-500 hover:text-zinc-800 dark:hover:text-slate-700" 
          onClick={() => setEditOpen(true)}
          title="Modifier les infos"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-slate-500 hover:text-zinc-800 dark:hover:text-slate-700" 
          onClick={() => setMaintenanceOpen(true)}
          title="Déclarer Entretien / RDV"
        >
          <Wrench className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" 
          onClick={() => setDamageOpen(true)}
          title="Déclarer Casse / Sinistre"
        >
          <AlertTriangle className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30" 
          onClick={() => setHistoryOpen(true)}
          title="Voir Historique & Coûts"
        >
          <History className="h-4 w-4" />
        </Button>
        {vehicle.status !== 'archived' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30" 
            onClick={() => setArchiveOpen(true)}
            title="Archiver"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-archive"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
          </Button>
        )}
      </div>

      <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Déclaration d'entretien</DialogTitle>
            <DialogDescription>
              Enregistrez une intervention technique pour <strong>{vehicle.plate_number}</strong>.
            </DialogDescription>
          </DialogHeader>
          <CreateMaintenanceForm 
            vehicleId={vehicle.id} 
            scheduledRdv={vehicle.next_appointment_date ? { 
              date: vehicle.next_appointment_date, 
              nature: vehicle.next_appointment_nature 
            } : undefined}
            onSuccess={() => setMaintenanceOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={damageOpen} onOpenChange={setDamageOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5"/> Signaler un sinistre
            </DialogTitle>
          </DialogHeader>
          <CreateDamageForm vehicleId={vehicle.id} drivers={drivers} onSuccess={() => setDamageOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Historique du véhicule {vehicle.plate_number}</DialogTitle>
            <DialogDescription>
              Registre complet des entretiens, RDV et sinistres.
            </DialogDescription>
          </DialogHeader>
          <VehicleHistory vehicle={vehicle} />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le véhicule</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de <strong>{vehicle.plate_number}</strong>.
            </DialogDescription>
          </DialogHeader>
          <EditVehicleForm vehicle={vehicle} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-orange-600 flex items-center gap-2">
              Confirmer l'archivage
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir archiver le véhicule <strong>{vehicle.plate_number}</strong> ? Il n'apparaîtra plus dans la flotte active.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setArchiveOpen(false)}>Annuler</Button>
            <Button variant="destructive" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleArchive} disabled={isArchiving}>
              {isArchiving ? "Archivage..." : "Archiver"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
