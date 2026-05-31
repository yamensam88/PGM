"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditAbsenceForm } from "@/components/forms/EditAbsenceForm";
import { CalendarClock, Pencil } from "lucide-react";
import { toast } from "sonner";

type StatusEvent = {
  id: string;
  driver_id: string;
  driverName: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  notes?: string | null;
};

const LABEL: Record<string, string> = {
  vacation: "Congés",
  sick_leave: "Arrêt maladie",
  absence: "Absence injustifiée",
  presence: "Présence (en base)",
};
const BADGE: Record<string, string> = {
  vacation: "bg-indigo-50 text-indigo-700 border-indigo-200",
  sick_leave: "bg-amber-50 text-amber-700 border-amber-200",
  absence: "bg-rose-50 text-rose-700 border-rose-200",
  presence: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Gestion des statuts chauffeurs déclarés (congé / maladie / absence / présence) sur la période :
 * permet de MODIFIER ou d'ANNULER chaque statut directement depuis l'Exploitation / le planning.
 * Réutilise EditAbsenceForm (modifier + annuler l'événement).
 */
export function DeclaredStatusManager({
  events,
  drivers,
}: {
  events: StatusEvent[];
  drivers: { id: string; first_name: string; last_name: string }[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!events || events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-bold text-slate-700">
          Statuts déclarés sur la période — modifier / annuler ({events.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{ev.driverName}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${BADGE[ev.event_type] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                  {LABEL[ev.event_type] || ev.event_type}
                </span>
                <span className="text-[11px] text-slate-500">
                  {fmt(ev.start_date)}
                  {ev.end_date && ev.end_date !== ev.start_date ? ` → ${fmt(ev.end_date)}` : ""}
                </span>
              </div>
            </div>

            <Dialog open={openId === ev.id} onOpenChange={(o: boolean) => setOpenId(o ? ev.id : null)}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm" className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1" />
                }
              >
                <Pencil className="h-3.5 w-3.5" />
                Gérer
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-indigo-600">Modifier / annuler le statut</DialogTitle>
                </DialogHeader>
                <EditAbsenceForm
                  event={ev}
                  drivers={drivers}
                  onSuccess={() => {
                    setOpenId(null);
                    toast.success("Statut mis à jour.");
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}
