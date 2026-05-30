import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { isSectionBlocked } from "@/lib/access";
import { LockedFeatureScreen } from "@/components/plans/LockedFeatureScreen";
import { resolvePortalAlert, clearPortalAlerts } from "@/lib/actions";
import { AlertTriangle, PackageX, Radio, CheckCircle2, Clock } from "lucide-react";
import { AutoRefresh } from "@/components/tracking/AutoRefresh";

export const dynamic = "force-dynamic";

const fmt = (ts: string) => {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  } catch { return ""; }
};

export default async function TrackingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organization_id) redirect("/login");

  const masterOrg = await prisma.organization.findFirst({ orderBy: { created_at: "asc" }, select: { id: true } });
  if (masterOrg?.id !== session.user.organization_id) {
    return <LockedFeatureScreen title="Interface réservée" message="Le Suivi Livraisons est une interface interne, réservée à votre société." />;
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organization_id },
    select: { settings_json: true },
  });
  const settings: any = (org?.settings_json as any) || {};
  const alerts: any[] = Array.isArray(settings.portal_alerts) ? settings.portal_alerts : [];
  const active = alerts.filter((a) => a.status !== "resolved");
  const resolved = alerts.filter((a) => a.status === "resolved").slice(0, 20);
  const highCount = active.filter((a) => a.severity === "high").length;

  const sev = (s: string) =>
    s === "high"
      ? { ring: "border-rose-200 bg-rose-50", chip: "bg-rose-100 text-rose-700", icon: <PackageX className="w-4 h-4 text-rose-500" />, label: "Critique" }
      : s === "warning"
      ? { ring: "border-amber-200 bg-amber-50", chip: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: "Attention" }
      : { ring: "border-slate-200 bg-white", chip: "bg-slate-100 text-slate-600", icon: <Radio className="w-4 h-4 text-slate-400" />, label: "Info" };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <Radio className="w-7 h-7 text-indigo-500" /> Suivi Livraisons
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Alertes en temps réel des portails Colis Privé &amp; GoFo : colis avisé, non livré, échec ou non attribué.
        </p>
        <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
          <AutoRefresh seconds={60} />
          {alerts.length > 0 && (
            <form action={clearPortalAlerts}>
              <button type="submit" className="text-xs font-semibold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-300 bg-white rounded-lg px-3 py-1.5 transition-colors">
                Vider les alertes
              </button>
            </form>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Alertes actives</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{active.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Dont critiques</div>
          <div className="text-3xl font-black text-rose-600 mt-1">{highCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Résolues (récent)</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{resolved.length}</div>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Aucune alerte active</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Tout est sous contrôle. Si vous venez d'activer le suivi, lancez l'agent PGM sur votre poste
            (<code className="text-indigo-600">npm start</code>) pour commencer à recevoir les alertes ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((a) => {
            const st = sev(a.severity);
            return (
              <div key={a.id} className={`border rounded-2xl p-4 flex items-start gap-4 ${st.ring}`}>
                <div className="mt-0.5">{st.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${st.chip}`}>{st.label}</span>
                    <span className="text-[11px] font-semibold text-indigo-600">{a.portal}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(a.ts)}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1.5">{a.title}</h4>
                  <p className="text-sm text-slate-600 mt-0.5">{a.message}</p>
                </div>
                <form action={resolvePortalAlert.bind(null, a.id)}>
                  <button type="submit" className="shrink-0 text-xs font-semibold text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 bg-white rounded-lg px-3 py-2 transition-colors">
                    Marquer résolu
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500 select-none">Alertes résolues récentes ({resolved.length})</summary>
          <div className="mt-3 space-y-2">
            {resolved.map((a) => (
              <div key={a.id} className="border border-slate-100 bg-slate-50 rounded-xl p-3 flex items-center gap-3 opacity-75">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs text-slate-500">{a.portal}</span>
                <span className="text-sm text-slate-700 font-medium truncate">{a.title}</span>
                <span className="text-[11px] text-slate-400 ml-auto">{fmt(a.ts)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
