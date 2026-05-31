"use client";

import { useState, useTransition } from "react";
import { Sparkles, Printer, TrendingDown, TrendingUp, Target, MapPin, UserRound, PauseCircle, PackageX, Brain, Loader2 } from "lucide-react";
import { generateDecisionNarrative } from "@/lib/actions";

type Cost = { label: string; amount: number; pct: number };
type Actor = { name: string; perRun: number; runs: number } | null;
type Action = { title: string; detail: string; impactEuro: number };

export type DecisionData = {
  generatedAt: string;
  revenue: number;
  margin: number;
  marginPct: number;
  targetPct: number;
  status: "no_data" | "deficit" | "fragile" | "sain";
  runs: number;
  km: number;
  topCosts: Cost[];
  best: Actor;
  worst: Actor;
  worstZone: { name: string; net: number; runs: number } | null;
  idle: { total: number; runsToAbsorb: number | null };
  quality: { failureRate: number; lostParcels: number; estLost: number };
  actions: Action[];
};

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

const STATUS: Record<string, { label: string; cls: string; bar: string }> = {
  no_data: { label: "Pas de données sur la période", cls: "bg-slate-50 border-slate-200 text-slate-600", bar: "bg-slate-300" },
  deficit: { label: "Déficitaire — action immédiate", cls: "bg-rose-50 border-rose-200 text-rose-700", bar: "bg-rose-500" },
  fragile: { label: "Sous le seuil sain — à renforcer", cls: "bg-amber-50 border-amber-200 text-amber-800", bar: "bg-amber-500" },
  sain: { label: "Rentabilité saine", cls: "bg-emerald-50 border-emerald-200 text-emerald-700", bar: "bg-emerald-500" },
};

export function DecisionReport({ data }: { data: DecisionData }) {
  const s = STATUS[data.status] || STATUS.no_data;
  const [isPending, startTransition] = useTransition();
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrError, setNarrError] = useState<string | null>(null);

  const generate = () => {
    if (isPending) return;
    setNarrError(null);
    startTransition(async () => {
      const r = await generateDecisionNarrative(JSON.stringify(data));
      if (r?.success) setNarrative(r.text || "");
      else { setNarrative(null); setNarrError(r?.error || "Erreur."); }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400 font-medium">Généré le {data.generatedAt} · {data.runs} tournée(s) · {Math.round(data.km)} km</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={generate} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {isPending ? "Rédaction…" : "Synthèse IA"}
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-[12px] font-semibold text-indigo-600 hover:bg-indigo-50">
            <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Synthèse rédigée par l'IA (à la demande) */}
      {(narrative || narrError) && (
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4">
          <div className="text-[12px] font-bold text-indigo-900 flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Synthèse exécutive — rédigée par l'IA (Gemini)</div>
          {narrative ? (
            <p className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap">{narrative}</p>
          ) : (
            <p className="text-[12px] text-amber-700 font-medium">{narrError}</p>
          )}
          {narrative && <p className="mt-2 text-[10px] text-slate-400">Rédigé à partir des indicateurs réels ci-dessous. Vérifiez avant toute décision engageante.</p>}
        </div>
      )}

      {/* Verdict */}
      <div className={`rounded-xl border p-4 ${s.cls}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest opacity-70">Marge nette · période</div>
            <div className="text-2xl font-extrabold mt-0.5">{eur(data.margin)}</div>
            <div className="text-[12px] font-semibold mt-0.5">{data.marginPct.toFixed(1)}% du CA ({eur(data.revenue)}) · cible {data.targetPct}%</div>
          </div>
          <div className="text-right text-[12px] font-bold flex items-center gap-1">
            {data.status === "sain" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {s.label}
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-white/60 overflow-hidden">
          <div className={`h-full ${s.bar}`} style={{ width: `${Math.max(0, Math.min(100, (data.marginPct / Math.max(data.targetPct, 1)) * 100))}%` }} />
        </div>
      </div>

      {/* Où va l'argent */}
      {data.topCosts.length > 0 && (
        <div>
          <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1.5 mb-2"><Target className="w-3.5 h-3.5 text-indigo-500" /> Où part l'argent (postes dominants)</div>
          <div className="space-y-2">
            {data.topCosts.map((c) => (
              <div key={c.label}>
                <div className="flex justify-between text-[12px]"><span className="text-slate-600">{c.label}</span><span className="font-semibold text-slate-800">{eur(c.amount)} · {c.pct.toFixed(0)}%</span></div>
                <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo-400" style={{ width: `${Math.min(100, c.pct)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acteurs & zone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><UserRound className="w-3.5 h-3.5" /> Meilleur (marge/tournée)</div>
          <div className="text-[13px] font-semibold text-slate-800 mt-1 truncate">{data.best ? data.best.name : "—"}</div>
          {data.best && <div className="text-[11px] text-slate-500">{eur(data.best.perRun)}/tournée · {data.best.runs} t.</div>}
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><UserRound className="w-3.5 h-3.5" /> À accompagner</div>
          <div className="text-[13px] font-semibold text-slate-800 mt-1 truncate">{data.worst ? data.worst.name : "—"}</div>
          {data.worst && <div className="text-[11px] text-slate-500">{eur(data.worst.perRun)}/tournée · {data.worst.runs} t.</div>}
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Zone la moins rentable</div>
          <div className="text-[13px] font-semibold text-slate-800 mt-1 truncate">{data.worstZone ? data.worstZone.name : "—"}</div>
          {data.worstZone && <div className="text-[11px] text-slate-500">{eur(data.worstZone.net)} · {data.worstZone.runs} t.</div>}
        </div>
      </div>

      {/* Inactivité + Qualité */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-3 flex items-start gap-2">
          <PauseCircle className="w-4 h-4 text-amber-500 mt-0.5" />
          <div>
            <div className="text-[12px] font-bold text-slate-700">Coût de l'inactivité</div>
            <div className="text-[12px] text-slate-600">{eur(data.idle.total)} sur la période{data.idle.runsToAbsorb ? ` · ≈ ${data.idle.runsToAbsorb} tournée(s) pour l'absorber` : ""}.</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 flex items-start gap-2">
          <PackageX className="w-4 h-4 text-rose-500 mt-0.5" />
          <div>
            <div className="text-[12px] font-bold text-slate-700">Qualité de livraison</div>
            <div className="text-[12px] text-slate-600">Taux d'échec {data.quality.failureRate.toFixed(1)}% · {data.quality.lostParcels} colis (avisés + retours) ≈ {eur(data.quality.estLost)} de CA non facturé.</div>
          </div>
        </div>
      </div>

      {/* Plan d'action priorisé */}
      {data.actions.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
          <div className="text-[12px] font-bold text-indigo-900 flex items-center gap-1.5 mb-2"><Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Plan d'action priorisé (par impact €)</div>
          <ol className="space-y-2">
            {data.actions.map((a, i) => (
              <li key={i} className="flex items-start justify-between gap-3 rounded-lg bg-white border border-indigo-100 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-800">{i + 1}. {a.title}</div>
                  <div className="text-[11px] text-slate-500">{a.detail}</div>
                </div>
                <span className="shrink-0 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white">≈ {eur(a.impactEuro)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[10px] text-slate-400">Impacts estimés à partir de vos données réelles — ordres de grandeur d'aide à la décision, non un engagement comptable.</p>
        </div>
      )}
    </div>
  );
}
