"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Umbrella, Stethoscope, UserX, Check, Pencil, RotateCcw } from "lucide-react";
import { regularizeUnassignedDriver, deleteDriverAbsence } from "@/lib/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditAbsenceForm } from "@/components/forms/EditAbsenceForm";

type GuardDriver = { id: string; first_name: string; last_name: string };
type EvType = "vacation" | "sick_leave" | "absence";

const LABEL: Record<string, string> = {
  vacation: "Congé",
  sick_leave: "Maladie",
  absence: "Absence injustifiée",
};

export function UnassignedSalariedGuard({
  drivers,
  dateISO,
  dateLabel,
}: {
  drivers: GuardDriver[];
  dateISO: string;
  dateLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, { eventId: string; type: EvType }>>({});
  const [editingDriver, setEditingDriver] = useState<string | null>(null);

  if (!drivers || drivers.length === 0) return null;

  const set = (driver_id: string, event_type: EvType) => {
    if (isPending) return;
    setError(null);
    setBusyKey(driver_id + event_type);
    const fd = new FormData();
    fd.append("driver_id", driver_id);
    fd.append("event_type", event_type);
    fd.append("day", dateISO);
    startTransition(async () => {
      const r = await regularizeUnassignedDriver(fd);
      setBusyKey(null);
      if (r?.success && (r as any).eventId) {
        setDone((prev) => ({ ...prev, [driver_id]: { eventId: (r as any).eventId, type: event_type } }));
      } else {
        setError(r?.error || "Erreur lors de la régularisation.");
      }
    });
  };

  const cancel = (driver_id: string, eventId: string) => {
    if (isPending) return;
    setError(null);
    setBusyKey(driver_id + "cancel");
    startTransition(async () => {
      const r = await deleteDriverAbsence(eventId);
      setBusyKey(null);
      if (r?.success) {
        setDone((prev) => {
          const cp = { ...prev };
          delete cp[driver_id];
          return cp;
        });
      } else {
        setError((r as any)?.error || "Erreur lors de l'annulation.");
      }
    });
  };

  const hasDone = Object.keys(done).length > 0;

  return (
    <div className="mb-6">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 md:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-lg bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900">
              Garde-fou · {drivers.length} salarié{drivers.length > 1 ? "s" : ""} non affecté{drivers.length > 1 ? "s" : ""} sans statut
            </h3>
            <p className="text-[12px] text-amber-800/90 mt-0.5">
              Jour ouvré{dateLabel ? ` (${dateLabel})` : ""} : chaque salarié non affecté doit avoir un statut, sinon sa charge fixe est comptée « à l'arrêt » sans justification. Indépendants exclus.
            </p>

            <div className="mt-3 space-y-2">
              {drivers.map((d) => {
                const setInfo = done[d.id];
                return (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-white border border-amber-200 px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-slate-800">
                      {d.first_name} {d.last_name}
                    </span>

                    {!setInfo ? (
                      <div className="flex items-center gap-2">
                        <button type="button" disabled={isPending} onClick={() => set(d.id, "vacation")} className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                          <Umbrella className="h-3.5 w-3.5" />
                          {busyKey === d.id + "vacation" ? "…" : "Congé"}
                        </button>
                        <button type="button" disabled={isPending} onClick={() => set(d.id, "sick_leave")} className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-amber-600 disabled:opacity-50">
                          <Stethoscope className="h-3.5 w-3.5" />
                          {busyKey === d.id + "sick_leave" ? "…" : "Maladie"}
                        </button>
                        <button type="button" disabled={isPending} onClick={() => set(d.id, "absence")} className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-rose-700 disabled:opacity-50">
                          <UserX className="h-3.5 w-3.5" />
                          {busyKey === d.id + "absence" ? "…" : "Absence injustifiée"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                          <Check className="h-3.5 w-3.5" /> {LABEL[setInfo.type]} enregistré
                        </span>

                        <Dialog open={editingDriver === d.id} onOpenChange={(o: boolean) => setEditingDriver(o ? d.id : null)}>
                          <DialogTrigger render={<Button variant="outline" size="sm" className="h-7 border-slate-200 text-slate-700 hover:bg-slate-50 gap-1" />}>
                            <Pencil className="h-3.5 w-3.5" /> Modifier
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
                            <DialogHeader>
                              <DialogTitle className="text-indigo-600">Modifier le statut de {d.first_name} {d.last_name}</DialogTitle>
                            </DialogHeader>
                            <EditAbsenceForm
                              event={{ id: setInfo.eventId, driver_id: d.id, event_type: setInfo.type, start_date: dateISO, end_date: dateISO, notes: "" }}
                              drivers={drivers}
                              onSuccess={() => {
                                setEditingDriver(null);
                                setDone((prev) => {
                                  const cp = { ...prev };
                                  delete cp[d.id];
                                  return cp;
                                });
                                router.refresh();
                              }}
                            />
                          </DialogContent>
                        </Dialog>

                        <button type="button" disabled={isPending} onClick={() => cancel(d.id, setInfo.eventId)} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[12px] font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                          <RotateCcw className="h-3.5 w-3.5" />
                          {busyKey === d.id + "cancel" ? "…" : "Annuler"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-2 text-[12px] font-medium text-rose-700">{error}</p>}

            {hasDone && (
              <button type="button" onClick={() => router.refresh()} className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-900">
                Terminé — actualiser les chiffres
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
