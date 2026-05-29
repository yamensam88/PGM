import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSectionBlocked } from "@/lib/access";
import { LockedFeatureScreen } from "@/components/plans/LockedFeatureScreen";
import { DispatchDashboard } from "@/app/dispatch/dashboard/page";
import { DirectionRealPrices } from "@/components/finances/DirectionRealPrices";
import { DirectionRealCosts } from "@/components/finances/DirectionRealCosts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DirectionCockpitPage(props: {
  searchParams: Promise<{ filter?: string; from?: string; to?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organization_id) redirect("/login");
  if ((session.user as any).role !== "owner") redirect("/dispatch/dashboard");

  const orgId = session.user.organization_id;

  if (await isSectionBlocked("margin_diagnostic")) {
    return <LockedFeatureScreen />;
  }
  const [clients, org] = await Promise.all([
    prisma.client.findMany({ where: { organization_id: orgId }, include: { rate_cards: true }, orderBy: { name: "asc" } }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { settings_json: true } }),
  ]);
  const allSettings: any = (org?.settings_json as any) || {};
  const realRates: Record<string, any> = allSettings.real_rates || {};
  const realCosts: any = allSettings.real_costs || null;

  return (
    <div>
      <div className="bg-indigo-900 text-white px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <span className="text-sm font-bold uppercase tracking-widest">Cockpit Direction &mdash; vrais chiffres</span>
        <span className="text-xs text-indigo-200">Espace prive (proprietaire). Le tableau de bord ci-dessous est calcule avec vos VRAIS prix &mdash; rien n&apos;est modifie pour l&apos;equipe.</span>
      </div>

      <details className="max-w-6xl mx-auto px-4 md:px-8 mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-indigo-700 py-2 select-none">
          Configurer les vrais prix par client (prives)
        </summary>
        <div className="mt-3 mb-4">
          <DirectionRealPrices clients={JSON.parse(JSON.stringify(clients))} realRates={realRates} />
          <div className="mt-4">
            <DirectionRealCosts settings={allSettings} realCosts={realCosts} />
          </div>
        </div>
      </details>

      <DispatchDashboard searchParams={props.searchParams} priceMode="real" />
    </div>
  );
}
