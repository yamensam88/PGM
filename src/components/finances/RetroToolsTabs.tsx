"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { ContractSimulator, type SimulatorDefaults } from "./ContractSimulator";

export function RetroToolsTabs({
  defaults,
  children,
  canRetro = true,
}: {
  defaults: SimulatorDefaults;
  children: React.ReactNode;
  canRetro?: boolean;
}) {
  const [tab, setTab] = useState<"retro" | "contrat">("contrat");

  const tabCls = (active: boolean) =>
    "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 " +
    (active
      ? "bg-indigo-600 text-white"
      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50");

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button type="button" onClick={() => setTab("contrat")} className={tabCls(tab === "contrat")}>
          Simulateur de contrat
        </button>
        <button type="button" onClick={() => setTab("retro")} className={tabCls(tab === "retro")}>
          Reprise d&apos;historique
          {!canRetro && (
            <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">
              Pro
            </span>
          )}
        </button>
      </div>

      <div className={tab === "contrat" ? "" : "hidden"}>
        <ContractSimulator defaults={defaults} />
      </div>
      <div className={tab === "retro" ? "" : "hidden"}>
        {canRetro ? (
          children
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reprise d&apos;historique &mdash; offre Pro</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Appliquez retroactivement de nouveaux tarifs et couts a vos tournees passees pour recalculer vos marges sur tout l&apos;historique. Cette fonctionnalite est incluse a partir de l&apos;offre Pro.
            </p>
            <Link
              href="/dispatch/settings/billing"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
            >
              Passer a l&apos;offre Pro <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
