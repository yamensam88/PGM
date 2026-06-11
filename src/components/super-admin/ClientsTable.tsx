"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Power, PowerOff, ArrowUpRight } from "lucide-react";
import { toggleSaaSClientStatus } from "@/lib/actions";

/**
 * Représentation sérialisée d'une organisation cliente (passée par le server component).
 * Aucune Date / Decimal Prisma ici : tout est déjà en string/number.
 */
export type SerializedClient = {
  id: string;
  shortId: string;
  name: string;
  planLabel: string;
  priceLabel: string; // "99 €/mois" ou "Sur devis"
  status: string; // brut (active, trialing, past_due, canceled, expired, suspended…)
  drivers: number;
  vehicles: number;
  users: number;
  renewal: string | null; // déjà formaté ("11 juin 2026") ou null
  isMaster: boolean;
};

/** Mapping statut → libellé FR + classes de badge (couleur dédiée par statut). */
function statusBadge(status: string) {
  const s = (status || "").toLowerCase();
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Actif", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    trialing: { label: "En essai", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    past_due: { label: "Paiement en retard", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    canceled: { label: "Résilié", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
    expired: { label: "Expiré", cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    suspended: { label: "Suspendu", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  return map[s] || { label: status || "—", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "trialing", label: "En essai" },
  { value: "past_due", label: "Paiement en retard" },
  { value: "canceled", label: "Résilié" },
  { value: "expired", label: "Expiré" },
  { value: "suspended", label: "Suspendu" },
];

export default function ClientsTable({ clients }: { clients: SerializedClient[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      const matchName = q === "" || c.name.toLowerCase().includes(q);
      const matchStatus = status === "all" || (c.status || "").toLowerCase() === status;
      return matchName && matchStatus;
    });
  }, [clients, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une entreprise…"
            className="pl-8 h-9 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm px-3 outline-none focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value} className="bg-zinc-900 text-zinc-100">
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-zinc-500 uppercase tracking-wider bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Entreprise</th>
                <th className="px-6 py-4 font-semibold">Abonnement</th>
                <th className="px-6 py-4 font-semibold text-center">Chauffeurs</th>
                <th className="px-6 py-4 font-semibold text-center">Véhicules</th>
                <th className="px-6 py-4 font-semibold text-center">Utilisateurs</th>
                <th className="px-6 py-4 font-semibold text-center">Statut</th>
                <th className="px-6 py-4 font-semibold">Renouvellement</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filtered.map((c) => {
                const sb = statusBadge(c.status);
                const isSuspended = (c.status || "").toLowerCase() === "suspended";
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/super-admin/${c.id}`} className="group inline-flex items-center gap-2">
                        <span>
                          <span className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                            {c.name}
                          </span>
                          {c.isMaster && (
                            <Badge className="ml-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-none align-middle">
                              HQ
                            </Badge>
                          )}
                          <span className="block text-zinc-500 text-[11px] mt-0.5 font-mono">{c.shortId}…</span>
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-200">{c.planLabel}</p>
                      <p className="text-zinc-500 text-[11px] mt-0.5">{c.priceLabel}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-zinc-800 rounded-lg font-bold text-zinc-300">
                        {c.drivers}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-500 font-medium">{c.vehicles}</td>
                    <td className="px-6 py-4 text-center text-zinc-500 font-medium">{c.users}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`${sb.cls} shadow-none`}>
                        {sb.label}
                      </Badge>
                      {c.isMaster && (
                        <span className="block text-[10px] text-emerald-500/70 mt-1">Vous</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{c.renewal ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <Link href={`/super-admin/${c.id}`}>
                          <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-white/5">
                            Gérer
                          </Button>
                        </Link>
                        <form action={toggleSaaSClientStatus as any} className="inline-block">
                          <input type="hidden" name="orgId" value={c.id} />
                          <input type="hidden" name="action" value={isSuspended ? "activate" : "suspend"} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className={isSuspended ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-red-500 hover:text-red-400 hover:bg-red-500/10"}
                            disabled={c.isMaster}
                          >
                            {isSuspended ? (
                              <><Power className="w-4 h-4 mr-1.5" /> Réactiver</>
                            ) : (
                              <><PowerOff className="w-4 h-4 mr-1.5" /> Suspendre</>
                            )}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-500 bg-zinc-950/20">
                    Aucune entreprise ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
