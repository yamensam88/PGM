/**
 * Tests du moteur de facturation/coûts (lib/finance.ts) — SANS framework.
 * Transpile le vrai code TS (calendar.ts + finance.ts) puis vérifie les règles métier.
 * Lancer :  node tests/finance.test.cjs
 */
const fs = require("fs");
const path = require("path");
const ts = require(path.join(process.cwd(), "node_modules", "typescript"));

const TMP = fs.mkdtempSync("/tmp/fin-");
const transpile = (src) =>
  ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "ES2019" } }).outputText;

// calendar.ts -> cjs
fs.writeFileSync(path.join(TMP, "calendar.cjs"), transpile(fs.readFileSync("src/lib/calendar.ts", "utf8")));
// finance.ts -> cjs (réécrit l'import alias vers le calendar transpilé)
let finSrc = fs.readFileSync("src/lib/finance.ts", "utf8").replace('"@/lib/calendar"', `"${path.join(TMP, "calendar.cjs")}"`);
fs.writeFileSync(path.join(TMP, "finance.cjs"), transpile(finSrc));

const F = require(path.join(TMP, "finance.cjs"));

let pass = 0,
  fail = 0;
const approx = (a, b) => Math.abs(a - b) < 1e-6;
function eq(label, got, exp) {
  const ok = approx(got, exp);
  console.log((ok ? "✅" : "❌") + " " + label + "  => " + got + (ok ? "" : "  (attendu " + exp + ")"));
  ok ? pass++ : fail++;
}

const RC = { base_daily_flat: 0, unit_price_stop: 0.3, unit_price_package: 1.5, bonus_relay_point: 0.3 };

// ---- computeRunRevenue : CA = base + 0,30*collectés + 1,50*directs + 0,30*(relais - avisés relais) ----
eq(
  "CA standard (92 directs, 20 relais -2 avisés, 10 collectés)",
  F.computeRunRevenue({ rate_card: RC, packages_delivered: 92, packages_relay: 20, packages_advised_relay: 2, stops_completed: 10 }),
  0.3 * 10 + 1.5 * 92 + 0.3 * 18
);
eq(
  "CA relais avisés > relais => relais livrés borné à 0",
  F.computeRunRevenue({ rate_card: RC, packages_delivered: 50, packages_relay: 2, packages_advised_relay: 5, stops_completed: 0 }),
  1.5 * 50
);
eq("CA tournée vide = 0", F.computeRunRevenue({ rate_card: RC, packages_delivered: 0, packages_relay: 0, packages_advised_relay: 0, stops_completed: 0 }), 0);

// ---- driverCostFor : per_package / forfait salarié / forfait indépendant + dimanche ----
const perPkg = { pay_mode: "per_package", cost_per_package: 1.2 };
const salDaily = { worker_type: "salarie", pay_mode: "daily", daily_base_cost: 100 };
const indDaily = { worker_type: "independant", pay_mode: "daily", daily_base_cost: 120 };

eq("Chauffeur au colis: 1,2 x 50", F.driverCostFor(perPkg, 50, true, true), 60);
eq("Chauffeur au colis: payé même 2e tournée", F.driverCostFor(perPkg, 50, false, true), 60);
eq("Salarié forfait, jour ouvré, 1re tournée = 100", F.driverCostFor(salDaily, 50, true, true), 100);
eq("Salarié forfait, jour ouvré, 2e tournée = 0", F.driverCostFor(salDaily, 50, false, true), 0);
eq("Salarié forfait, DIMANCHE = 0 (déjà absorbé)", F.driverCostFor(salDaily, 50, true, false), 0);
eq("Indépendant forfait, jour ouvré = 120", F.driverCostFor(indDaily, 50, true, true), 120);
eq("Indépendant forfait, DIMANCHE = 120 (payé quand même)", F.driverCostFor(indDaily, 50, true, false), 120);

// ---- computeVehicleCost : part fixe (jour ouvré) + variable ----
const owned = { vehicle: { ownership_type: "owned", fixed_monthly_cost: 1000, rental_monthly_cost: 0, insurance_monthly_cost: 200, internal_cost_per_km: 0.25 }, km_total: 80 };
eq("Véhicule possédé, jour ouvré: fixe(1200/25,33)+0,25*80", F.computeVehicleCost(owned, { isFirstVehicleRunOfDay: true, kmBeforeThisRun: 0, isWorkingDay: true }), 1200 / 25.33 + 0.25 * 80);
eq("Véhicule possédé, DIMANCHE: pas de part fixe, juste 0,25*80", F.computeVehicleCost(owned, { isFirstVehicleRunOfDay: true, kmBeforeThisRun: 0, isWorkingDay: false }), 0.25 * 80);
eq("Véhicule possédé, 2e tournée du jour: pas de fixe", F.computeVehicleCost(owned, { isFirstVehicleRunOfDay: false, kmBeforeThisRun: 0, isWorkingDay: true }), 0.25 * 80);

const rented = { vehicle: { ownership_type: "rented", fixed_monthly_cost: 0, rental_monthly_cost: 900, insurance_monthly_cost: 0, monthly_km_limit: 4000, extra_km_cost: 0.18 }, km_total: 80 };
eq("Véhicule loué: pénalité km au-delà du forfait (3990->4070)", F.computeVehicleCost(rented, { isFirstVehicleRunOfDay: true, kmBeforeThisRun: 3990, isWorkingDay: true }), 900 / 25.33 + (4070 - 4000) * 0.18);
eq("Véhicule loué: pas de pénalité sous le forfait", F.computeVehicleCost(rented, { isFirstVehicleRunOfDay: false, kmBeforeThisRun: 100, isWorkingDay: true }), 0);

// ---- computeRunFinancials : intègre isWorkingDay déduit de run.date ----
const ctx = { isFirstDriverRunOfDay: true, isFirstVehicleRunOfDay: true, vehicleKmBeforeThisRun: 0 };
const baseRun = {
  rate_card: RC,
  packages_delivered: 100,
  packages_relay: 0,
  packages_advised_relay: 0,
  stops_completed: 0,
  cost_fuel: 30,
  driver: salDaily,
  vehicle: owned.vehicle,
  km_total: 80,
};
const sundayRun = { ...baseRun, date: "2026-05-31" }; // dimanche
const tuesdayRun = { ...baseRun, date: "2026-06-02" }; // mardi (jour ouvré)

const fSun = F.computeRunFinancials(sundayRun, ctx);
const fTue = F.computeRunFinancials(tuesdayRun, ctx);
eq("Dimanche: coût chauffeur salarié = 0", fSun.costDriver, 0);
eq("Dimanche: coût véhicule = variable seul (0,25*80)", fSun.costVehicle, 0.25 * 80);
eq("Mardi: coût chauffeur salarié = 100", fTue.costDriver, 100);
eq("Mardi: coût véhicule = fixe + variable", fTue.costVehicle, 1200 / 25.33 + 0.25 * 80);
eq("Mardi: marge = CA - chauffeur - véhicule - carburant", fTue.marginNet, 1.5 * 100 - 100 - (1200 / 25.33 + 0.25 * 80) - 30);
eq("Dimanche: marge supérieure (pas de charges fixes absorbées)", fSun.marginNet > fTue.marginNet ? 1 : 0, 1);

console.log("\n" + (fail === 0 ? `✅ TOUS LES TESTS PASSENT (${pass})` : `❌ ${fail} ÉCHEC(S) / ${pass + fail}`));
process.exit(fail === 0 ? 0 : 1);
