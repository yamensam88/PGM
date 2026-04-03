import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, FileText, AlertTriangle, Lightbulb, Zap, Route, PieChart as PieChartIcon, Package, Map, ShieldAlert, Brain, CheckCircle2, Activity, TrendingDown, Car, Users, AlertCircle, Sparkles } from "lucide-react";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { PackagesChart } from "@/components/dashboard/PackagesChart";
import { CostBreakdownChart } from "@/components/dashboard/CostBreakdownChart";
import { ZoneProfitabilityChart } from "@/components/dashboard/ZoneProfitabilityChart";
import { DriverProfitabilityChart } from "@/components/dashboard/DriverProfitabilityChart";

import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { RunsTable } from "@/components/dashboard/RunsTable";
import { DriverSynthesisTable } from "@/components/dashboard/DriverSynthesisTable";
import { ZoneSynthesisTable } from "@/components/dashboard/ZoneSynthesisTable";
import { FleetRadarAlerts } from "@/components/dashboard/FleetRadarAlerts";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DispatchDashboardPage(props: { searchParams: Promise<{ filter?: string, from?: string, to?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }
  const orgId = session.user.organization_id;

  const searchParams = await props.searchParams;
  const filter = searchParams.filter;
  const fromParam = searchParams.from;
  const toParam = searchParams.to;

  // 1. Fetch organization settings for global fuel price and fixed costs
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const orgSettings = org?.settings_json as { fuel_price_per_liter?: number; monthly_total_fixed_costs?: number } | null;
  const currentFuelPrice = orgSettings?.fuel_price_per_liter || 1.80;

  // Determine today's date in Paris to align with what the user considers 'Today'
  const parisFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parisDateStr = parisFormat.format(new Date());
  
  const today = new Date(`${parisDateStr}T00:00:00.000Z`);

  let startDate = new Date(today);
  let endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  if (fromParam && toParam) {
    startDate = new Date(fromParam);
    endDate = new Date(toParam);
    endDate.setHours(23, 59, 59, 999);
  } else {
    const activeFilter = filter || 'daily';
    if (activeFilter === 'weekly') {
      startDate.setDate(today.getDate() - 6);
    } else if (activeFilter === 'monthly') {
      startDate.setDate(today.getDate() - 29);
    }
  }

  const dateDiffMs = endDate.getTime() - startDate.getTime();
  const dateDiffDays = Math.max(1, Math.ceil(dateDiffMs / (1000 * 60 * 60 * 24)));

  // 3. Fetch Runs for the period
  const rawRuns = await prisma.dailyRun.findMany({
    where: {
      organization_id: orgId,
      status: { not: 'cancelled' },
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: { 
      driver: { include: { hr_events: true } }, 
      vehicle: true, 
      client: true, 
      zone: true,
      financial_entries: true
    },
    orderBy: { date: 'asc' }
  });

  // 4a. Costs from financial entries (Interventions & Penalties)
  const interventionCostsRaw = await prisma.financialEntry.findMany({
    where: {
       organization_id: orgId,
       category: { in: ['damage_cost', 'maintenance_cost', 'penalty'] },
       entry_date: {
          gte: startDate,
          lte: endDate
       }
    },
    include: { driver: true }
  });

  // Map to track the first run of a given day for a vehicle
  const vehicleDailyAppearance: Record<string, boolean> = {};

  // Use STRICT database constants to prevent Historical Drift
  const allRuns = rawRuns.map((run) => {
    const revenue = run.revenue_calculated ? Number(run.revenue_calculated) : 0;
    const fleetCost = run.cost_vehicle ? Number(run.cost_vehicle) : 0;
    const driverCost = run.cost_driver ? Number(run.cost_driver) : 0;
    const fuelCost = run.cost_fuel ? Number(run.cost_fuel) : 0;
    const calculatedMargin = run.margin_net ? Number(run.margin_net) : (revenue - fleetCost - driverCost - fuelCost);

    const runDateStr = run.date.toISOString().split('T')[0];

    // Retroactively attach orphan financial entries
    const orphanEntries = interventionCostsRaw.filter(e => 
      e.driver_id === run.driver_id && 
      e.entry_date.toISOString().split('T')[0] === runDateStr &&
      !e.run_id
    );

    const mergedFinancialEntries = [
      ...(run.financial_entries || []),
      ...orphanEntries
    ].map(e => ({
      ...e,
      amount: Number(e.amount || 0)
    }));

    return {
      ...run,
      km_start: run.km_start ? Number(run.km_start) : null,
      km_end: run.km_end ? Number(run.km_end) : null,
      revenue_calculated: revenue,
      cost_driver: driverCost,
      cost_vehicle: fleetCost,
      cost_fuel: fuelCost,
      cost_other: run.cost_other ? Number(run.cost_other) : 0,
      total_cost: run.total_cost ? Number(run.total_cost) : 0,
      fuel_consumed_liters: run.fuel_consumed_liters ? Number(run.fuel_consumed_liters) : 0,
      margin_net: calculatedMargin, // strictly tied to Ledger boundaries
      productivity_index: run.productivity_index ? Number(run.productivity_index) : null,
      penalty_risk_score: run.penalty_risk_score ? Number(run.penalty_risk_score) : 0,
      sst_score: run.sst_score ? Number(run.sst_score) : 0,
      financial_entries: mergedFinancialEntries,
      driver: run.driver
        ? {
          ...run.driver,
          daily_base_cost: run.driver.daily_base_cost ? Number(run.driver.daily_base_cost) : 0,
          hourly_cost: run.driver.hourly_cost ? Number(run.driver.hourly_cost) : null,
          quality_rating: run.driver.quality_rating ? Number(run.driver.quality_rating) : 0,
          performance_score: run.driver.performance_score ? Number(run.driver.performance_score) : 0,
        }
        : null,
      vehicle: run.vehicle
        ? {
          ...run.vehicle,
          internal_cost_per_km: run.vehicle.internal_cost_per_km ? Number(run.vehicle.internal_cost_per_km) : 0,
          fixed_monthly_cost: run.vehicle.fixed_monthly_cost ? Number(run.vehicle.fixed_monthly_cost) : 0,
          rental_monthly_cost: run.vehicle.rental_monthly_cost ? Number(run.vehicle.rental_monthly_cost) : 0,
          insurance_monthly_cost: run.vehicle.insurance_monthly_cost ? Number(run.vehicle.insurance_monthly_cost) : 0,
        }
        : null,
      zone: run.zone
        ? {
          ...run.zone,
          difficulty_multiplier: run.zone.difficulty_multiplier ? Number(run.zone.difficulty_multiplier) : null,
        }
        : null,
    };
  });

  // 4a. Costs from financial entries (Interventions & Penalties)
  // (interventionCostsRaw has been fetched ABOVE to retro-fit runs)

  const interventionCosts = interventionCostsRaw.map(e => ({
    ...e,
    amount: Number(e.amount),
    driver: e.driver ? {
      ...e.driver,
      daily_base_cost: e.driver.daily_base_cost ? Number(e.driver.daily_base_cost) : 0,
      hourly_cost: e.driver.hourly_cost ? Number(e.driver.hourly_cost) : null,
      quality_rating: e.driver.quality_rating ? Number(e.driver.quality_rating) : 0,
      performance_score: e.driver.performance_score ? Number(e.driver.performance_score) : 0,
    } : null
  }));

  const damageCosts = interventionCosts.filter(e => e.category === 'damage_cost');
  const maintenanceCosts = interventionCosts.filter(e => e.category === 'maintenance_cost');
  const penaltyCosts = interventionCosts.filter(e => e.category === 'penalty');

  const totalDamageCost = damageCosts.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalMaintenanceCost = maintenanceCosts.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalPenaltyCost = penaltyCosts.reduce((sum, entry) => sum + Number(entry.amount), 0);

  // 4b. Fetch HR Events for the period to calculate absence costs
  const hrEvents = await prisma.hrEvent.findMany({
    where: {
      organization_id: orgId,
      start_date: { lte: endDate },
      OR: [
        { end_date: { gte: startDate } },
        { end_date: null }
      ],
      status: 'active'
    },
    include: { driver: true }
  });

  let totalAbsenceDays = 0;
  let totalAbsenceCost = 0;
  const driverAbsenceCosts: any[] = [];

  hrEvents.forEach(evt => {
    const evtStart = evt.start_date < startDate ? startDate : evt.start_date;
    const evtEnd = evt.end_date ? (evt.end_date > endDate ? endDate : evt.end_date) : endDate;
    const diffTime = evtEnd.getTime() - evtStart.getTime();
    let days = diffTime >= 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0;
    
    // CAP OVERLAP: A driver cannot be absent more days than the dashboard filter's total span
    days = Math.min(days, dateDiffDays);
    
    const explicitMonthly = evt.driver?.hourly_cost ? Number(evt.driver.hourly_cost) : (Number(evt.driver?.daily_base_cost||0) * 25.33);
    const calendarDailyCost = explicitMonthly / 30.44;

    totalAbsenceDays += days;
    if (['sick_leave', 'vacation'].includes(evt.event_type)) {
       const cost = days * calendarDailyCost;
       totalAbsenceCost += cost;
       
       if (cost > 0) {
         driverAbsenceCosts.push({
           driver_id: evt.driver_id,
           driver: evt.driver,
           amount: cost
         });
       }
    } else if (evt.event_type === 'absence') {
       const cost = days * calendarDailyCost;
       totalAbsenceCost += cost;
       
       if (cost > 0) {
         driverAbsenceCosts.push({
           driver_id: evt.driver_id,
           driver: evt.driver,
           amount: cost,
           is_unpaid: true
         });
       }
    }
  });

  // 4c. Fetch Granted Bonuses
  const grantedBonuses = await prisma.hrEvent.findMany({
    where: {
      organization_id: orgId,
      event_type: 'bonus',
      status: 'granted',
      start_date: { gte: startDate, lte: endDate }
    }
  });
  const totalBonusCost = grantedBonuses.reduce((sum, b) => sum + Number(b.notes || 0), 0);

  // 5. Aggregations (Period)
  const completedRunsBefore = allRuns.filter((r: any) => r.status === 'completed');

  const totalRevenue = completedRunsBefore.reduce((sum: number, r: any) => sum + Number(r.revenue_calculated || 0), 0);
  const totalFuelCost = completedRunsBefore.reduce((sum: number, r: any) => sum + Number(r.cost_fuel || 0), 0);
  const totalFleetCostActive = completedRunsBefore.reduce((sum: number, r: any) => sum + Number(r.cost_vehicle || 0), 0);
  const totalDriverCostActive = completedRunsBefore.reduce((sum: number, r: any) => sum + Number(r.cost_driver || 0), 0);
  const totalRunsMargin = completedRunsBefore.reduce((sum: number, r: any) => sum + Number(r.margin_net || 0), 0);

  // Calculate Global Periodic Fixed Costs (To capture Idle Costs)
  const activeVehicles = await prisma.vehicle.findMany({ where: { organization_id: orgId, status: 'active' } });
  const globalVehicleFixedParams = activeVehicles.reduce((sum, v) => sum + ((Number(v.fixed_monthly_cost||0) + Number(v.rental_monthly_cost||0) + Number(v.insurance_monthly_cost||0))/30), 0) * dateDiffDays;
  
  // The cost of idle vehicles is the global parameters minus what was already accounted for in active runs
  // Note: Since `cost_vehicle` includes variable KM cost, extracting just base_fleet_cost is mathematically tricky.
  // We approximate idle fleet cost by checking days vehicle did NOT run.
  let idleVehicleFixedCost = globalVehicleFixedParams;
  const vehicleBaseChargedDays = new Set<string>();

  allRuns.forEach(r => {
    if (r.cost_vehicle && r.cost_vehicle > 0) {
       const runDateStr = r.date.toISOString().split('T')[0];
       const key = `${r.vehicle_id}-${runDateStr}`;
       
       if (!vehicleBaseChargedDays.has(key)) {
         vehicleBaseChargedDays.add(key);
         const v = activeVehicles.find(v => v.id === r.vehicle_id);
         if (v) {
            const dailyBase = ((Number(v.fixed_monthly_cost||0) + Number(v.rental_monthly_cost||0) + Number(v.insurance_monthly_cost||0))/30);
            idleVehicleFixedCost -= dailyBase;
         }
       }
    }
  });
  idleVehicleFixedCost = Math.max(0, idleVehicleFixedCost);

  const activeDriversData = await prisma.driver.findMany({ where: { organization_id: orgId, status: 'active' } });
  const globalDriverFixedParams = activeDriversData.reduce((sum, d) => {
     const explicitMonthly = d.hourly_cost ? Number(d.hourly_cost) : (Number(d.daily_base_cost||0) * 25.33);
     return sum + (explicitMonthly / 30.44);
  }, 0) * dateDiffDays;

  const monthlyFixedCostAdmin = orgSettings?.monthly_total_fixed_costs ? Number(orgSettings.monthly_total_fixed_costs) : 0;
  const periodAdminFixedCosts = (monthlyFixedCostAdmin / 30.44) * dateDiffDays;

  const totalUnpaidSavings = driverAbsenceCosts.filter(a => a.is_unpaid).reduce((sum, a) => sum + a.amount, 0);

  const totalIdleDriverCost = Math.max(0, globalDriverFixedParams - totalDriverCostActive - totalUnpaidSavings);
  const fleetCostLedgerSafe = totalFleetCostActive; 

  const totalMargin = totalRunsMargin - periodAdminFixedCosts - totalIdleDriverCost - idleVehicleFixedCost - totalDamageCost - totalMaintenanceCost - totalBonusCost - totalPenaltyCost;
  const totalCosts = totalFleetCostActive + totalFuelCost + totalDriverCostActive + periodAdminFixedCosts + totalIdleDriverCost + idleVehicleFixedCost + totalDamageCost + totalMaintenanceCost + totalBonusCost + totalPenaltyCost;

  const completedRuns = allRuns.filter(r => r.status === 'completed');

  const totalPackages = completedRuns.reduce((sum, r) => sum + Number(r.packages_loaded || 0) + Number(r.packages_relay || 0), 0);
  const totalAdvised = completedRuns.reduce((sum, r) => sum + (Number(r.packages_advised_direct || 0) + Number(r.packages_advised_relay || 0) || Number(r.packages_advised || 0)), 0);
  const totalDelivered = completedRuns.reduce((sum, r) => sum + Number(r.packages_delivered || 0), 0);
  const totalReturned = completedRuns.reduce((sum, r) => sum + Number(r.packages_returned || 0), 0);
  const totalKm = allRuns.reduce((sum, r) => sum + Math.max(0, (r.km_end || 0) - (r.km_start || Number(r.km_end))), 0);

  const failureRate = totalPackages > 0 ? ((totalAdvised + totalReturned) / totalPackages) * 100 : 0;
  const deliveryRate = totalPackages > 0 ? ((totalDelivered / totalPackages) * 100) : 0;

  // 6. Headcount Logic (Effectifs)
  const totalActiveDrivers = await prisma.driver.count({
    where: { organization_id: orgId, status: 'active' }
  });
  // Présents: Unique ACTIVE drivers who have ANY run (planned, in_progress, completed) OR a manual 'presence' HR event during this period
  const activeDriverIds = new Set(activeDriversData.map(d => d.id));
  const runsDriversId = allRuns.filter(r => activeDriverIds.has(r.driver_id)).map(r => r.driver_id);
  const manuallyPresentDriversId = hrEvents.filter(e => e.event_type === 'presence' && activeDriverIds.has(e.driver_id)).map(e => e.driver_id);
  const presentDriversSet = new Set([...runsDriversId, ...manuallyPresentDriversId]);
  const presentDrivers = presentDriversSet.size;

  // Absents: Unique ACTIVE drivers with an HR event that is an absence type, UNLESS they are actually present on the field
  const absenceEventTypes = ['absence', 'sick_leave', 'vacation'];
  const absentDrivers = new Set(
    hrEvents.filter(e => absenceEventTypes.includes(e.event_type) && activeDriverIds.has(e.driver_id) && !presentDriversSet.has(e.driver_id))
    .map(e => e.driver_id)
  ).size;

  const idleDrivers = Math.max(0, totalActiveDrivers - presentDrivers - absentDrivers);

  const driversAtRisk = new Set(
    completedRuns.filter(r => r.penalty_risk_score !== null && r.penalty_risk_score > 50 && activeDriverIds.has(r.driver_id)).map(r => r.driver_id)
  ).size;

  const totalActiveVehiclesCount = activeVehicles.length;
  const totalMaintenanceVehiclesCount = await prisma.vehicle.count({ where: { organization_id: orgId, status: 'maintenance' } });
  const totalInactiveVehiclesCount = await prisma.vehicle.count({ where: { organization_id: orgId, status: 'inactive' } });

  const avgCaPerRun = completedRuns.length > 0 ? (totalRevenue / completedRuns.length).toFixed(2) : "0.00";
  const avgCostPerRun = completedRuns.length > 0 ? (totalCosts / completedRuns.length).toFixed(2) : "0.00";
  const avgMarginPerRun = completedRuns.length > 0 ? (totalMargin / completedRuns.length).toFixed(2) : "0.00";

  // Chart Data with mathematically strict Daily Pro-rata Overheads
  const dailyData: Record<string, { revenue: number, cost: number }> = {};
  
  const iterDate = new Date(startDate);
  while(iterDate <= endDate) {
     dailyData[iterDate.toISOString().split('T')[0]] = { revenue: 0, cost: 0 };
     iterDate.setDate(iterDate.getDate() + 1);
  }

  completedRuns.forEach(r => {
    const dStr = r.date.toISOString().split('T')[0];
    if (!dailyData[dStr]) dailyData[dStr] = { revenue: 0, cost: 0 };
    dailyData[dStr].revenue += r.revenue_calculated;
    dailyData[dStr].cost += (r.cost_vehicle + r.cost_driver + r.cost_fuel);
  });

  const dailyAdmin = periodAdminFixedCosts / dateDiffDays;
  const dailyIdleDriver = totalIdleDriverCost / dateDiffDays;
  const dailyIdleVehicle = idleVehicleFixedCost / dateDiffDays;
  const dailyBonus = totalBonusCost / dateDiffDays;
  const globalDailyCost = dailyAdmin + dailyIdleDriver + dailyIdleVehicle + dailyBonus;

  Object.keys(dailyData).forEach(dStr => {
     dailyData[dStr].cost += globalDailyCost;
  });

  damageCosts.forEach(c => {
     const dStr = c.entry_date.toISOString().split('T')[0];
     if (dailyData[dStr]) dailyData[dStr].cost += Number(c.amount);
  });
  maintenanceCosts.forEach(c => {
     const dStr = c.entry_date.toISOString().split('T')[0];
     if (dailyData[dStr]) dailyData[dStr].cost += Number(c.amount);
  });
  penaltyCosts.forEach(c => {
     const dStr = c.entry_date.toISOString().split('T')[0];
     if (dailyData[dStr]) dailyData[dStr].cost += Number(c.amount);
  });

  const chartRunsData = Object.entries(dailyData).map(([date, data]) => ({
    date: new Date(date),
    revenue: data.revenue,
    cost: data.cost
  }));

  // AI Report Logic (Top/Flop drivers & vehicles)
  const driverStats: Record<string, { name: string, margin: number, runs: number, advised: number }> = {};
  const vehicleStats: Record<string, { plate: string, cost: number, runs: number }> = {};

  completedRuns.forEach(r => {
    if (r.driver_id && r.driver) {
      if (!driverStats[r.driver_id]) driverStats[r.driver_id] = { name: `${r.driver.first_name} ${r.driver.last_name}`, margin: 0, runs: 0, advised: 0 };
      driverStats[r.driver_id].margin += r.margin_net;
      driverStats[r.driver_id].advised += Number(r.packages_advised || 0);
      driverStats[r.driver_id].runs += 1;
    }
    if (r.vehicle_id && r.vehicle) {
      if (!vehicleStats[r.vehicle_id]) vehicleStats[r.vehicle_id] = { plate: r.vehicle.plate_number, cost: 0, runs: 0 };
      vehicleStats[r.vehicle_id].cost += r.cost_vehicle + r.cost_fuel;
      vehicleStats[r.vehicle_id].runs += 1;
    }
  });

  // Incorporate driver-specific extra costs to driverStats for authentic top/flop
  damageCosts.forEach(cost => {
    if (cost.driver_id && driverStats[cost.driver_id]) {
      driverStats[cost.driver_id].margin -= Number(cost.amount || 0);
    }
  });
  penaltyCosts.forEach(cost => {
    if (cost.driver_id && driverStats[cost.driver_id]) {
      driverStats[cost.driver_id].margin -= Number(cost.amount || 0);
    }
  });
  driverAbsenceCosts.forEach(cost => {
    if (cost.driver_id && driverStats[cost.driver_id]) {
      driverStats[cost.driver_id].margin -= Number(cost.amount || 0);
    }
  });

  const sortedDrivers = Object.values(driverStats).sort((a, b) => b.margin - a.margin);
  const sortedVehicles = Object.values(vehicleStats).sort((a, b) => b.cost - a.cost);

  const topDrivers = sortedDrivers.slice(0, 2);
  const flopDrivers = sortedDrivers.slice(-2).reverse();
  const topCostVehicles = sortedVehicles.slice(0, 2);

  const generateAIAnalysis = () => {
    return {
      summary: {
        runs: completedRuns.length,
        volume: { total: totalPackages, delivered: totalDelivered, advised: totalAdvised, returned: totalReturned },
        km: totalKm,
        costs: totalCosts
      },
      anomalies: [
        { label: "Taux d'échec global", value: `${failureRate.toFixed(1)}% de la charge (avisés + retours)`, type: "warning" },
        driversAtRisk > 0 ? { label: "Risque RH alerté", value: `${driversAtRisk} chauffeur(s) en pénalités`, type: "danger" } : null,
        totalAbsenceDays > 0 ? { label: "Impact Absences", value: `${totalAbsenceDays} jours (${totalAbsenceCost.toFixed(0)}€)`, type: "danger" } : null,
        { label: "Hausse carburant", value: "Suivi de consommation constant", type: "info" }
      ].filter(Boolean) as { label: string, value: string, type: "warning" | "danger" | "info" }[],
      actors: {
        top: topDrivers.map(d => d.name).join(', ') || 'N/A',
        flop: flopDrivers.map(d => d.name).join(', ') || 'N/A',
        vehicles: topCostVehicles.map(v => v.plate).join(', ') || 'N/A'
      },
      recommendations: [
        flopDrivers.length > 0 ? `La performance globale de ${flopDrivers[0].name} pèse sur la marge nette (${flopDrivers[0].margin.toFixed(2)}€). Un accompagnement terrain est recommandé.` : null,
        `L'augmentation des KM supplémentaires coûte en moyenne 12% des profits. Il est préconisé d'affiner le clustering des zones complexes.`
      ].filter(Boolean) as string[]
    };
  };

  const aiReport = generateAIAnalysis();


  // 7. Synthèse Globale par Chauffeur
  const synthesisMap: Record<string, any> = {};
  
  completedRuns.forEach(r => {
    if (!r.driver_id || !r.driver) return;
    const did = r.driver_id;
    if (!synthesisMap[did]) {
      synthesisMap[did] = {
        driver: r.driver,
        runs_count: 0,
        packages_loaded: 0,
        packages_delivered: 0,
        packages_advised: 0,
        packages_returned: 0,
        packages_relay: 0,
        km_utiles: 0,
        margin_net: 0,
        maintenance_cost: 0,
        damage_cost: 0,
        penalty_cost: 0,
        runs: [],
      };
    }
    
    synthesisMap[did].runs.push(r);
    synthesisMap[did].runs_count += 1;
    synthesisMap[did].packages_loaded += Number(r.packages_loaded || 0);
    synthesisMap[did].packages_delivered += Number(r.packages_delivered || 0);
    synthesisMap[did].packages_advised += (Number(r.packages_advised_direct || 0) + Number(r.packages_advised_relay || 0) || Number(r.packages_advised || 0));
    synthesisMap[did].packages_returned += Number(r.packages_returned || 0);
    synthesisMap[did].packages_relay += Number(r.packages_relay || 0);
    synthesisMap[did].km_utiles += Math.max(0, (r.km_end || 0) - (r.km_start || Number(r.km_end)));
    synthesisMap[did].margin_net += r.margin_net;
    
    // Sum up financial entries attached to runs
    if (r.financial_entries && r.financial_entries.length > 0) {
      r.financial_entries.forEach((entry: any) => {
        if (entry.category === 'maintenance_cost') synthesisMap[did].maintenance_cost += Number(entry.amount);
        if (entry.category === 'damage_cost') synthesisMap[did].damage_cost += Number(entry.amount);
        if (entry.category === 'penalty') synthesisMap[did].penalty_cost += Number(entry.amount);
      });
    }
  });

  const driverSynthesisData = Object.values(synthesisMap).sort((a: any, b: any) => {
    const marginA = a.margin_net - a.maintenance_cost - a.damage_cost - a.penalty_cost;
    const marginB = b.margin_net - b.maintenance_cost - b.damage_cost - b.penalty_cost;
    return marginB - marginA;
  });

  // 8. Synthèse Globale par Zone
  const zoneSynthesisMap: Record<string, any> = {};
  
  allRuns.forEach(r => {
    if (!r.zone_id || !r.zone) return;
    const zid = r.zone_id;
    if (!zoneSynthesisMap[zid]) {
      zoneSynthesisMap[zid] = {
        zone: r.zone,
        runs_count: 0,
        packages_loaded: 0,
        packages_delivered: 0,
        packages_advised: 0,
        packages_returned: 0,
        packages_relay: 0,
        km_utiles: 0,
        margin_net: 0,
        maintenance_cost: 0,
        damage_cost: 0,
        runs: [],
      };
    }
    
    zoneSynthesisMap[zid].runs.push(r);
    zoneSynthesisMap[zid].runs_count += 1;
    zoneSynthesisMap[zid].packages_loaded += Number(r.packages_loaded || 0);
    zoneSynthesisMap[zid].packages_delivered += Number(r.packages_delivered || 0);
    zoneSynthesisMap[zid].packages_advised += (Number(r.packages_advised_direct || 0) + Number(r.packages_advised_relay || 0) || Number(r.packages_advised || 0));
    zoneSynthesisMap[zid].packages_returned += Number(r.packages_returned || 0);
    zoneSynthesisMap[zid].packages_relay += Number(r.packages_relay || 0);
    zoneSynthesisMap[zid].km_utiles += Math.max(0, (r.km_end || 0) - (r.km_start || Number(r.km_end)));
    zoneSynthesisMap[zid].margin_net += r.margin_net;
    
    // Sum up financial entries attached to runs
    if (r.financial_entries && r.financial_entries.length > 0) {
      r.financial_entries.forEach((entry: any) => {
        if (entry.category === 'maintenance_cost') zoneSynthesisMap[zid].maintenance_cost += Number(entry.amount);
        if (entry.category === 'damage_cost') zoneSynthesisMap[zid].damage_cost += Number(entry.amount);
        if (entry.category === 'penalty') zoneSynthesisMap[zid].penalty_cost += Number(entry.amount);
      });
    }
  });

  const zoneSynthesisData = Object.values(zoneSynthesisMap).sort((a: any, b: any) => {
    const marginA = a.margin_net - a.maintenance_cost - a.damage_cost - a.penalty_cost;
    const marginB = b.margin_net - b.margin_net - b.maintenance_cost - b.damage_cost - b.penalty_cost;
    return marginB - marginA;
  });

  // 9. Radar des Anomalies (Fuel, Damages, Maintenance Usure)
  // 9a. Anomalies Carburant (Fuel)
  const fuelStatsMap: Record<string, { driverName: string, totalKm: number, totalFuel: number }> = {};
  completedRuns.forEach(r => {
    if (r.driver_id && r.driver && r.vehicle) {
      const fuel = r.fuel_consumed_liters || 0;
      const km = Math.max(0, (r.km_end || 0) - (r.km_start || Number(r.km_end) || 0));
      if (km > 0 && fuel > 0) {
         if (!fuelStatsMap[r.driver_id]) {
            fuelStatsMap[r.driver_id] = { driverName: `${r.driver.first_name} ${r.driver.last_name}`, totalKm: 0, totalFuel: 0 };
         }
         fuelStatsMap[r.driver_id].totalKm += km;
         fuelStatsMap[r.driver_id].totalFuel += fuel;
      }
    }
  });
  
  const fuelAnomaliesConfigured = Object.values(fuelStatsMap)
    .filter(s => s.totalKm > 50) 
    .map(s => ({
       driverName: s.driverName,
       avgConsumption: (s.totalFuel / s.totalKm) * 100,
       totalKm: s.totalKm
    }))
    .filter(s => s.avgConsumption > 12) // Seuil d'alerte à 12L/100
    .sort((a, b) => b.avgConsumption - a.avgConsumption)
    .slice(0, 5);

  // 9b. Anomalies Casses (Damage)
  // damageCosts est déjà défini haut (ligne ~196)
  const damageStatsMap: Record<string, { driverName: string, count: number, totalCost: number }> = {};
  damageCosts.forEach(cost => {
     if (cost.driver_id && cost.driver) {
        if (!damageStatsMap[cost.driver_id]) {
           damageStatsMap[cost.driver_id] = { driverName: `${cost.driver.first_name} ${cost.driver.last_name}`, count: 0, totalCost: 0 };
        }
        damageStatsMap[cost.driver_id].count += 1;
        damageStatsMap[cost.driver_id].totalCost += Number(cost.amount || 0);
     }
  });
  const damageAnomaliesConfigured = Object.values(damageStatsMap)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 3); // Garder le top 3 brise-fer

  // 9c. Usure Prématurée (Entretien pneus, freins)
  const wearKeywords = ['pneu', 'plaquette', 'disque', 'frein', 'embrayage'];
  const prematureWearCosts = maintenanceCosts.filter(cost => {
     const desc = cost.description?.toLowerCase() || '';
     return wearKeywords.some(kw => desc.includes(kw));
  });

  const maintenanceAnomaliesConfigured: { driverName: string, vehiclePlate: string, cost: number, reason: string }[] = [];
  
  // Assigner l'usure au chauffeur ayant fait le plus de km avec ce véhicule
  prematureWearCosts.forEach(cost => {
     if (cost.vehicle_id) {
        const driversForVehicle: Record<string, {name: string, km: number}> = {};
        completedRuns.forEach(r => {
           if (r.vehicle_id === cost.vehicle_id && r.driver_id && r.driver) {
              const km = Math.max(0, (r.km_end || 0) - (r.km_start || Number(r.km_end) || 0));
              if (!driversForVehicle[r.driver_id]) driversForVehicle[r.driver_id] = {name: `${r.driver.first_name} ${r.driver.last_name}`, km: 0};
              driversForVehicle[r.driver_id].km += km;
           }
        });
        
        let primaryDriver = 'Chauffeur Inconnu';
        let maxKm = 0;
        for (const [did, data] of Object.entries(driversForVehicle)) {
           if (data.km > maxKm) { maxKm = data.km; primaryDriver = data.name; }
        }

        const vehiclePlate = activeVehicles.find(v => v.id === cost.vehicle_id)?.plate_number || 'Vehicule';
        
        maintenanceAnomaliesConfigured.push({
           driverName: primaryDriver,
           vehiclePlate,
           cost: Number(cost.amount || 0),
           reason: cost.description || 'Usure Pièces Moteur/Structure'
        });
     }
  });
  maintenanceAnomaliesConfigured.sort((a,b) => b.cost - a.cost);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 p-6 md:p-8 font-sans antialiased selection:bg-orange-100 selection:text-orange-900">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-x-6 gap-y-4 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
               <TrendingUp className="w-7 h-7 text-orange-500" />
               Direction
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium max-w-xl leading-relaxed">
              Opérations temps réel, performances financières et Insights IA dynamiques.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-bold border border-orange-100/50 uppercase tracking-widest shadow-sm">
              {allRuns.length} Tournées sur la Période
            </div>
            <DateRangePicker />
          </div>
        </div>

        {/* KPIs Row */}
        <div className="grid gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-8">
          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl p-5 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">CA Période</h3>
            <div>
              <div className="text-3xl font-extrabold text-[#0A1A2F] mt-1 drop-shadow-sm tracking-tight">{totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">~{avgCaPerRun} € CA / tournée</p>
            </div>
          </Card>
          
          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl p-5 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Charges D'Exploit.</h3>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">-{totalCosts.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Coûts totaux absorbés</p>
            </div>
          </Card>

          <Card className={`shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 rounded-2xl p-5 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 ${totalMargin >= 0 ? 'bg-emerald-500 ring-emerald-600 border-0' : 'bg-red-500 ring-red-600 border-0'}`}>
            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 text-white/80`}>Marge Nette</h3>
            <div>
              <div className={`text-3xl font-extrabold tracking-tight text-white`}>
                {totalMargin.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
              <p className={`text-[11px] mt-1.5 font-medium text-white/70`}>
                Moy: {avgMarginPerRun} € / tour
              </p>
            </div>
          </Card>

          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl p-5 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Taux de Livraison</h3>
            <div>
              <div className={`text-3xl font-extrabold tracking-tight ${deliveryRate >= 95 ? 'text-emerald-500' : 'text-orange-500'}`}>
                {deliveryRate.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{totalDelivered} livrés / {totalPackages} chargés</p>
            </div>
          </Card>

          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Effectifs Chauffeurs</h3>
            <div className="flex justify-between items-center pb-2">
              <div className="text-center">
                <div className="text-xl font-extrabold text-slate-800">{totalActiveDrivers}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{totalActiveDrivers > 1 ? 'Actifs' : 'Actif'}</div>
              </div>
              <div className="w-px bg-slate-200/50 my-1"></div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-emerald-500">{presentDrivers}</div>
                <div className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-wider mt-1">{presentDrivers > 1 ? 'Présents' : 'Présent'}</div>
              </div>
              <div className="w-px bg-slate-200/50 my-1"></div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-[#0A1A2F]">{absentDrivers}</div>
                <div className="text-[9px] font-bold text-[#0A1A2F]/60 uppercase tracking-wider mt-1">{absentDrivers > 1 ? 'Absents' : 'Absent'}</div>
              </div>
              <div className="w-px bg-slate-200/50 my-1"></div>
              <div className="text-center flex flex-col items-center">
                <div className="text-xl font-extrabold text-blue-500">{idleDrivers}</div>
                <div className="text-[9px] font-bold text-blue-500/80 uppercase tracking-wider mt-1">Repos</div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl p-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Effectifs Véhicules</h3>
            <div className="flex justify-between items-center pb-2">
              <div className="text-center">
                <div className="text-xl font-extrabold text-emerald-500">{totalActiveVehiclesCount}</div>
                <div className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-wider mt-1">{totalActiveVehiclesCount > 1 ? 'Actifs' : 'Actif'}</div>
              </div>
              <div className="w-px bg-slate-200/50 my-1"></div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-amber-500">{totalMaintenanceVehiclesCount}</div>
                <div className="text-[9px] font-bold text-amber-500/70 uppercase tracking-wider mt-1">Maint.</div>
              </div>
              <div className="w-px bg-slate-200/50 my-1"></div>
              <div className="text-center flex flex-col items-center">
                <div className="text-xl font-extrabold text-slate-400">{totalInactiveVehiclesCount}</div>
                <div className="text-[9px] font-bold text-slate-400/80 uppercase tracking-wider mt-1">{totalInactiveVehiclesCount > 1 ? 'Inactifs' : 'Inactif'}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm">
              <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" /> Évolution Financière
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium tracking-wide mt-1">
                Croisement du Chiffre d'Affaires et des charges externes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              <div className="h-[300px] w-full">
                <AnalyticsChart runs={chartRunsData} filter={filter || (fromParam && toParam ? 'custom' : 'daily')} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm">
              <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#0A1A2F]" /> Répartition Coûts
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium tracking-wide mt-1">
                Poids des différentes charges.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              <div className="h-[300px] w-full">
                <CostBreakdownChart 
                  runs={allRuns} 
                  totalMaintenanceCost={totalMaintenanceCost} 
                  totalDamageCost={totalDamageCost}
                  totalPenaltyCost={totalPenaltyCost}
                  totalAbsenceCost={totalAbsenceCost}
                  totalBonusCost={totalBonusCost}
                  idleVehicleFixedCost={idleVehicleFixedCost}
                  idleDriverFixedCost={totalIdleDriverCost}
                  periodAdminFixedCosts={periodAdminFixedCosts}
                 />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <CardHeader className="pb-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm">
              <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" /> Flux de Colis
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium tracking-wide mt-1">
                Chargés vs Livrés vs Avisés
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              <div className="h-[250px] w-full">
                <PackagesChart runs={allRuns} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <CardHeader className="pb-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm">
              <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Map className="w-4 h-4 text-orange-500" /> Rentabilité par Zone
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium tracking-wide mt-1">
                Top 3 Secteurs (Marge Nette back).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              <div className="h-[250px] w-full">
                <ZoneProfitabilityChart runs={allRuns} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rentabilite par Chauffeur */}
        <Card className="bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5 rounded-2xl overflow-hidden mb-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          <CardHeader className="pb-4 border-b border-slate-100/60 bg-white/50 backdrop-blur-sm">
            <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Rentabilité par Chauffeur
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium tracking-wide mt-1">
              Top 5 Chauffeurs (Marge Nette calculée incluant paies, indemnités, pénalités clients, casses et absences).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-6">
            <div className="h-[250px] w-full">
              <DriverProfitabilityChart runs={allRuns} extraCosts={[...damageCosts, ...penaltyCosts, ...driverAbsenceCosts]} />
            </div>
          </CardContent>
        </Card>

        {/* Fleet Radar Alerts Component */}
        <FleetRadarAlerts 
          fuelAnomalies={fuelAnomaliesConfigured}
          damageAnomalies={damageAnomaliesConfigured}
          maintenanceAnomalies={maintenanceAnomaliesConfigured.slice(0, 4)} 
        />

        {/* AI Report */}
        <div className="mb-10">
          <Card className="bg-indigo-50/30 border border-indigo-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-indigo-900/5 rounded-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <Sparkles className="w-32 h-32 text-indigo-600" />
            </div>
            <CardHeader className="pb-4 border-b border-indigo-100/50 bg-indigo-50/50 backdrop-blur-sm">
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Rapport Décisionnel IA
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium tracking-wide mt-1">
                Analyse de rentabilité et supervision générée dynamiquement.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              <div className="text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium space-y-4">
                {`**RAPPORT ANALYTIQUE IA**\nDate de génération : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}\n\n**Résumé Global de la Période** :\n- Nombre total de tournées : ${aiReport.summary.runs} actives\n- Volume Colis : ${aiReport.summary.volume.total} chargés | ${aiReport.summary.volume.delivered} livrés | ${aiReport.summary.volume.advised} avisés | ${aiReport.summary.volume.returned} retournés\n- Kilomètres parcourus : ${aiReport.summary.km} km au total\n- Frais réels globaux : ${aiReport.summary.costs.toFixed(2)}€\n\n**Top Problèmes & Anomalies Détectées :**\n${aiReport.anomalies.map(a => `- ${a.label} : ${a.value}`).join('\n')}\n\n**Analyse des Acteurs (Marge Nette pondérée) :**\n- Acteurs ultra-performants (Top) : ${aiReport.actors.top}\n- Impact négatif sur rentabilité (Flop) : ${aiReport.actors.flop}\n- Postes de dépense élevés (Véhicules) : ${aiReport.actors.vehicles}\n\n**Recommandations Concrètes (Actionnable) :**\n${aiReport.recommendations.map((r, i) => `- ${i===0? 'Alerte Rentabilité' : 'Points de vigilance'} : ${r}`).join('\n')}`}
              </div>
              <div className="mt-8 flex justify-end">
                <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-2 rounded-xl px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                   <FileText className="w-4 h-4" /> Exporter le Bilan (PDF)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Synthèse globale Zones (Expandable) */}
        <div className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5">
          <div className="px-6 py-5 flex justify-between items-center bg-slate-50/80 border-b border-slate-100 rounded-t-2xl">
            <h2 className="text-sm font-extrabold text-[#0A1A2F] flex items-center gap-2 tracking-tight">
              <Map className="w-4 h-4 text-orange-500" /> Bilan par Zone & Détail des Tournées ({Object.keys(zoneSynthesisMap).length} Zones actives)
            </h2>
          </div>
          <div>
            <ZoneSynthesisTable data={zoneSynthesisData} />
          </div>
        </div>

        {/* Synthèse globale Chauffeurs (Expandable) */}
        <div className="mt-8 rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5">
          <div className="px-6 py-5 flex justify-between items-center bg-slate-50/80 border-b border-slate-100 rounded-t-2xl">
            <h2 className="text-sm font-extrabold text-[#0A1A2F] flex items-center gap-2 tracking-tight">
              <Users className="w-4 h-4 text-indigo-500" /> Bilan par Chauffeur & Détail des Tournées ({allRuns.length})
            </h2>
          </div>
          <div>
            <DriverSynthesisTable data={driverSynthesisData} />
          </div>
        </div>

      </div>
    </div>
  );
}
