"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

type Item = { label: string; amount: number };

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/**
 * MarginWaterfall — décomposition "bridge" du chiffre d'affaires vers la marge nette.
 * Chaque poste de coût est une barre flottante qui fait chuter le CA jusqu'à la marge.
 * Données 100% réelles passées en props depuis le dashboard Direction.
 */
export function MarginWaterfall({
  revenue,
  items,
  net,
  title = "Du chiffre d'affaires à la marge nette",
}: {
  revenue: number;
  items: Item[];
  net: number;
  title?: string;
}) {
  const base = revenue > 0 ? revenue : 1;
  const realCosts = items.filter((i) => i.amount > 0.5);
  const totalCosts = realCosts.reduce((s, i) => s + i.amount, 0);
  const marginPct = revenue > 0 ? (net / revenue) * 100 : 0;
  const positive = net >= 0;

  // Barres flottantes : on part du CA et chaque coût "descend" le niveau restant.
  let running = revenue;
  const rows = realCosts.map((it) => {
    const top = running;
    const bottom = running - it.amount;
    running = bottom;
    return {
      label: it.label,
      amount: it.amount,
      left: (Math.min(top, bottom) / base) * 100,
      width: (it.amount / base) * 100,
      share: totalCosts > 0 ? (it.amount / totalCosts) * 100 : 0,
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-indigo-500" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Décomposition poste par poste sur la période</p>
        </div>
        <div className={`text-right shrink-0 ${positive ? "text-emerald-600" : "text-rose-600"}`}>
          <div className="text-2xl font-extrabold tracking-tight">{fmt(net)}</div>
          <div className="text-xs font-medium flex items-center gap-1 justify-end">
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {marginPct.toFixed(1)}% de marge nette
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {/* CA de départ */}
        <Bar label="Chiffre d'affaires" value={fmt(revenue)} left={0} width={100} tone="revenue" />

        {/* Postes de coût (barres flottantes) */}
        {rows.map((r, i) => (
          <Bar
            key={i}
            label={r.label}
            value={`− ${fmt(r.amount)}`}
            sub={`${r.share.toFixed(0)}% des coûts`}
            left={r.left}
            width={Math.max(r.width, 0.6)}
            tone="cost"
          />
        ))}

        {/* Marge nette finale */}
        <Bar
          label="Marge nette"
          value={fmt(net)}
          left={0}
          width={Math.max((Math.abs(net) / base) * 100, 0.6)}
          tone={positive ? "net" : "neg"}
          strong
        />
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  sub,
  left,
  width,
  tone,
  strong = false,
}: {
  label: string;
  value: string;
  sub?: string;
  left: number;
  width: number;
  tone: "revenue" | "cost" | "net" | "neg";
  strong?: boolean;
}) {
  const color =
    tone === "revenue"
      ? "bg-indigo-500"
      : tone === "cost"
      ? "bg-rose-400/80"
      : tone === "net"
      ? "bg-emerald-500"
      : "bg-rose-600";

  return (
    <div className="grid grid-cols-[160px_1fr_auto] items-center gap-3">
      <div className={`text-xs truncate ${strong ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
        {label}
        {sub && <span className="block text-[10px] text-slate-400 font-normal">{sub}</span>}
      </div>
      <div className="relative h-6 rounded bg-slate-100 overflow-hidden">
        <div
          className={`absolute top-0 bottom-0 ${color} rounded transition-all`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <div
        className={`text-xs tabular-nums text-right w-24 ${
          tone === "cost" ? "text-rose-600" : strong ? "font-bold text-slate-900" : "text-slate-700"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
