import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Building2, Users, Truck, Route, Power, PowerOff,
  CreditCard, Globe, FileText, CalendarDays, Activity,
} from "lucide-react";
import { getMasterOrgId } from "@/lib/authz"; // fix SA-C1
import { toggleSaaSClientStatus } from "@/lib/actions";
import { PLAN_LABELS, normalizePlan, monthlyPriceFor } from "@/lib/plans";

export const dynamic = "force-dynamic";

const PAID = ["active", "past_due"];

/** Libellés FR des rôles métier. */
const ROLE_LABELS: Record<string, string> = {
  owner: "Direction",
  admin: "Direction",
  manager: "Exploitation",
  dispatcher: "Exploitation",
  hr: "RH",
  finance: "Finance",
  driver: "Chauffeur",
};

function roleLabel(role?: string | null): string {
  return ROLE_LABELS[(role || "").toLowerCase()] || role || "—";
}

function readSettings(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw as Record<string, any>;
}

function fmtDate(v: unknown, withTime = false): string {
  if (!v) return "—";
  const d = typeof v === "number" ? new Date(v * 1000) : new Date(v as any);
  if (isNaN(d.getTime())) return "—";
  return format(d, withTime ? "d MMM yyyy 'à' HH:mm" : "d MMM yyyy", { locale: fr });
}

/** Badge de statut (mêmes couleurs que la liste). */
function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Actif", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    trialing: { label: "En essai", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    past_due: { label: "Paiement en retard", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    canceled: { label: "Résilié", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
    expired: { label: "Expiré", cls: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    suspended: { label: "Suspendu", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const b = map[s] || { label: status || "—", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
  return <Badge variant="outline" className={`${b.cls} shadow-none`}>{b.label}</Badge>;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Double-garde : org maîtresse + owner (alignée sur la page principale). fix SA-C1
  const masterOrgId = await getMasterOrgId();
  if (session.user.organization_id !== masterOrgId) {
    redirect("/dispatch/dashboard");
  }
  if (session.user.role !== "owner" && session.user.role !== "super_admin") {
    redirect("/dispatch/dashboard");
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        orderBy: { created_at: "asc" },
        select: {
          id: true, email: true, role: true, first_name: true, last_name: true,
          status: true, last_login_at: true, last_active_at: true,
        },
      },
      drivers: { where: { status: "active" }, select: { id: true } },
      vehicles: { where: { status: "active" }, select: { id: true } },
    },
  });

  if (!org) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans">
        <div className="max-w-3xl mx-auto p-6 md:p-8">
          <Link href="/super-admin" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au portefeuille
          </Link>
          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-10 text-center">
              <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-zinc-100">Entreprise introuvable</h1>
              <p className="text-zinc-500 mt-2 text-sm">
                Aucune organisation ne correspond à l'identifiant <span className="font-mono">{orgId}</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const settings = readSettings(org.settings_json);
  const plan = normalizePlan(org.subscription_plan);
  const price = monthlyPriceFor(org.subscription_plan);
  const status = (org.subscription_status || "").toLowerCase();
  const isMaster = org.id === masterOrgId;
  const isSuspended = status === "suspended";

  // Fin d'essai : created_at + 7 jours (si trialing).
  let trialEnd: string | null = null;
  if (status === "trialing" && org.created_at) {
    const end = new Date(new Date(org.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
    trialEnd = format(end, "d MMM yyyy", { locale: fr });
  }

  // Tournées sur 30 derniers jours.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const runs30 = await prisma.dailyRun.count({
    where: { organization_id: org.id, date: { gte: since } },
  });

  // Dernière activité = max des last_active_at des utilisateurs.
  const lastActiveTs = org.users.reduce<number>((max, u) => {
    if (!u.last_active_at) return max;
    const t = new Date(u.last_active_at).getTime();
    return t > max ? t : max;
  }, 0);
  const lastActivity = lastActiveTs > 0 ? fmtDate(lastActiveTs) : "—";

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1100px] mx-auto p-6 md:p-8 space-y-8">

        {/* En-tête */}
        <header className="border-b border-zinc-800 pb-6">
          <Link href="/super-admin" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au portefeuille
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
                {isMaster && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-none">HQ — Vous</Badge>
                )}
                <StatusBadge status={org.subscription_status || ""} />
              </div>
              <p className="text-zinc-500 text-[11px] font-mono">{org.id}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-1.5"><Globe className="w-4 h-4 text-zinc-600" /> {org.country || "—"}</span>
                <span className="inline-flex items-center gap-1.5"><FileText className="w-4 h-4 text-zinc-600" /> TVA : {org.tax_id || "—"}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-zinc-600" /> Créée le {fmtDate(org.created_at)}</span>
              </div>
            </div>
            <form action={toggleSaaSClientStatus as any}>
              <input type="hidden" name="orgId" value={org.id} />
              <input type="hidden" name="action" value={isSuspended ? "activate" : "suspend"} />
              <Button
                type="submit"
                className={isSuspended
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"}
                disabled={isMaster}
              >
                {isSuspended ? (
                  <><Power className="w-4 h-4 mr-2" /> Réactiver le client</>
                ) : (
                  <><PowerOff className="w-4 h-4 mr-2" /> Suspendre le client</>
                )}
              </Button>
            </form>
          </div>
        </header>

        {/* Abonnement + Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardHeader>
              <CardTitle className="text-base text-zinc-200 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" /> Abonnement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Offre</span>
                <span className="text-zinc-100 font-semibold">
                  {PLAN_LABELS[plan]}
                  <span className="text-zinc-500 font-normal ml-2">
                    {plan === "business" ? "Sur devis" : `${price} €/mois`}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Statut</span>
                <StatusBadge status={org.subscription_status || ""} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Renouvellement</span>
                <span className="text-zinc-300 text-sm">{fmtDate(settings.current_period_end)}</span>
              </div>
              {status === "trialing" && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-sm">Fin de l'essai</span>
                  <span className="text-zinc-300 text-sm">{trialEnd ?? "—"}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardHeader>
              <CardTitle className="text-base text-zinc-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" /> Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-zinc-950/50 border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1"><Users className="w-3.5 h-3.5" /> Utilisateurs</div>
                  <div className="text-2xl font-black text-white">{org.users.length}</div>
                </div>
                <div className="rounded-lg bg-zinc-950/50 border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1"><Users className="w-3.5 h-3.5" /> Chauffeurs actifs</div>
                  <div className="text-2xl font-black text-white">{org.drivers.length}</div>
                </div>
                <div className="rounded-lg bg-zinc-950/50 border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1"><Truck className="w-3.5 h-3.5" /> Véhicules</div>
                  <div className="text-2xl font-black text-white">{org.vehicles.length}</div>
                </div>
                <div className="rounded-lg bg-zinc-950/50 border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1"><Route className="w-3.5 h-3.5" /> Tournées (30 j)</div>
                  <div className="text-2xl font-black text-white">{runs30}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-zinc-500 text-sm">Dernière activité</span>
                <span className="text-zinc-300 text-sm">{lastActivity}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utilisateurs */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-zinc-200">Utilisateurs ({org.users.length})</h2>
          <Card className="bg-zinc-900 border-zinc-800 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-zinc-500 uppercase tracking-wider bg-zinc-950/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nom</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Rôle</th>
                    <th className="px-6 py-4 font-semibold">Dernière connexion</th>
                    <th className="px-6 py-4 font-semibold text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {org.users.map((u) => {
                    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                    const uStatus = (u.status || "active").toLowerCase();
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-100">{name}</td>
                        <td className="px-6 py-4 text-zinc-400">{u.email}</td>
                        <td className="px-6 py-4 text-zinc-300">{roleLabel(u.role)}</td>
                        <td className="px-6 py-4 text-zinc-400">{fmtDate(u.last_login_at, true)}</td>
                        <td className="px-6 py-4 text-center">
                          {uStatus === "active" ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none">Actif</Badge>
                          ) : uStatus === "suspended" ? (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 shadow-none">Suspendu</Badge>
                          ) : uStatus === "invited" ? (
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-none">Invité</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 shadow-none">{u.status}</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {org.users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 bg-zinc-950/20">Aucun utilisateur.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
