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

/**
 * Helper performant pour recalculer les montants d'une DailyRun
 */
async function calculateRunFreshValues(run: any) {
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
  const startOfDay = new Date(run.date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(run.date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  // Check if it was the first run of the day for this driver/vehicle
  const priorDriverRuns = await prisma.dailyRun.count({
    where: { driver_id: run.driver_id, date: { gte: startOfDay, lte: endOfDay }, status: 'completed', created_at: { lt: run.created_at } }
  });
  const new_cost_driver = priorDriverRuns > 0 ? 0 : Number(run.driver?.daily_base_cost || 0);

  const priorVehicleRuns = await prisma.dailyRun.count({
    where: { vehicle_id: run.vehicle_id, date: { gte: startOfDay, lte: endOfDay }, status: 'completed', created_at: { lt: run.created_at } }
  });
  const base_fleet_cost = priorVehicleRuns > 0 ? 0 : (Number(run.vehicle?.fixed_monthly_cost || 0) + Number(run.vehicle?.rental_monthly_cost || 0) + Number(run.vehicle?.insurance_monthly_cost || 0)) / 25.33;
  
  const km_diff = Number(run.km_total || 0);
  const variable_fleet_cost = km_diff * Number(run.vehicle?.internal_cost_per_km || 0);

  let penalty_cost = 0;
  if (run.vehicle?.ownership_type === 'rented' && run.vehicle?.monthly_km_limit && run.vehicle.monthly_km_limit > 0) {
      const limit = Number(run.vehicle.monthly_km_limit);
      const extraCost = Number(run.vehicle.extra_km_cost || 0.18);
      const monthStart = new Date(run.date.getFullYear(), run.date.getMonth(), 1);
      const priorRunsThisMonth = await prisma.dailyRun.findMany({
          where: { vehicle_id: run.vehicle_id, date: { gte: monthStart, lt: run.date }, status: 'completed' },
          select: { km_total: true }
      });
      const previousTotal = priorRunsThisMonth.reduce((sum: number, r: any) => sum + Number(r.km_total || 0), 0);
      
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
 * Recalcule virtuellement la marge pour une période donnée.
 */
export async function simulateRetroactiveCosts(
  startDateStr: string,
  endDateStr: string,
  filters?: { driver_id?: string; vehicle_id?: string; client_id?: string }
): Promise<{ success: boolean; data?: SimulationSummary; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
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

    const results: SimulationResult[] = [];
    let total_old_margin = 0;
    let total_new_margin = 0;

    for (const run of runs) {
      const { new_revenue, new_cost_driver, new_cost_vehicle } = await calculateRunFreshValues(run);
      const cost_fuel = Number(run.cost_fuel || 0);

      const new_margin = new_revenue - new_cost_driver - new_cost_vehicle - cost_fuel;
      const old_margin = Number(run.margin_net || 0);
      
      const old_revenue = Number(run.revenue_calculated || 0);
      const old_cost_driver = Number(run.cost_driver || 0);
      const old_cost_vehicle = Number(run.cost_vehicle || 0);

      // Only add if there is a semantic difference (to avoid noise)
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

/**
 * Applique définitivement la recalculation en BDD
 */
export async function applyRetroactiveCosts(
  startDateStr: string,
  endDateStr: string,
  filters?: { driver_id?: string; vehicle_id?: string; client_id?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
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

    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const run of runs) {
        const { new_revenue, new_cost_driver, new_cost_vehicle } = await calculateRunFreshValues(run);
        const cost_fuel = Number(run.cost_fuel || 0);

        const new_margin = new_revenue - new_cost_driver - new_cost_vehicle - cost_fuel;
        const old_margin = Number(run.margin_net || 0);

        if (Math.abs(new_margin - old_margin) > 0.01) {
          // 1. Update DailyRun
          await tx.dailyRun.update({
            where: { id: run.id },
            data: {
              revenue_calculated: new_revenue,
              cost_driver: new_cost_driver,
              cost_vehicle: new_cost_vehicle,
              margin_net: new_margin
            }
          });

          // 2. Update Ledger Entries (FinancialEntry)
          // a. Revenue
          const revenueEntry = await tx.financialEntry.findFirst({
            where: { run_id: run.id, category: 'delivery_revenue', entry_type: 'revenue' }
          });
          if (revenueEntry) {
            await tx.financialEntry.update({ where: { id: revenueEntry.id }, data: { amount: new_revenue } });
          } else if (new_revenue > 0) {
            await tx.financialEntry.create({
              data: {
                organization_id: orgId, run_id: run.id, entry_type: 'revenue', category: 'delivery_revenue',
                amount: new_revenue, entry_date: run.date, description: `Chiffre d'Affaires Rétroactif - Tournée ${run.id}`
              }
            });
          }

          // b. Driver Cost
          const driverCostEntry = await tx.financialEntry.findFirst({
            where: { run_id: run.id, category: 'driver_cost', entry_type: 'cost' }
          });
          if (driverCostEntry) {
            if (new_cost_driver > 0) await tx.financialEntry.update({ where: { id: driverCostEntry.id }, data: { amount: new_cost_driver } });
            else await tx.financialEntry.delete({ where: { id: driverCostEntry.id } }); // Driver payload can be 0 if amortized
          } else if (new_cost_driver > 0) {
             await tx.financialEntry.create({
              data: {
                organization_id: orgId, run_id: run.id, driver_id: run.driver_id, entry_type: 'cost', category: 'driver_cost',
                amount: new_cost_driver, entry_date: run.date, description: `Coût Chauffeur Rétroactif - Tournée ${run.id}`
              }
            });
          }

          // c. Vehicle Cost
          const vehicleCostEntry = await tx.financialEntry.findFirst({
            where: { run_id: run.id, category: 'vehicle_wear_cost', entry_type: 'cost' }
          });
          if (vehicleCostEntry) {
            if (new_cost_vehicle > 0) await tx.financialEntry.update({ where: { id: vehicleCostEntry.id }, data: { amount: new_cost_vehicle } });
            else await tx.financialEntry.delete({ where: { id: vehicleCostEntry.id } });
          } else if (new_cost_vehicle > 0) {
             await tx.financialEntry.create({
              data: {
                organization_id: orgId, run_id: run.id, vehicle_id: run.vehicle_id, entry_type: 'cost', category: 'vehicle_wear_cost',
                amount: new_cost_vehicle, entry_date: run.date, description: `Coût Véhicule Rétroactif - Tournée ${run.id}`
              }
            });
          }

          updatedCount++;
        }
      }
    });

    revalidatePath("/dispatch/dashboard");
    revalidatePath("/dispatch/runs");
    return { success: true, message: `Historique mis à jour avec succès. ${updatedCount} tournées affectées.` };
  } catch (error: any) {
    console.error("applyRetroactiveCosts error:", error);
    return { success: false, error: error.message };
  }
}
