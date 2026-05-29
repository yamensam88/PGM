/*
 * margin_today.cjs — Calcule la marge nette d'une journée avec la formule CORRIGÉE.
 *
 * Usage :
 *    node margin_today.cjs            -> aujourd'hui
 *    node margin_today.cjs 2026-05-28 -> une date precise (AAAA-MM-JJ)
 *
 * Regles appliquees (confirmees terrain) :
 *  - CA facture sur les colis LIVRES (packages_delivered), repartition relais d'abord.
 *  - Cout chauffeur + cout vehicule FIXE : une seule fois par jour (1re tournee).
 *  - Vehicule loue : penalite au-dela du forfait km mensuel (defaut 4000), PAS de cout/km.
 *  - Vehicule en propre : km x cout/km interne.
 *  - Marge operationnelle du jour = somme(marges tournees) - casse - entretien - penalites du jour.
 *    (N'inclut PAS la quote-part journaliere des frais fixes/idle ni les primes mensuelles.)
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const num = (v) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; };
const WORKING_DAYS = 25.33, KM_LIMIT_DEF = 4000, EXTRA_DEF = 0.18;
const eur = (n) => n.toFixed(2).replace(".", ",") + " EUR";

function resolveRate(run) {
  if (run.rate_card) return run.rate_card;
  if (run.client && run.client.rate_cards && run.client.rate_cards.length) return run.client.rate_cards[0];
  return {};
}
function delivered(run) {
  const d = Math.max(0, num(run.packages_delivered));
  const r = Math.max(0, num(run.packages_relay));
  const relay = Math.min(d, r);
  return { direct: Math.max(0, d - relay), relay };
}
function revenue(run) {
  const rc = resolveRate(run);
  const { direct, relay } = delivered(run);
  return num(rc.base_daily_flat) + num(rc.unit_price_stop) * num(run.stops_completed)
       + num(rc.unit_price_package) * direct + num(rc.bonus_relay_point) * relay;
}
function vehicleCost(run, firstVeh, kmBefore) {
  const v = run.vehicle || {};
  const fixed = firstVeh ? (num(v.fixed_monthly_cost) + num(v.rental_monthly_cost) + num(v.insurance_monthly_cost)) / WORKING_DAYS : 0;
  const km = num(run.km_total);
  let variable = 0;
  if (v.ownership_type === "rented") {
    const lim = num(v.monthly_km_limit) || KM_LIMIT_DEF;
    const ex = num(v.extra_km_cost) || EXTRA_DEF;
    const b = Math.max(0, kmBefore);
    if (b >= lim) variable = km * ex;
    else if (b + km > lim) variable = (b + km - lim) * ex;
  } else {
    variable = km * num(v.internal_cost_per_km);
  }
  return fixed + variable;
}

async function main() {
  const arg = process.argv[2];
  const base = arg ? new Date(arg + "T12:00:00Z") : new Date();
  const Y = base.getUTCFullYear(), M = base.getUTCMonth(), D = base.getUTCDate();
  const start = new Date(Date.UTC(Y, M, D, 0, 0, 0, 0));
  const end = new Date(Date.UTC(Y, M, D, 23, 59, 59, 999));
  const monthStart = new Date(Date.UTC(Y, M, 1, 0, 0, 0, 0));
  const dayStr = start.toISOString().split("T")[0];

  const runs = await prisma.dailyRun.findMany({
    where: { status: "completed", date: { gte: start, lte: end } },
    include: { driver: true, vehicle: true, client: { include: { rate_cards: true } }, rate_card: true },
    orderBy: { created_at: "asc" },
  });

  // Contexte : 1re tournee du jour + km vehicule avant chaque tournee (mois civil)
  const monthRuns = await prisma.dailyRun.findMany({
    where: { status: "completed", date: { gte: monthStart, lte: end } },
    select: { id: true, vehicle_id: true, driver_id: true, date: true, created_at: true, km_total: true },
    orderBy: { created_at: "asc" },
  });
  const seenD = new Set(), seenV = new Set(), firstD = new Set(), firstV = new Set(), kmBefore = new Map(), running = new Map();
  for (const r of monthRuns) {
    const ds = r.date.toISOString().split("T")[0];
    const dk = r.driver_id + "_" + ds; if (!seenD.has(dk)) { seenD.add(dk); firstD.add(r.id); }
    const vk = r.vehicle_id + "_" + ds; if (!seenV.has(vk)) { seenV.add(vk); firstV.add(r.id); }
    const cur = running.get(r.vehicle_id) || 0;
    kmBefore.set(r.id, cur);
    running.set(r.vehicle_id, cur + num(r.km_total));
  }

  let totRev = 0, totDrv = 0, totVeh = 0, totFuel = 0, totMargin = 0;
  console.log("\n=== Tournees completees le " + dayStr + " : " + runs.length + " ===");
  for (const run of runs) {
    const rev = revenue(run);
    const drv = firstD.has(run.id) ? num(run.driver && run.driver.daily_base_cost) : 0;
    const veh = vehicleCost(run, firstV.has(run.id), kmBefore.get(run.id) || 0);
    const fuel = num(run.cost_fuel);
    const m = rev - drv - veh - fuel;
    totRev += rev; totDrv += drv; totVeh += veh; totFuel += fuel; totMargin += m;
    const code = run.run_code || run.id.slice(0, 8);
    console.log("  " + code.padEnd(14) + " CA=" + rev.toFixed(2) + "  chauf=" + drv.toFixed(2) + "  veh=" + veh.toFixed(2) + "  gasoil=" + fuel.toFixed(2) + "  marge=" + m.toFixed(2));
  }

  const fe = await prisma.financialEntry.findMany({
    where: { entry_date: { gte: start, lte: end }, category: { in: ["damage_cost", "maintenance_cost", "penalty"] } },
  });
  const damage = fe.filter(e => e.category === "damage_cost").reduce((s, e) => s + num(e.amount), 0);
  const maint = fe.filter(e => e.category === "maintenance_cost").reduce((s, e) => s + num(e.amount), 0);
  const pen = fe.filter(e => e.category === "penalty").reduce((s, e) => s + num(e.amount), 0);

  const opMargin = totMargin - damage - maint - pen;

  console.log("\n=== Synthese du " + dayStr + " ===");
  console.log("  Chiffre d'affaires .......... " + eur(totRev));
  console.log("  - Cout chauffeurs ........... " + eur(totDrv));
  console.log("  - Cout vehicules (fixe+km) .. " + eur(totVeh));
  console.log("  - Gasoil .................... " + eur(totFuel));
  console.log("  = Marge des tournees ........ " + eur(totMargin));
  console.log("  - Casse ..................... " + eur(damage));
  console.log("  - Entretien ................. " + eur(maint));
  console.log("  - Penalites ................. " + eur(pen));
  console.log("  = MARGE NETTE DU JOUR ....... " + eur(opMargin));
  console.log("\n(Note: hors quote-part journaliere des frais fixes/idle et primes mensuelles.)\n");

  await prisma.$disconnect();
}
main().catch(async (e) => { console.error("Erreur:", e.message); await prisma.$disconnect(); process.exit(1); });
