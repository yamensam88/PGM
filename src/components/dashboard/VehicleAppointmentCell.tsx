"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus } from "lucide-react";
import { SetAppointmentForm } from "@/components/forms/SetAppointmentForm";

export function VehicleAppointmentCell({ vehicle }: { vehicle: any }) {
  const [appointmentOpen, setAppointmentOpen] = useState(false);

  // Parse date securely
  let dateObj = null;
  if (vehicle.next_appointment_date) {
    try {
      dateObj = new Date(vehicle.next_appointment_date);
    } catch (e) {}
  }

  let colorClass = "text-zinc-700";
  let badge = null;

  if (dateObj) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeDiff = dateObj.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      colorClass = "text-red-600 font-bold";
      badge = <Badge variant="outline" className="mt-1 bg-red-50 text-red-600 border-red-200 text-[10px] px-1 py-0 h-4">Dépassé</Badge>;
    } else if (daysDiff <= 7) {
      colorClass = "text-orange-600 font-bold";
      badge = <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-600 border-orange-200 text-[10px] px-1 py-0 h-4">Bientôt</Badge>;
    } else {
      colorClass = "text-emerald-600 font-semibold";
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1 h-full w-full">
      {!vehicle.next_appointment_date ? (
        <div 
          className="text-slate-600 hover:text-emerald-600 transition-colors p-2 rounded hover:bg-emerald-50 cursor-pointer flex items-center justify-center"
          onClick={() => setAppointmentOpen(true)}
          title="Cliquez pour planifier un futur RDV"
        >
          <CalendarPlus className="w-4 h-4" />
        </div>
      ) : (
        <div 
          className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setAppointmentOpen(true)}
          title="Cliquez pour modifier le RDV"
        >
          <span className={`text-sm ${colorClass}`}>{dateObj?.toLocaleDateString('fr-FR')}</span>
          <span className="text-xs text-slate-500 truncate max-w-[120px]">
            {vehicle.next_appointment_nature || "Non spécifié"}
          </span>
          {badge}
        </div>
      )}

      {/* Modal to Schedule Appointment */}
      <Dialog open={appointmentOpen} onOpenChange={setAppointmentOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Programmer un RDV</DialogTitle>
            <DialogDescription>
              Définissez la date et la nature du prochain rendez-vous pour <strong>{vehicle.plate_number}</strong>.
            </DialogDescription>
          </DialogHeader>
          <SetAppointmentForm 
            vehicleId={vehicle.id} 
            onSuccess={() => setAppointmentOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
