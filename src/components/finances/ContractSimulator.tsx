"use client";

import { useState } from "react";

export type SimulatorDefaults = {
  chauffeurJour: number;
  vehiculeJour: number;
  gasoilKm: number;
  usureKm: number;
  joursMois: number;
  parc: number;
  fSal: number;
  fLoy: number;
  fVadm: number;
  fAss: number;
  fLog: number;
  fHon: number;
  fAut: number;
};

const n = (v: unknown): number => {
  const x = parseFloat(String(v));
  return isFinite(x) ? x : 0;
};
const eur = (x: number) => Math.round(x).toLocaleString("fr-FR") + " €";
const eur2 = (x: number) =>
  (Math.round(x * 100) / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

function Field({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function Stat({ label, value, big = false, color = "" }: { label: string; value: string; big?: boolean; color?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
      <p className="text-[11px] text-slate-500 m-0">{label}</p>
      <p className={`${big ? "text-xl" : "text-lg"} font-semibold mt-0.5 ${color || "text-slate-900"}`}>{value}</p>
    </div>
  );
}

const HEAD = "text-xs font-bold text-slate-600 uppercase tracking-wider mb-2";

export function ContractSimulator({ defaults }: { defaults: SimulatorDefaults }) {
  const [s, setS] = useState<Record<string, any>>({
    colis: 2000, relpct: 0, jm: defaults.joursMois || 25.33,
    capColis: 130, capKm: 200, capH: 8, capVeh: 1,
    pColis: 1.5, pRel: 0.3, pJour: 0, pKm: 0,
    cCh: defaults.chauffeurJour, cPrime: 0, cVeh: defaults.vehiculeJour, cPeage: 0,
    cGas: defaults.gasoilKm, cUse: defaults.usureKm, cAlea: 3, refac: false,
    fSal: defaults.fSal, fLoy: defaults.fLoy, fVadm: defaults.fVadm, fAss: defaults.fAss,
    fLog: defaults.fLog, fHon: defaults.fHon, fAut: defaults.fAut, parc: defaults.parc || 14,
    periode: "jour", lever: "colis", cible: 15,
  });
  const set = (k: string, v: any) => setS((p) => ({ ...p, [k]: v }));

  const colis = n(s.colis), relpct = Math.min(100, Math.max(0, n(s.relpct))) / 100, jm = n(s.jm) || 1;
  const capC = n(s.capColis), capK = n(s.capKm), ratio = n(s.capVeh) || 1;
  const nbCh = capC > 0 ? Math.ceil(colis / capC) : 0;
  const nbVeh = Math.ceil(nbCh * ratio);
  const tkm = nbCh * capK;
  const hh = n(s.capH);

  const fixtot = n(s.fSal) + n(s.fLoy) + n(s.fVadm) + n(s.fAss) + n(s.fLog) + n(s.fHon) + n(s.fAut);
  const parc = n(s.parc) || 1;
  const fgveh = fixtot / jm / parc;

  const colisRel = colis * relpct, colisDir = colis - colisRel, refac = !!s.refac;
  const ca = nbVeh * n(s.pJour) + colisDir * n(s.pColis) + colisRel * n(s.pRel) + tkm * n(s.pKm) + (refac ? nbVeh * n(s.cPeage) : 0);
  const sous = nbCh * (n(s.cCh) + n(s.cPrime)) + nbVeh * n(s.cVeh) + tkm * (n(s.cGas) + n(s.cUse)) + nbVeh * n(s.cPeage) + nbVeh * fgveh;
  const cout = sous * (1 + Math.max(0, n(s.cAlea)) / 100);
  const marge = ca - cout, pct = ca > 0 ? marge / ca : 0;
  const mult = s.periode === "mois" ? jm : 1;

  const m = Math.min(0.95, Math.max(0, n(s.cible) / 100));
  const lever = s.lever;
  const priceFor = (tm: number): number | null => {
    const need = cout / (1 - tm);
    let others = 0, qty = 0;
    if (lever === "colis") { others = nbVeh * n(s.pJour) + colisRel * n(s.pRel) + tkm * n(s.pKm) + (refac ? nbVeh * n(s.cPeage) : 0); qty = colisDir; }
    else if (lever === "jour") { others = colisDir * n(s.pColis) + colisRel * n(s.pRel) + tkm * n(s.pKm) + (refac ? nbVeh * n(s.cPeage) : 0); qty = nbVeh; }
    else { others = nbVeh * n(s.pJour) + colisDir * n(s.pColis) + colisRel * n(s.pRel) + (refac ? nbVeh * n(s.cPeage) : 0); qty = tkm; }
    return qty > 0 ? (need - others) / qty : null;
  };
  const unit = lever === "jour" ? " /jour/véh" : lever === "colis" ? " /colis" : " /km";
  const be = priceFor(0), cb = priceFor(m);
  const fmtPrice = (x: number | null) => (x == null || x < 0 ? "n/a" : eur2(x) + unit);

  let vClass = "bg-slate-100 text-slate-500", vText = "Renseignez la tarification";
  if (ca > 0 && pct >= 0.15) { vClass = "bg-green-100 text-green-700"; vText = "✓ Rentable — signer"; }
  else if (ca > 0 && pct >= 0.05) { vClass = "bg-amber-100 text-amber-700"; vText = "⚠ Marge faible — à négocier"; }
  else if (ca > 0) { vClass = "bg-red-100 text-red-700"; vText = "✕ Non rentable — refuser"; }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <p className={HEAD + " text-indigo-800"}>Demande du client</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Colis / jour (contrat)" value={s.colis} onChange={(v) => set("colis", v)} step="10" />
          <Field label="% colis en point relais" value={s.relpct} onChange={(v) => set("relpct", v)} />
          <Field label="Jours ouvrés / mois" value={s.jm} onChange={(v) => set("jm", v)} step="0.01" />
        </div>
      </div>

      <div>
        <p className={HEAD}>Capacité par chauffeur (dimensionnement)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Colis / chauffeur / jour" value={s.capColis} onChange={(v) => set("capColis", v)} />
          <Field label="Km / chauffeur / jour" value={s.capKm} onChange={(v) => set("capKm", v)} />
          <Field label="Heures / chauffeur / jour" value={s.capH} onChange={(v) => set("capH", v)} step="0.5" />
          <Field label="Véhicules / chauffeur" value={s.capVeh} onChange={(v) => set("capVeh", v)} step="0.1" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <Stat label="Chauffeurs requis" value={String(nbCh)} />
          <Stat label="Véhicules requis" value={String(nbVeh)} />
          <Stat label="Km totaux / jour" value={tkm.toLocaleString("fr-FR") + " km"} />
          <Stat label="Amplitude" value={hh + " h" + (hh > 9 ? "  ⚠ >9h" : "")} color={hh > 9 ? "text-red-600" : ""} />
        </div>
      </div>

      <div>
        <p className={HEAD}>Tarification proposée</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Prix / colis direct €" value={s.pColis} onChange={(v) => set("pColis", v)} step="0.01" />
          <Field label="Prix / colis relais €" value={s.pRel} onChange={(v) => set("pRel", v)} step="0.01" />
          <Field label="Forfait / jour / véh €" value={s.pJour} onChange={(v) => set("pJour", v)} />
          <Field label="Prix / km €" value={s.pKm} onChange={(v) => set("pKm", v)} step="0.01" />
        </div>
      </div>

      <div>
        <p className={HEAD}>Coûts variables & directs (modifiables)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Chauffeur / jour €" value={s.cCh} onChange={(v) => set("cCh", v)} />
          <Field label="Prime chauffeur / jour €" value={s.cPrime} onChange={(v) => set("cPrime", v)} />
          <Field label="Véhicule (loc/amort.) / jour €" value={s.cVeh} onChange={(v) => set("cVeh", v)} />
          <Field label="Péages / jour / véh €" value={s.cPeage} onChange={(v) => set("cPeage", v)} />
          <Field label="Gasoil / km €" value={s.cGas} onChange={(v) => set("cGas", v)} step="0.01" />
          <Field label="Usure-entretien / km €" value={s.cUse} onChange={(v) => set("cUse", v)} step="0.01" />
          <Field label="Provision aléas %" value={s.cAlea} onChange={(v) => set("cAlea", v)} />
          <label className="flex items-end gap-2 text-xs text-slate-600 pb-1">
            <input type="checkbox" checked={!!s.refac} onChange={(e) => set("refac", e.target.checked)} className="w-4 h-4" />
            Péages refacturés
          </label>
        </div>
      </div>

      <div>
        <p className={HEAD}>Coûts fixes de structure (mensuels — modifiables)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Salaires bureau €" value={s.fSal} onChange={(v) => set("fSal", v)} step="100" />
          <Field label="Loyer €" value={s.fLoy} onChange={(v) => set("fLoy", v)} step="100" />
          <Field label="Véhicules admin €" value={s.fVadm} onChange={(v) => set("fVadm", v)} step="100" />
          <Field label="Assurances €" value={s.fAss} onChange={(v) => set("fAss", v)} step="50" />
          <Field label="Logiciels €" value={s.fLog} onChange={(v) => set("fLog", v)} step="50" />
          <Field label="Honoraires €" value={s.fHon} onChange={(v) => set("fHon", v)} step="50" />
          <Field label="Autres €" value={s.fAut} onChange={(v) => set("fAut", v)} step="50" />
          <Field label="Parc total entreprise (véh.)" value={s.parc} onChange={(v) => set("parc", v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Stat label="Total structure / mois" value={eur(fixtot)} />
          <Stat label="Frais généraux alloués / jour / véh" value={eur2(fgveh)} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <p className={HEAD + " mb-0"}>Résultat</p>
          <select
            value={s.periode}
            onChange={(e) => set("periode", e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            <option value="jour">par jour</option>
            <option value="mois">par mois</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Stat label="Chiffre d'affaires" value={eur(ca * mult)} />
          <Stat label="Coûts" value={eur(cout * mult)} />
          <Stat label="Marge nette" value={eur(marge * mult)} color={marge >= 0 ? "text-green-600" : "text-red-600"} />
          <Stat label="Marge %" value={(pct * 100).toFixed(1) + " %"} color={marge >= 0 ? "text-green-600" : "text-red-600"} />
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${vClass}`}>{vText}</span>
          <span className="text-xs text-slate-500">
            Coût de revient / colis : <b className="text-slate-800">{colis > 0 ? eur2(cout / colis) : "—"}</b>
          </span>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <p className={HEAD + " text-indigo-800"}>Combien facturer ce contrat ?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Levier de prix à ajuster</label>
            <select
              value={s.lever}
              onChange={(e) => set("lever", e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              <option value="colis">Prix / colis</option>
              <option value="jour">Forfait / jour / véh</option>
              <option value="km">Prix / km</option>
            </select>
          </div>
          <Field label="Marge cible %" value={s.cible} onChange={(v) => set("cible", v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Stat label="Prix au point mort" value={fmtPrice(be)} />
          <Stat label="Prix pour la marge cible" value={fmtPrice(cb)} />
        </div>
      </div>
    </div>
  );
}
