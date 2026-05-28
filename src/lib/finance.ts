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
  const stops = num(run?.stops_completed);
  const { directDelivered, relayDelivered } = computeDeliveredPackages(run);
  return baseFlat + priceStop * stops + priceParcel * directDelivered + bonusRelay * relayDelivered;
}

export function computeDriverCost(run: any, isFirstDriverRunOfDay: boolean): number {
  if (!isFirstDriverRunOfDay) return 0;
  return num(run?.driver?.daily_base_cost);
}

export function computeVehicleCost(
  run: any,
  opts: { isFirstVehicleRunOfDay: boolean; kmBeforeThisRun: number }
): number {
  const v = run?.vehicle ?? {};
  const fixed = opts.isFirstVehicleRunOfDay
    ? (num(v.fixed_monthly_cost) + num(v.rental_monthly_cost) + num(v.insurance_monthly_cost)) /
      WORKING_DAYS_PER_MONTH
    : 0;
  const km = num(run?.km_total);
  let variable = 0;
  if (v.ownership_type === "rented") {
    const limit = num(v.monthly_km_limit) || DEFAULT_MONTHLY_KM_LIMIT;
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
  const revenue = computeRunRevenue(run);
  const costDriver = computeDriverCost(run, ctx.isFirstDriverRunOfDay);
  const costVehicle = computeVehicleCost(run, {
    isFirstVehicleRunOfDay: ctx.isFirstVehicleRunOfDay,
    kmBeforeThisRun: ctx.vehicleKmBeforeThisRun,
  });
  const costFuel = num(run?.cost_fuel);
  const marginNet = revenue - costDriver - costVehicle - costFuel;
  return { revenue, costDriver, costVehicle, costFuel, marginNet };
}
