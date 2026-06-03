/**
 * finance.ts — Source de verite UNIQUE pour le calcul de rentabilite des tournees.
 *
 * Regles metier (confirmees avec la Direction / le terrain) :
 *  - Le chiffre d'affaires est facture UNIQUEMENT sur les colis LIVRES. Le modele de
 *    reference est le formulaire "Creer une Nouvelle Tournee" : l'exploitant saisit
 *    DIRECTEMENT le nombre de colis livres (packages_delivered). Les colis charges,
 *    avises et retours ne servent qu'au suivi de performance, jamais a facturer.
 *  - Le cout chauffeur (salaire journalier) et le cout vehicule FIXE (mensualites
 *    lissees) sont des charges FIXES subies que le chauffeur/vehicule tourne ou non :
 *    ils sont imputes UNE SEULE FOIS PAR JOUR, sur la premiere tournee du jour.
 *  - Cout vehicule VARIABLE :
 *      owned  -> km x cout km interne
 *      rented -> penalite sur les km au-dela du forfait mensuel (defaut 4000 km/mois).
 *                On ne facture PAS le cout km interne sur un vehicule loue.
 *
 * Fonctions PURES (aucun acces DB), utilisees a l'identique par le flux live
 * (createRun / finishRun / updateRun / saveUnifiedDelivery) et par le retroactif.
 */

import { countWorkingDays } from "@/lib/calendar";

export const WORKING_DAYS_PER_MONTH = 25.33;
export const DEFAULT_MONTHLY_KM_LIMIT = 4000;
export const DEFAULT_EXTRA_KM_COST = 0.18;

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export interface RateLike {
  base_daily_flat?: unknown;
  unit_price_stop?: unknown;
  unit_price_package?: unknown;
  bonus_relay_point?: unknown;
}

export function resolveRateCard(run: any): RateLike | null {
  if (run?.rate_card) return run.rate_card;
  if (run?.client?.rate_cards?.length) return run.client.rate_cards[0];
  return null;
}

export function computeDeliveredPackages(run: any): {
  directDelivered: number;
  relayDelivered: number;
} {
  const delivered = Math.max(0, num(run?.packages_delivered));
  const relay = Math.max(0, num(run?.packages_relay));
  const relayDelivered = Math.min(delivered, relay);
  const directDelivered = Math.max(0, delivered - relayDelivered);
  return { directDelivered, relayDelivered };
}

export function computeRunRevenue(run: any): number {
  const rc = resolveRateCard(run);
  const baseFlat = num(rc?.base_daily_flat);
  const priceStop = num(rc?.unit_price_stop);
  const priceParcel = num(rc?.unit_price_package);
  const bonusRelay = num(rc?.bonus_relay_point);
  // CA aligné sur la clôture (updateRun) : livrés DIRECTS = packages_delivered (déjà net),
  // relais livrés = packages_relay − packages_advised_relay, collectés = stops_completed.
  const collected = num(run?.stops_completed);
  const directDelivered = Math.max(0, num(run?.packages_delivered));
  const relayDelivered = Math.max(0, num(run?.packages_relay) - num(run?.packages_advised_relay));
  return baseFlat + priceStop * collected + priceParcel * directDelivered + bonusRelay * relayDelivered;
}

/**
 * Cout d'un chauffeur pour UNE tournee, selon son mode de remuneration :
 *  - "per_package" (au colis) : tarif x colis LIVRES sur la tournee. 100% variable,
 *    facture a chaque tournee (pas de logique "une fois par jour"), aucun cout a l'arret.
 *  - sinon "daily" (forfait journalier) : charge fixe imputee UNE SEULE FOIS par jour.
 */
export function driverCostFor(driver: any, deliveredPackages: number, isFirstDriverRunOfDay: boolean, isWorkingDay: boolean = true): number {
  if (!driver) return 0;
  if (driver.pay_mode === "per_package") {
    return num(driver.cost_per_package) * Math.max(0, num(deliveredPackages));
  }
  if (!isFirstDriverRunOfDay) return 0;
  // Forfait journalier. Le salaire d'un SALARIÉ est déjà lissé sur les jours ouvrés (÷ 25,33) :
  // on n'ajoute donc AUCUNE part fixe un dimanche / jour férié. Un INDÉPENDANT au forfait est
  // lui réellement payé chaque jour où il roule (dimanche/férié inclus).
  if (!isWorkingDay && driver.worker_type !== "independant") return 0;
  return num(driver.daily_base_cost);
}

export function computeDriverCost(run: any, isFirstDriverRunOfDay: boolean, isWorkingDay: boolean = true): number {
  return driverCostFor(run?.driver, num(run?.packages_delivered), isFirstDriverRunOfDay, isWorkingDay);
}

export function computeVehicleCost(
  run: any,
  opts: { isFirstVehicleRunOfDay: boolean; kmBeforeThisRun: number; isWorkingDay?: boolean }
): number {
  const v = run?.vehicle ?? {};
  // Part fixe (mensualités lissées) : déjà répartie sur les jours ouvrés -> pas de part fixe le dim/férié.
  const fixed = (opts.isFirstVehicleRunOfDay && opts.isWorkingDay !== false)
    ? (num(v.fixed_monthly_cost) + num(v.rental_monthly_cost) + num(v.insurance_monthly_cost)) /
      WORKING_DAYS_PER_MONTH
    : 0;
  const km = num(run?.km_total);
  let variable = 0;
  if (v.ownership_type === "rented") {
    // Aligné sur le calcul live : si AUCUNE limite km n'est configurée (<= 0),
    // on n'applique AUCUNE pénalité (0 = "pas de limite"), pas un défaut de 4000.
    const limit = num(v.monthly_km_limit);
    if (limit > 0) {
      const extra = num(v.extra_km_cost) || DEFAULT_EXTRA_KM_COST;
      const before = Math.max(0, num(opts.kmBeforeThisRun));
      if (before >= limit) {
        variable = km * extra;
      } else if (before + km > limit) {
        variable = (before + km - limit) * extra;
      } else {
        variable = 0;
      }
    } else {
      variable = 0;
    }
  } else {
    variable = km * num(v.internal_cost_per_km);
  }
  return fixed + variable;
}

export interface RunFinancialContext {
  isFirstDriverRunOfDay: boolean;
  isFirstVehicleRunOfDay: boolean;
  vehicleKmBeforeThisRun: number;
}

export interface RunFinancials {
  revenue: number;
  costDriver: number;
  costVehicle: number;
  costFuel: number;
  marginNet: number;
}

export function computeRunFinancials(run: any, ctx: RunFinancialContext): RunFinancials {
  const d = run?.date ? new Date(run.date) : null;
  const isWorkingDay = d ? countWorkingDays(d, d) > 0 : true;
  const revenue = computeRunRevenue(run);
  const costDriver = computeDriverCost(run, ctx.isFirstDriverRunOfDay, isWorkingDay);
  const costVehicle = computeVehicleCost(run, {
    isFirstVehicleRunOfDay: ctx.isFirstVehicleRunOfDay,
    kmBeforeThisRun: ctx.vehicleKmBeforeThisRun,
    isWorkingDay,
  });
  const costFuel = num(run?.cost_fuel);
  const marginNet = revenue - costDriver - costVehicle - costFuel;
  return { revenue, costDriver, costVehicle, costFuel, marginNet };
}
