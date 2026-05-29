"use server"

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { computeRunFinancials, type RunFinancialContext } from "@/lib/finance";
import { requireFeature } from "@/lib/authz";

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
 * Construit le contexte (1re tournée du jour par chauffeur/véhicule + km cumulés
 * du véhicule sur le mois civil AVANT chaque tournée) en une seule requête légère.
 * On redescend au 1er du mois de la sélection pour obtenir l'historique km exact.
 */
async function buildRunContext(orgId: string, startDate: Date, endDate: Date): Promise<RunContext> {
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

    // Première tournée du jour pour le chauffeur
    const dKey = `${r.driver_id}_${dStr}`;
    if (!seenDriverDate.has(dKey)) {
      seenDriverDate.add(dKey);
      firstRunDriverSet.add(r.id);
    }

    // Première tournée du jour pour le véhicule
    const vKey = `${r.vehicle_id}_${dStr}`;
    if (!seenVehicleDate.has(vKey)) {
      seenVehicleDate.add(vKey);
      firstRunVehicleSet.add(r.id);
    }

    // Cumul km du véhicule, remis à zéro chaque mois civil
    const mStr = dStr.substring(0, 7); // YYYY-MM
    const vmKey = `${r.vehicle_id}_${mStr}`;
    const currentTotal = vehicleRunningTotal.get(vmKey) || 0;

    vehicleCumulativeKm.set(r.id, currentTotal); // km AVANT cette tournée
    vehicleRunningTotal.set(vmKey, currentTotal + Number(r.km_total || 0));
  }

  return { firstRunDriverSet, firstRunVehicleSet, vehicleCumulativeKm };
}

/** Construit le contexte d'une tournée donnée à partir du contexte global. */
function contextForRun(run: any, ctx: RunContext): RunFinancialContext {
  return {
    isFirstDriverRunOfDay: ctx.firstRunDriverSet.has(run.id),
    isFirstVehicleRunOfDay: ctx.firstRunVehicleSet.has(run.id),
    vehicleKmBeforeThisRun: ctx.vehicleCumulativeKm.get(run.id) || 0,
  };
}

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

    // 1. Cibles détaillées (avec relations)
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

    // 2. Contexte global (1 requête légère sur tout le mois)
    const context = await buildRunContext(orgId, startDate, endDate);

    const results: SimulationResult[] = [];
    let total_old_margin = 0;
    let total_new_margin = 0;

    // 3. Calcul 100% mémoire via la fonction de calcul UNIQUE (identique au live).
    for (const run of runs) {
      const f = computeRunFinancials(run, contextForRun(run, context));

      const old_margin = Number(run.margin_net || 0);
      const old_revenue = Number(run.revenue_calculated || 0);
      const old_cost_driver = Number(run.cost_driver || 0);
      const old_cost_vehicle = Number(run.cost_vehicle || 0);

      if (Math.abs(f.marginNet - old_margin) > 0.01) {
        results.push({
          run_id: run.id,
          date: run.date,
          driver_name: `${run.driver?.first_name ?? ''} ${run.driver?.last_name ?? ''}`.trim(),
          vehicle_plate: run.vehicle?.plate_number || 'Inconnu',
          old_revenue, new_revenue: f.revenue,
          old_cost_driver, new_cost_driver: f.costDriver,
          old_cost_vehicle, new_cost_vehicle: f.costVehicle,
          old_margin, new_margin: f.marginNet,
          delta: f.marginNet - old_margin
        });
        total_old_margin += old_margin;
        total_new_margin += f.marginNet;
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
    await requireFeature("retroactive");
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

    // 1. Charger les cibles (avec les écritures existantes pour éviter des reads dans la transaction)
    const runs = await prisma.dailyRun.findMany({
      where: whereClause,
      include: {
        driver: true,
        vehicle: true,
        client: { include: { rate_cards: true } },
        rate_card: true,
        financial_entries: true
      },
      orderBy: { date: 'asc' }
    });

    // 2. Contexte global en mémoire
    const context = await buildRunContext(orgId, startDate, endDate);

    const modifications: any[] = [];

    // 3. Calculer toutes les modifications hors transaction (fonction de calcul UNIQUE)
    for (const run of runs) {
      const f = computeRunFinancials(run, contextForRun(run, context));
      const old_margin = Number(run.margin_net || 0);

      if (Math.abs(f.marginNet - old_margin) > 0.01) {
        const revEntry = run.financial_entries.find((e: any) => e.category === 'delivery_revenue' && e.entry_type === 'revenue');
        const drvEntry = run.financial_entries.find((e: any) => e.category === 'driver_cost' && e.entry_type === 'cost');
        const vehEntry = run.financial_entries.find((e: any) => e.category === 'vehicle_wear_cost' && e.entry_type === 'cost');

        modifications.push({ run, f, revEntry, drvEntry, vehEntry });
      }
    }

    // 4. Transaction par lot (Prisma Batch API, pas d'aller-retours séquentiels)
    const txPromises: any[] = [];

    for (const mod of modifications) {
      const { run, f } = mod;
      const runLabel = run.run_code || run.id;

      // A. Mise à jour de la tournée
      txPromises.push(prisma.dailyRun.update({
        where: { id: run.id },
        data: {
          revenue_calculated: f.revenue,
          cost_driver: f.costDriver,
          cost_vehicle: f.costVehicle,
          margin_net: f.marginNet
        }
      }));

      // B. Écriture Chiffre d'affaires
      if (mod.revEntry) {
        txPromises.push(prisma.financialEntry.update({ where: { id: mod.revEntry.id }, data: { amount: f.revenue, entry_date: run.date } }));
      } else if (f.revenue > 0) {
        txPromises.push(prisma.financialEntry.create({ data: { organization_id: orgId, run_id: run.id, client_id: run.client_id, vehicle_id: run.vehicle_id, driver_id: run.driver_id, entry_type: 'revenue', category: 'delivery_revenue', amount: f.revenue, entry_date: run.date, description: `Chiffre d'Affaires (rétroactif) - Tournée ${runLabel}` } }));
      }

      // C. Écriture Coût chauffeur
      if (mod.drvEntry) {
        if (f.costDriver > 0) txPromises.push(prisma.financialEntry.update({ where: { id: mod.drvEntry.id }, data: { amount: f.costDriver, entry_date: run.date } }));
        else txPromises.push(prisma.financialEntry.delete({ where: { id: mod.drvEntry.id } }));
      } else if (f.costDriver > 0) {
        txPromises.push(prisma.financialEntry.create({ data: { organization_id: orgId, run_id: run.id, driver_id: run.driver_id, entry_type: 'cost', category: 'driver_cost', amount: f.costDriver, entry_date: run.date, description: `Coût Chauffeur (rétroactif) - Tournée ${runLabel}` } }));
      }

      // D. Écriture Coût véhicule
      if (mod.vehEntry) {
        if (f.costVehicle > 0) txPromises.push(prisma.financialEntry.update({ where: { id: mod.vehEntry.id }, data: { amount: f.costVehicle, entry_date: run.date } }));
        else txPromises.push(prisma.financialEntry.delete({ where: { id: mod.vehEntry.id } }));
      } else if (f.costVehicle > 0) {
        txPromises.push(prisma.financialEntry.create({ data: { organization_id: orgId, run_id: run.id, vehicle_id: run.vehicle_id, entry_type: 'cost', category: 'vehicle_wear_cost', amount: f.costVehicle, entry_date: run.date, description: `Coût Véhicule (rétroactif) - Tournée ${runLabel}` } }));
      }
    }

    await prisma.$transaction(txPromises);

    revalidatePath("/dispatch/dashboard");
    revalidatePath("/dispatch/runs");
    return { success: true, message: `Historique mis à jour avec succès. ${modifications.length} tournées affectées.` };
  } catch (error: any) {
    console.error("applyRetroactiveCosts error:", error);
    return { success: false, error: error.message };
  }
}
