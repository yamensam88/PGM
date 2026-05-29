"use client";

import { useState } from "react";
import { ContractSimulator, type SimulatorDefaults } from "./ContractSimulator";

export function RetroToolsTabs({
  defaults,
  children,
}: {
  defaults: SimulatorDefaults;
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState<"retro" | "contrat">("contrat");

  const tabCls = (active: boolean) =>
    "px-4 py-2 rounded-lg text-sm font-semibold transition-colors " +
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
        </button>
      </div>

      <div className={tab === "contrat" ? "" : "hidden"}>
        <ContractSimulator defaults={defaults} />
      </div>
      <div className={tab === "retro" ? "" : "hidden"}>{children}</div>
    </div>
  );
}
