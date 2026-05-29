import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { computeRunRevenue } from "@/lib/finance";
import { DirectionRealPrices } from "@/components/finances/DirectionRealPrices";
import { ClientRateCardsManager } from "@/components/settings/ClientRateCardsManager";
import { SettingsForms } from "@/components/settings/SettingsForms";

export const dynamic = "force-dynamic";

const eur = (x: number) => Math.round(x).toLocaleString("fr-FR") + " €";

export default async function DirectionCockpitPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organization_id) redirect("/login");
  if ((session.user as any).role !== "owner") redirect("/dispatch/dashboard");

  const orgId = session.user.organization_id;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [clients, org, runs] = await Promise.all([
    prisma.client.findMany({ where: { organization_id: orgId }, include: { rate_cards: true }, orderBy: { name: "asc" } }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { settings_json: true } }),
    prisma.dailyRun.findMany({
      where: { organization_id: orgId, status: "completed", date: { gte: monthStart, lte: now } },
      select: {
        client_id: true, packages_delivered: true, packages_relay: true, stops_completed: true,
        revenue_calculated: true, cost_driver: true, cost_vehicle: true, cost_fuel: true,
      },
    }),
  ]);

  const settings: any = (org?.settings_json as any) || {};
  const realRates: Record<string, any> = settings.real_rates || {};

  let caAff = 0, caReel = 0, couts = 0;
  for (const r of runs) {
    const dispRev = Number(r.revenue_calculated || 0);
    const rr = realRates[r.client_id];
    const realRev = rr
      ? computeRunRevenue({ rate_card: rr, packages_delivered: r.packages_delivered, packages_relay: r.packages_relay, stops_completed: r.stops_completed })
      : dispRev;
    caAff += dispRev;
    caReel += realRev;
    couts += Number(r.cost_driver || 0) + Number(r.cost_vehicle || 0) + Number(r.cost_fuel || 0);
  }
  const margeAff = caAff - couts;
  const margeReel = caReel - couts;
  const ecart = margeReel - margeAff;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-24 h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6 text-slate-900">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">Cockpit Direction</h1>
          <p className="text-slate-500 mt-1">
            Espace prive (proprietaire uniquement). Gerez les vrais prix et consultez votre vraie rentabilite, sans rien changer pour votre equipe.
          </p>
        </header>

        <div className="border border-indigo-100 bg-white rounded-2xl p-6">
          <h2 className="text-sm font-bold text-indigo-800 mb-4 uppercase tracking-widest">
            Rentabilite operationnelle du mois &mdash; affiche vs reel
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] text-slate-500 m-0">CA affiche</p>
              <p className="text-xl font-semibold mt-0.5">{eur(caAff)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] text-slate-500 m-0">CA reel</p>
              <p className="text-xl font-semibold mt-0.5 text-indigo-700">{eur(caReel)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] text-slate-500 m-0">Marge affichee</p>
              <p className={"text-xl font-semibold mt-0.5 " + (margeAff >= 0 ? "text-green-600" : "text-red-600")}>{eur(margeAff)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[11px] text-slate-500 m-0">Marge reelle</p>
              <p className={"text-xl font-semibold mt-0.5 " + (margeReel >= 0 ? "text-green-600" : "text-red-600")}>{eur(margeReel)}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">
            Ecart marge (reel - affiche) : <b className="text-indigo-700">{eur(ecart)}</b> sur le mois en cours.
            Lecture seule &mdash; aucune donnee n&apos;est modifiee, votre equipe continue de voir les prix affiches.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-widest">Vrais prix par client (prives)</h2>
          <DirectionRealPrices clients={JSON.parse(JSON.stringify(clients))} realRates={realRates} />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700 mb-1 uppercase tracking-widest">Prix affiches &amp; couts (comme dans Parametres)</h2>
          <ClientRateCardsManager clients={JSON.parse(JSON.stringify(clients))} />
          <SettingsForms initialSettings={org?.settings_json} />
        </div>
      </div>
    </div>
  );
}
