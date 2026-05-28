/**
 * finance.ts — Source de vérité UNIQUE pour le calcul de rentabilité des tournées.
 *
 * Règles métier (confirmées avec la Direction) :
 *  - Le chiffre d'affaires est facturé UNIQUEMENT sur les colis LIVRÉS
 *    (les colis chargés / avisés / retournés servent au suivi de performance,
 *     jamais à la facturation).
 *  - Le coût chauffeur (salaire journalier) et le coût véhicule FIXE (mensualités
 *    lissées) sont des charges FIXES subies que le chauffeur/véhicule tourne ou non :
 *    ils sont imputés UNE SEULE FOIS PAR JOUR, sur la première tournée du jour.
 *  - Coût véhicule VARIABLE :
 *      • en propre (owned)  -> km × coût km interne
 *      • en location (rented) -> pénalité sur les km au-delà du forfait mensuel
 *                                (par défaut 4000 km/mois). On ne facture PAS
 *                                le coût km interne sur un véhicule loué.
 *
 * Ces fonctions sont PURES (aucun accès DB) afin d'être utilisées à l'identique
 * par le flux live (finishRun / updateRun) et par le moteur rétroactif.
 */

export const WORKING_DAYS_PER_MONTH = 25.33;
export const DEFAULT_MONTHLY_KM_LIMIT = 4000;
export const DEFAULT_EXTRA_KM_COST = 0.18;

/** Conversion sûre vers un nombre (gère Prisma.Decimal, null, undefined, string). */
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

/** Résout la grille tarifaire applicable : celle liée à la tournée, sinon celle du client. */
export function resolveRateCard(run: any): RateLike | null {
  if (run?.rate_card) return run.rate_card;
  if (run?.client?.rate_cards?.length) return run.client.rate_cards[0];
  return null;
}

/**
 * Colis effectivement LIVRÉS, ventilés par canal.
 *  livrés_direct = chargés − avisés_direct − retours
 *  livrés_relais = colis_relais − avisés_relais
 */
export function computeDeliveredPackages(run: any): {
  directDelivered: number;
  relayDelivered: number;
} {
  const directDelivered = Math.max(
    0,
    num(run?.packages_loaded) - num(run?.packages_advised_direct) - num(run?.packages_returned)
  );
  const relayDelivered = Math.max(
    0,
    num(run?.packages_relay) - num(run?.packages_advised_relay)
  );
  return { directDelivered, relayDelivered };
}

/** Chiffre d'affaires d'une tournée (basé sur les colis livrés). */
export function computeRunRevenue(run: any): number {
  const rc = resolveRateCard(run);
  const baseFlat = num(rc?.base_daily_flat);
  const priceStop = num(rc?.unit_price_stop);
  const priceParcel = num(rc?.unit_price_package);
  const bonusRelay = num(rc?.bonus_relay_point);

  const stops = num(run?.stops_completed);
  const { directDelivered, relayDelivered } = computeDeliveredPackages(run);

  return (
    baseFlat +
    priceStop * stops +
    priceParcel * directDelivered +
    bonusRelay * relayDelivered
  );
}

/** Coût chauffeur : salaire journalier, imputé uniquement sur la 1re tournée du jour. */
export function computeDriverCost(run: any, isFirstDriverRunOfDay: boolean): number {
  if (!isFirstDriverRunOfDay) return 0;
  return num(run?.driver?.daily_base_cost);
}

/**
 * Coût véhicule = part fixe (1re tournée du jour) + part variable.
 *  - fixe = (mensualité + location + assurance) / jours ouvrés
 *  - variable owned  = km × coût km interne
 *  - variable rented = pénalité progressive au-delà du forfait km mensuel
 *
 * @param kmBeforeThisRun km déjà parcourus par le véhicule ce mois-ci AVANT cette tournée.
 */
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
      variable = km * extra; // déjà au-delà du forfait : tout est facturé
    } else if (before + km > limit) {
      variable = (before + km - limit) * extra; // seul le dépassement est facturé
    } else {
      variable = 0; // sous le forfait
    }
  } else {
    // véhicule en propre : coût kilométrique interne
    variable = km * num(v.internal_cost_per_km);
  }

  return fixed + variable;
}

export interface RunFinancialContext {
  isFirstDriverRunOfDay: boolean;
  isFirstVehicleRunOfDay: boolean;
  /** km déjà parcourus par le véhicule ce mois civil AVANT cette tournée. */
  vehicleKmBeforeThisRun: number;
}

export interface RunFinancials {
  revenue: number;
  costDriver: number;
  costVehicle: number;
  costFuel: number;
  marginNet: number;
}

/**
 * Calcul complet de la rentabilité d'une tournée.
 * Le coût gasoil est lu sur la tournée (saisi par l'exploitation), il n'est pas recalculé ici.
 */
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
