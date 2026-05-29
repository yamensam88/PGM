import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RetroactiveSimulationForm } from "@/components/finances/RetroactiveSimulationForm";
import { RetroToolsTabs } from "@/components/finances/RetroToolsTabs";
import type { SimulatorDefaults } from "@/components/finances/ContractSimulator";
import { orgCan } from "@/lib/plans";

const WD = 25.33;
const num = (v: any): number => {
  const x = Number(v);
  return isFinite(x) ? x : 0;
};
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export default async function RetroactivePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role === "driver") {
    redirect("/driver");
  }

  const orgId = (session.user as any).organization_id as string;

  let defaults: SimulatorDefaults = {
    chauffeurJour: 118, vehiculeJour: 35, gasoilKm: 0.23, usureKm: 0.1, joursMois: WD, parc: 14,
    fSal: 10000, fLoy: 5000, fVadm: 2000, fAss: 200, fLog: 350, fHon: 400, fAut: 500,
  };

  let canRetro = true;

  try {
    const [drivers, vehicles, org] = await Promise.all([
      prisma.driver.findMany({ where: { organization_id: orgId, status: "active" }, select: { daily_base_cost: true, hourly_cost: true } }),
      prisma.vehicle.findMany({ where: { organization_id: orgId, status: "active" }, select: { fixed_monthly_cost: true, rental_monthly_cost: true, insurance_monthly_cost: true, internal_cost_per_km: true } }),
      prisma.organization.findUnique({ where: { id: orgId }, select: { settings_json: true, subscription_plan: true, subscription_status: true } }),
    ]);

    canRetro = orgCan(org, "retroactive");

    const dCosts = drivers.map((d) => (d.hourly_cost ? num(d.hourly_cost) / WD : num(d.daily_base_cost))).filter((x) => x > 0);
    const vCosts = vehicles.map((v) => (num(v.fixed_monthly_cost) + num(v.rental_monthly_cost) + num(v.insurance_monthly_cost)) / WD).filter((x) => x > 0);
    const uCosts = vehicles.map((v) => num(v.internal_cost_per_km)).filter((x) => x > 0);
    const st: any = (org?.settings_json as any) || {};
    const r2 = (x: number) => Math.round(x * 100) / 100;

    defaults = {
      chauffeurJour: dCosts.length ? Math.round(avg(dCosts)) : 118,
      vehiculeJour: vCosts.length ? Math.round(avg(vCosts)) : 35,
      gasoilKm: st.fuel_price_per_km != null ? num(st.fuel_price_per_km) : 0.23,
      usureKm: uCosts.length ? r2(avg(uCosts)) : 0.1,
      joursMois: WD,
      parc: vehicles.length || 14,
      fSal: st.cost_office_salaries != null ? num(st.cost_office_salaries) : 10000,
      fLoy: st.cost_rent != null ? num(st.cost_rent) : 5000,
      fVadm: st.cost_admin_vehicles != null ? num(st.cost_admin_vehicles) : 2000,
      fAss: st.cost_insurances != null ? num(st.cost_insurances) : 200,
      fLog: st.cost_software != null ? num(st.cost_software) : 350,
      fHon: st.cost_fees != null ? num(st.cost_fees) : 400,
      fAut: st.cost_others != null ? num(st.cost_others) : 500,
    };
  } catch {
    /* en cas d'erreur DB, on garde les valeurs par defaut */
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-24 h-screen">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 relative">
        <div className="flex justify-between items-end mb-8 relative">
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              Simulateur &amp; Reprise
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
              Simulez la rentabilite d&apos;un contrat avant de signer, ou appliquez retroactivement de nouvelles conditions a vos tournees passees.
            </p>
          </div>
        </div>

        <RetroToolsTabs defaults={defaults} canRetro={canRetro}>
          <div className="grid grid-cols-1 gap-6">
            <div className="col-span-1 border border-indigo-100 bg-indigo-50/50 p-6 rounded-2xl">
              <h2 className="text-sm font-bold text-indigo-800 mb-2 uppercase tracking-widest">Comment ca marche ?</h2>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Cet outil recupere vos tarifs <strong>actuels</strong> (loyer mensuel d&apos;un vehicule, salaire de base d&apos;un chauffeur, etc.) et les applique aux tournees cloturees durant la periode selectionnee.
                <br />
                <br />
                Utilisez d&apos;abord la <strong className="font-semibold">Simulation</strong> pour verifier l&apos;impact avant l&apos;application definitive.
              </p>
            </div>
            <RetroactiveSimulationForm />
          </div>
        </RetroToolsTabs>
      </div>
    </div>
  );
}
