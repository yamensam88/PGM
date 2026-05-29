import { Lightbulb, ArrowRight, TrendingUp } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export type Reco = {
  /** Titre de l'action recommandée, ex: "Augmenter le tarif de 3,2%" */
  action: string;
  /** Levier ciblé, ex: "Prix de vente" ou "Carburant" */
  lever: string;
  /** Gain estimé en euros sur la période analysée */
  impactEuro: number;
  /** Libellé de période, ex: "sur la période" ou "/mois" */
  periodLabel: string;
  beforeLabel: string;
  beforeValue: string;
  afterValue: string;
  beforePct: number;
  afterPct: number;
  delay: string;
  risk: string;
  rationale: string;
};

/**
 * StrategicRecommendation — carte d'action prioritaire CHIFFRÉE.
 * Le moteur de calcul vit dans le dashboard (données réelles) ; ce composant n'affiche que le résultat.
 */
export function StrategicRecommendation({ reco }: { reco: Reco | null }) {
  if (!reco) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="font-semibold text-slate-900">Aucune action prioritaire</h3>
        <p className="text-sm text-slate-500 mt-1">Votre marge est saine sur la période. Continuez à surveiller vos postes de coût.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="flex gap-4 items-center mb-6 relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Lightbulb className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-indigo-500">Recommandation stratégique</p>
          <h3 className="font-bold text-slate-900 text-lg leading-tight">{reco.action}</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 mb-1">Levier</div>
          <div className="font-bold text-slate-900 text-sm">{reco.lever}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <div className="text-[9px] font-mono tracking-widest uppercase text-emerald-600 mb-1">Impact</div>
          <div className="font-bold text-emerald-600 text-sm">
            +{fmt(reco.impactEuro)}
            <span className="text-[10px] font-normal text-emerald-500/70"> {reco.periodLabel}</span>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 mb-1">Délai</div>
          <div className="font-bold text-slate-900 text-sm">{reco.delay}</div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 mb-4">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-mono tracking-widest uppercase text-slate-400">Situation actuelle</span>
          <span className="font-mono tracking-widest uppercase text-emerald-600">Après action</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">{reco.beforeLabel}</span>
          <div className="flex items-center gap-3">
            <span className="text-rose-500 font-medium">{reco.beforeValue} ({reco.beforePct.toFixed(1)}%)</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-emerald-600 font-bold">{reco.afterValue} ({reco.afterPct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
        <p className="text-xs text-slate-600 leading-relaxed">{reco.rationale}</p>
      </div>

      <p className="mt-3 text-[10px] font-mono text-slate-400">{reco.risk}</p>
    </div>
  );
}
