import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Activity, ArrowUpRight, CheckCircle2, ArrowLeft, AlertTriangle, Sparkles } from "lucide-react";
import { getMasterOrgId } from "@/lib/authz"; // fix SA-C1
import { PLAN_LABELS, normalizePlan, monthlyPriceFor } from "@/lib/plans";
import ClientsTable, { type SerializedClient } from "@/components/super-admin/ClientsTable";

export const dynamic = "force-dynamic";

// Statuts considérés comme payants (alignés sur plans.ts PAID_STATUSES).
const PAID = ["active", "past_due"];
// Statuts considérés "à risque" (revenu menacé ou perdu).
const AT_RISK = ["past_due", "expired", "canceled"];

/** Lit settings_json (string OU objet) et renvoie un objet sûr. */
function readSettings(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw as Record<string, any>;
}

/** Formate une date de renouvellement (current_period_end) en FR, ou null. */
function formatRenewal(settings: Record<string, any>): string | null {
  const v = settings?.current_period_end;
  if (!v) return null;
  const d = typeof v === "number" ? new Date(v * 1000) : new Date(v);
  if (isNaN(d.getTime())) return null;
  return format(d, "d MMM yyyy", { locale: fr });
}

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // NOTE: Sécurité Super-Admin stricte ! Seule l'organisation maîtresse a accès.
  // fix SA-C1 : source autoritaire centralisée (MASTER_ORG_ID, sinon la plus ancienne).
  const masterOrgId = await getMasterOrgId();

  if (session.user.organization_id !== masterOrgId) {
    redirect("/dispatch/dashboard");
  }

  if (session.user.role !== "owner" && session.user.role !== "super_admin") {
    redirect("/dispatch/dashboard");
  }

  const organizations = await prisma.organization.findMany({
    include: {
      drivers: { where: { status: "active" }, select: { id: true } },
      users: { select: { id: true } },
      vehicles: { where: { status: "active" }, select: { id: true } },
    },
    orderBy: { created_at: "desc" },
  });

  // --- KPIs réels (org maîtresse exclue des compteurs business) ---
  const clientOrgs = organizations.filter((o) => o.id !== masterOrgId);

  const mrrTotal = clientOrgs.reduce((sum, org) => {
    const status = (org.subscription_status || "").toLowerCase();
    if (!PAID.includes(status)) return sum;
    return sum + monthlyPriceFor(org.subscription_plan); // business = 0 (sur devis)
  }, 0);

  const payingCount = clientOrgs.filter((o) =>
    PAID.includes((o.subscription_status || "").toLowerCase())
  ).length;
  const trialingCount = clientOrgs.filter(
    (o) => (o.subscription_status || "").toLowerCase() === "trialing"
  ).length;
  const atRiskCount = clientOrgs.filter((o) =>
    AT_RISK.includes((o.subscription_status || "").toLowerCase())
  ).length;
  const totalDriversSaaS = organizations.reduce((sum, org) => sum + org.drivers.length, 0);

  // --- Sérialisation pour le composant client (aucune Date/Decimal brute) ---
  const serialized: SerializedClient[] = organizations.map((org) => {
    const settings = readSettings(org.settings_json);
    const plan = normalizePlan(org.subscription_plan);
    const price = monthlyPriceFor(org.subscription_plan);
    return {
      id: org.id,
      shortId: org.id.split("-")[0],
      name: org.name,
      planLabel: PLAN_LABELS[plan],
      priceLabel: plan === "business" ? "Sur devis" : `${price} €/mois`,
      status: org.subscription_status || "",
      drivers: org.drivers.length,
      vehicles: org.vehicles.length,
      users: org.users.length,
      renewal: formatRenewal(settings),
      isMaster: org.id === masterOrgId,
    };
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-8">

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/dispatch/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour au Dashboard Exploitation
            </Link>
            <div className="block">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-none mb-3">
                HQ PLATFORM CONTROL
              </Badge>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
              Administration SaaS
            </h1>
            <p className="text-zinc-400 mt-2 text-[15px] max-w-xl leading-relaxed">
              Supervisez toutes les entreprises clientes, leur abonnement et le MRR (revenu mensuel récurrent) généré par la plateforme.
            </p>
          </div>
        </header>

        {/* KPIs réels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="w-24 h-24 text-emerald-500" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">MRR réel</h3>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-400 tracking-tight">{mrrTotal.toLocaleString("fr-FR")} €</div>
              <p className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Starter 99 € + Pro 249 € (Business sur devis, hors MRR)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Clients payants</h3>
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-4xl font-black text-white tracking-tight">{payingCount}</div>
              <p className="text-xs text-zinc-500 mt-2 font-medium">Abonnement actif ou en délai de grâce</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">En essai</h3>
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-4xl font-black text-white tracking-tight">{trialingCount}</div>
              <p className="text-xs text-zinc-500 mt-2 font-medium">Prospects en période d'essai</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">À risque</h3>
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-4xl font-black text-amber-400 tracking-tight">{atRiskCount}</div>
              <p className="text-xs text-zinc-500 mt-2 font-medium">Retard de paiement, expiré ou résilié</p>
            </CardContent>
          </Card>
        </div>

        {/* Bandeau secondaire : chauffeurs globaux + état plateforme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Chauffeurs globaux</h3>
                <div className="text-3xl font-black text-white tracking-tight">{totalDriversSaaS}</div>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Actifs sur toute la plateforme</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">État plateforme</h3>
                <div className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  Opérationnelle
                </div>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Bases de données étanches (multi-tenant)</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portefeuille clients (recherche + filtre côté client) */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-zinc-200">Portefeuille clients</h2>
          <ClientsTable clients={serialized} />
        </div>

      </div>
    </div>
  );
}
