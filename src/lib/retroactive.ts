"use server"

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface SimulationResult {
  run_id: string;
  date: Date;
  driver_name: string;
  vehicle_plate: string;
  old_revenue: number;
  new_revenue: number;
  old_cost_driver: number;
  new_cost_driver: number;
  old_cost_vehicle: number;
  new_cost_vehicle: number;
  old_margin: number;
  new_margin: number;
  delta: number;
}

export interface SimulationSummary {
  total_runs_affected: number;
  total_old_margin: number;
  total_new_margin: number;
  total_delta: number;
  results: SimulationResult[];
}

interface RunContext {
  firstRunDriverSet: Set<string>;
  firstRunVehicleSet: Set<string>;
  vehicleCumulativeKm: Map<string, number>;
}

/**
 * Helper ultra-performant, 100% en mmoire (0 requte DB)
 */
function calculateRunFreshValues(run: any, context: RunContext) {
  // 1. Calculate new Revenue
  let rateCard = run.rate_card;
  if (!rateCard && run.client?.rate_cards?.length) {
    rateCard = run.client.rate_cards[0];
  }

  const base_flat = Number(rateCard?.base_daily_flat || 0);
  const price_stop = Number(rateCard?.unit_price_stop || 0);
  const price_parcel = Number(rateCard?.unit_price_package || 0);
  const bonus_relay = Number(rateCard?.bonus_relay_point || 0);

  const colis_collected = Number(run.stops_completed || 0);
  const packages_delivered = Number(run.packages_delivered || 0);
  const packages_relay = Number(run.packages_relay || 0);
  
  const relay_delivered = Math.min(packages_delivered, packages_relay);
  const direct_delivered = Math.max(0, packages_delivered - relay_delivered);

  const new_revenue = base_flat + (price_stop * colis_collected) + (price_parcel * direct_delivered) + (bonus_relay * relay_delivered);

  // 2. Calculate new Costs
  const isFirstDriverRun = context.firstRunDriverSet.has(run.id);
  const new_cost_driver = !isFirstDriverRun ? 0 : Number(run.driver?.daily_base_cost || 0);

  const isFirstVehicleRun = context.firstRunVehicleSet.has(run.id);
  const base_fleet_cost = !isFirstVehicleRun ? 0 : (Number(run.vehicle?.fixed_monthly_cost || 0) + Number(run.vehicle?.rental_monthly_cost || 0) + Number(run.vehicle?.insurance_monthly_cost || 0)) / 25.33;
  
  const km_diff = Number(run.km_total || 0);
  const variable_fleet_cost = km_diff * Number(run.vehicle?.internal_cost_per_km || 0);

  let penalty_cost = 0;
  if (run.vehicle?.ownership_type === 'rented' && run.vehicle?.monthly_km_limit && run.vehicle.monthly_km_limit > 0) {
      const limit = Number(run.vehicle.monthly_km_limit);
      const extraCost = Number(run.vehicle.extra_km_cost || 0.18);
      const previousTotal = context.vehicleCumulativeKm.get(run.id) || 0;
      
      if (previousTotal >= limit) {
          penalty_cost = km_diff * extraCost;
      } else if (previousTotal + km_diff > limit) {
          penalty_cost = ((previousTotal + km_diff) - limit) * extraCost;
      }
  }

  const new_cost_vehicle = base_fleet_cost + variable_fleet_cost + penalty_cost;

  return { new_revenue, new_cost_driver, new_cost_vehicle };
}

/**
 * Construit un contexte global en 1 seule requte
 */
async function buildRunContext(orgId: string, startDate: Date, endDate: Date): Promise<RunContext> {
  // on redescend au 1er du mois de la slection pour avoir l'historique kilomtrique exact
  const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  const allRuns = await prisma.dailyRun.findMany({
    where: { organization_id: orgId, date: { gte: startOfMonth, lte: endDate }, status: 'completed' },
    select: { id: true, driver_id: true, vehicle_id: true, date: true, created_at: true, km_total: true },
    orderBy: { created_at: 'asc' }
  });

  const firstRunDriverSet = new Set<string>();
  const firstRunVehicleSet = new Set<string>();
  const seenDriverDate = new Set<string>();
  const seenVehicleDate = new Set<string>();
  
  const vehicleCumulativeKm = new Map<string, number>();
  const vehicleRunningTotal = new Map<string, number>();

  for (const r of allRuns) {
    const dStr = r.date.toISOString().split('T')[0];
    
    // Driver First Run
    const dKey = `${r.driver_id}_${dStr}`;
    if (!seenDriverDate.has(dKey)) {
      seenDriverDate.add(dKey);
      firstRunDriverSet.add(r.id);
    }

    // Vehicle First Run
    const vKey = `${r.vehicle_id}_${dStr}`;
    if (!seenVehicleDate.has(vKey)) {
      seenVehicleDate.add(vKey);
      firstRunVehicleSet.add(r.id);
    }

    // Vehicle KM Total Reset per month
    const mStr = dStr.substring(0, 7); // YYYY-MM
    const vmKey = `${r.vehicle_id}_${mStr}`;
    const currentTotal = vehicleRunningTotal.get(vmKey) || 0;
    
    vehicleCumulativeKm.set(r.id, currentTotal);
    vehicleRunningTotal.set(vmKey, currentTotal + Number(r.km_total || 0));
  }

  return { firstRunDriverSet, firstRunVehicleSet, vehicleCumulativeKm };
}

export async function simulateRetroactiveCosts(
  startDateStr: string,
  endDateStr: string,
  filters?: { driver_id?: string; vehicle_id?: string; client_id?: string }
): Promise<{ success: boolean; data?: SimulationSummary; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autoris.");
    const orgId = session.user.organization_id;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    const whereClause: any = {
      organization_id: orgId,
      date: { gte: startDate, lte: endDate },
      status: "completed"
    };

    if (filters?.driver_id && filters.driver_id !== "all") whereClause.driver_id = filters.driver_id;
    if (filters?.vehicle_id && filters.vehicle_id !== "all") whereClause.vehicle_id = filters.vehicle_id;
    if (filters?.client_id && filters.client_id !== "all") whereClause.client_id = filters.client_id;

    // 1. Rcuprer la cible (Dtaill avec relations)
    const runs = await prisma.dailyRun.findMany({
      where: whereClause,
      include: {
        driver: true,
        vehicle: true,
        client: { include: { rate_cards: true } },
        rate_card: true,
      },
      orderBy: { date: 'asc' }
    });

    // 2. Pr-calculer le contexte en 1 grosse requte lgre
    const context = await buildRunContext(orgId, startDate, endDate);

    const results: SimulationResult[] = [];
    let total_old_margin = 0;
    let total_new_margin = 0;

    // 3. Calcul pur 100% RAM, super rapide, 0 Timeout DB.
    for (const run of runs) {
      const { new_revenue, new_cost_driver, new_cost_vehicle } = calculateRunFreshValues(run, context);
      const cost_fuel = Number(run.cost_fuel || 0);

      const new_margin = new_revenue - new_cost_driver - new_cost_vehicle - cost_fuel;
      const old_margin = Number(run.margin_net || 0);
      
      const old_revenue = Number(run.revenue_calculated || 0);
      const old_cost_driver = Number(run.cost_driver || 0);
      const old_cost_vehicle = Number(run.cost_vehicle || 0);

      if (Math.abs(new_margin - old_margin) > 0.01) {
        results.push({
          run_id: run.id,
          date: run.date,
          driver_name: `${run.driver?.first_name} ${run.driver?.last_name}`,
          vehicle_plate: run.vehicle?.plate_number || 'Inconnu',
          old_revenue, new_revenue,
          old_cost_driver, new_cost_driver,
          old_cost_vehicle, new_cost_vehicle,
          old_margin, new_margin,
          delta: new_margin - old_margin
        });
        total_old_margin += old_margin;
        total_new_margin += new_margin;
      }
    }

    return {
      success: true,
      data: {
        total_runs_affected: results.length,
        total_old_margin,
        total_new_margin,
        total_delta: total_new_margin - total_old_margin,
        results
      }
    };

  } catch (error: any) {
    console.error("simulateRetroactiveCosts error:", error);
    return { success: false, error: error.message };
  }
}

export async function applyRetroactiveCosts(
  startDateStr: string,
  endDateStr: string,
  filters?: { driver_id?: string; vehicle_id?: string; client_id?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autoris.");
    const orgId = session.user.organization_id;

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setUTCHours(23, 59, 59, 999);

    const whereClause: any = {
      organization_id: orgId,
      date: { gte: startDate, lte: endDate },
      status: "completed"
    };

    if (filters?.driver_id && filters.driver_id !== "all") whereClause.driver_id = filters.driver_id;
    if (filters?.vehicle_id && filters.vehicle_id !== "all") whereClause.vehicle_id = filters.vehicle_id;
    if (filters?.client_id && filters.client_id !== "all") whereClause.client_id = filters.client_id;

    // 1. Load targets
    const runs = await prisma.dailyRun.findMany({
      where: whereClause,
      include: {
        driver: true,
        vehicle: true,
        client: { include: { rate_cards: true } },
        rate_card: true,
        financial_entries: true // Include this to prevent inside-transaction finds!
      },
      orderBy: { date: 'asc' }
    });

    // 2. Pre-calculate the context completely in memory 
    const context = await buildRunContext(orgId, startDate, endDate);

    const modifications: any[] = [];

    // 3. Calculate all modifications outside the transaction and prepare a flat list
    for (const run of runs) {
      const { new_revenue, new_cost_driver, new_cost_vehicle } = calculateRunFreshValues(run, context);
      const cost_fuel = Number(run.cost_fuel || 0);

      const new_margin = new_revenue - new_cost_driver - new_cost_vehicle - cost_fuel;
      const old_margin = Number(run.margin_net || 0);

      if (Math.abs(new_margin - old_margin) > 0.01) {
          
        let revEntry = run.financial_entries.find((e: any) => e.category === 'delivery_revenue' && e.entry_type === 'revenue');
        let drvEntry = run.financial_entries.find((e: any) => e.category === 'driver_cost' && e.entry_type === 'cost');
        let vehEntry = run.financial_entries.find((e: any) => e.category === 'vehicle_wear_cost' && e.entry_type === 'cost');

        modifications.push({
            run, new_revenue, new_cost_driver, new_cost_vehicle, new_margin,
            revEntry, drvEntry, vehEntry
        });
      }
    }

    // 4. Ultra-fast transaction that does ZERO findFirst, only purely targeted Updates/Creations.
    await prisma.$transaction(async (tx) => {
      for (const mod of modifications) {
          // A. Update Run
          await tx.dailyRun.update({
            where: { id: mod.run.id },
            data: {
              revenue_calculated: mod.new_revenue,
              cost_driver: mod.new_cost_driver,
              cost_vehicle: mod.new_cost_vehicle,
              margin_net: mod.new_margin
            }
          });

          // B. Update Revenue Entry
          if (mod.revEntry) {
              await tx.financialEntry.update({ where: { id: mod.revEntry.id }, data: { amount: mod.new_revenue } });
          } else if (mod.new_revenue > 0) {
              await tx.financialEntry.create({ data: { organization_id: orgId, run_id: mod.run.id, entry_type: 'revenue', category: 'delivery_revenue', amount: mod.new_revenue, entry_date: mod.run.date, description: `Chiffre d'Affaires Rétroactif - Tournée ${mod.run.id}` }});
          }

          // C. Update Driver Entry
          if (mod.drvEntry) {
              if (mod.new_cost_driver > 0) await tx.financialEntry.update({ where: { id: mod.drvEntry.id }, data: { amount: mod.new_cost_driver } });
              else await tx.financialEntry.delete({ where: { id: mod.drvEntry.id } }); 
          } else if (mod.new_cost_driver > 0) {
              await tx.financialEntry.create({ data: { organization_id: orgId, run_id: mod.run.id, driver_id: mod.run.driver_id, entry_type: 'cost', category: 'driver_cost', amount: mod.new_cost_driver, entry_date: mod.run.date, description: `Coût Chauffeur Rétroactif - Tournée ${mod.run.id}` }});
          }

          // D. Update Vehicle Entry
          if (mod.vehEntry) {
              if (mod.new_cost_vehicle > 0) await tx.financialEntry.update({ where: { id: mod.vehEntry.id }, data: { amount: mod.new_cost_vehicle } });
              else await tx.financialEntry.delete({ where: { id: mod.vehEntry.id } });
          } else if (mod.new_cost_vehicle > 0) {
              await tx.financialEntry.create({ data: { organization_id: orgId, run_id: mod.run.id, vehicle_id: mod.run.vehicle_id, entry_type: 'cost', category: 'vehicle_wear_cost', amount: mod.new_cost_vehicle, entry_date: mod.run.date, description: `Coût Véhicule Rétroactif - Tournée ${mod.run.id}` }});
          }
      }
    }, {
      maxWait: 15000, 
      timeout: 120000 
    });

    revalidatePath("/dispatch/dashboard");
    revalidatePath("/dispatch/runs");
    return { success: true, message: `Historique mis à jour avec succès. ${modifications.length} tournées affectées.` };
  } catch (error: any) {
    console.error("applyRetroactiveCosts error:", error);
    return { success: false, error: error.message };
  }
}
