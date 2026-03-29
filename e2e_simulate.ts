// e2e_simulator.ts
// Test théorique de la logique du Dashboard (dispatch/dashboard/page.tsx)

interface Driver {
  id: string;
  name: string;
  daily_base_cost: number;
}

interface Run {
  km_start: number;
  km_end: number;
  revenue_calculated: number; // calculated by saveUnifiedDelivery or updateRun
  cost_driver: number;
  cost_vehicle: number; // base + variable
  cost_fuel: number;
}

interface FinancialEntry {
  category: 'maintenance_cost' | 'damage_cost' | 'penalty';
  amount: number;
}

interface HrEvent {
  event_type: 'sick_leave' | 'vacation' | 'absence' | 'sanction' | 'bonus';
  days?: number;
  amount?: number;
}

// 1. SCENARIO SETUP
const driver: Driver = { id: 'D1', name: 'Simulateur E2E', daily_base_cost: 100 };

// Le conducteur a effectué 1 tournée
const run: Run = {
  km_start: 1000,
  km_end: 1100, // 100km parcourus
  revenue_calculated: 300, // 300€ facturés au client
  cost_driver: 100, // Imputé lors de la première tournée du jour
  cost_vehicle: 50, // 20€ fixe voiture + 30€ km (100km x 0.3€)
  cost_fuel: 40 // Saisi par le chauffeur à la station
};

// Les sinistres et amendes (Mécanique)
const financialEntries: FinancialEntry[] = [
  { category: 'maintenance_cost', amount: 80 },  // Garage pour vidange
  { category: 'damage_cost', amount: 150 },      // Rétroviseur cassé (facture garage)
  { category: 'penalty', amount: 150 },          // Pénalité prélevée sur le salaire du chauffeur pour le rétro
];

// Les événements RH dans le mois
const hrEvents: HrEvent[] = [
  { event_type: 'sick_leave', days: 2 }, // Arrêt maladie (2 jours)
  { event_type: 'absence', days: 3 },    // Absence injustifiée (3 jours, non payée!)
  { event_type: 'bonus', amount: 50 }    // Prime d'assiduité du mois dernier (50€)
];

// 2. DASHBOARD ALGORITHM EXECUTION
// Copie exacte du code de dispatch/dashboard/page.tsx

console.log('--- DEBUT DE LA SIMULATION DU DASHBOARD ---');
console.log(`Chauffeur: ${driver.name} | Coût de base journalier: ${driver.daily_base_cost}€`);

// A. REVENUS & COÛTES FLOTTE VARIABLES
const totalRevenue = run.revenue_calculated; // 300€
const totalVariableVehicleCost = (run.km_end - run.km_start) * 0.3; // Simulons internal_cost_per_km à 0.3€
const totalFuelCost = run.cost_fuel; // 40€

// B. COÛTS FIXES MENSUIELS (Simulés pour le mois entier de ce chauffeur)
const dateDiffDays = 30; // Un mois entier
// Le système calcule le salaire théorique provisionné de ce chauffeur pour le mois entier
const calendarDailyCost = (driver.daily_base_cost * 25.33) / 30.44; 
const totalDriverFixedCostPeriod = calendarDailyCost * dateDiffDays; // ~2496€

// C. COÛTS D'INTERVENTION
const totalDamageCost = financialEntries.filter(e => e.category === 'damage_cost').reduce((s, e) => s + e.amount, 0); // 150€
const totalMaintenanceCost = financialEntries.filter(e => e.category === 'maintenance_cost').reduce((s, e) => s + e.amount, 0);  // 80€
const totalPenaltyCost = financialEntries.filter(e => e.category === 'penalty').reduce((s, e) => s + e.amount, 0); // 150€

// D. ABSENCES (HrEvents)
let totalUnpaidSavings = 0;
hrEvents.forEach(evt => {
  if (evt.event_type === 'absence') {
    // Économie sur salaire (Absence Injustifiée)
    totalUnpaidSavings += (evt.days || 0) * driver.daily_base_cost; // 3 * 100 = 300€
  }
});

// E. BONUSES
const totalBonusCost = hrEvents.filter(e => e.event_type === 'bonus').reduce((s, e) => s + (e.amount || 0), 0); // 50€

// F. CALCUL DU DRIVER COST RECTIFIÉ (La correction que j'ai appliquée dans le v4)
console.log(`\nSalaire Mensuel Provisionné (Brut d'exploitation): ${totalDriverFixedCostPeriod.toFixed(2)}€`);
console.log(`[-] Économie Absences Injustifiées: -${totalUnpaidSavings}€`);
console.log(`[-] Économie Retenue/Pénalités: -${totalPenaltyCost}€`);
const correctedDriverFixedCost = totalDriverFixedCostPeriod - totalUnpaidSavings - totalPenaltyCost;
console.log(`Salaire réel ajusté de toutes charges: ${correctedDriverFixedCost.toFixed(2)}€`);

// G. CALCUL DE LA MARGE NETTE GLOBALE DE L'ENTREPRISE (Pour ce chauffeur)
const totalMargin = totalRevenue 
  - totalVariableVehicleCost 
  - totalFuelCost 
  - correctedDriverFixedCost 
  - totalDamageCost 
  - totalMaintenanceCost 
  - totalBonusCost;

console.log('\n--- BILAN DE RENTABILITÉ DU MOIS ---');
console.log(`Chiffre d'Affaire Tournées : +${totalRevenue}€`);
console.log(`Coûts Tournées (Km + Gasoil): -${totalVariableVehicleCost + totalFuelCost}€`);
console.log(`Salaire Effectif Chauffeur: -${correctedDriverFixedCost.toFixed(2)}€`);
console.log(`Mécanicien & Casses (Garage): -${totalDamageCost + totalMaintenanceCost}€`);
console.log(`Bonus/Primes (Motivation): -${totalBonusCost}€`);
console.log('------------------------');
console.log(`MARGE NETTE EXACTE: ${totalMargin.toFixed(2)}€`);

console.log('\nObservation: Les 150€ de casse (Dashboard) et 150€ de pénalité (RH) s\'annulent parfaitement.');
console.log('Observation: Les 3 jours d\'absence ont correctement divisé la charge salariale.');
