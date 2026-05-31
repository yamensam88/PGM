"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Umbrella, Stethoscope, UserX } from "lucide-react";
import { regularizeUnassignedDriver } from "@/lib/actions";

type GuardDriver = { id: string; first_name: string; last_name: string };

/**
 * Garde-fou : liste les chauffeurs SALARIÉS non affectés et SANS statut pour le jour ouvré affiché.
 * Un salarié non affecté sans statut pèse une charge fixe « à l'arrêt » non justifiée et fausse la marge.
 * 3 actions rapides : Congé / Maladie / Absence injustifiée (= non payée → économie).
 */
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

  if (!drivers || drivers.length === 0) return null;

  const act = (driver_id: string, event_type: "vacation" | "sick_leave" | "absence") => {
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
      if (r?.success) router.refresh();
      else setError(r?.error || "Erreur lors de la régularisation.");
    });
  };

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
              Jour ouvré{dateLabel ? ` (${dateLabel})` : ""} : chaque salarié non affecté doit avoir un statut, sinon sa charge fixe est comptée « à l'arrêt » sans justification et fausse la marge. Indépendants exclus.
            </p>

            <div className="mt-3 space-y-2">
              {drivers.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-white border border-amber-200 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-slate-800">
                    {d.first_name} {d.last_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => act(d.id, "vacation")}
                      className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Umbrella className="h-3.5 w-3.5" />
                      {busyKey === d.id + "vacation" ? "…" : "Congé"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => act(d.id, "sick_leave")}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      {busyKey === d.id + "sick_leave" ? "…" : "Maladie"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => act(d.id, "absence")}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      {busyKey === d.id + "absence" ? "…" : "Absence injustifiée"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="mt-2 text-[12px] font-medium text-rose-700">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
