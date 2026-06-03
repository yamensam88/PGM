/**
 * plans.ts — Matrice des offres PGM et contrôle d'accès par fonctionnalité.
 *
 * Tarification (alignée sur la landing, par nombre de véhicules) :
 *   - Starter  (99 €/mois)  : 1 à 5 véhicules
 *   - Pro      (249 €/mois) : 6 à 15 véhicules
 *   - Business (sur devis)  : 16 véhicules et plus (sans limite)
 *
 * Règle d'essai : pendant la période d'essai (subscription_status === "trialing"),
 * l'utilisateur a accès uniquement à la Direction et à l'Exploitation & Flotte (découverte).
 * À la fin de l'essai, l'accès est restreint au palier payé (ou débloqué selon l'offre choisie).
 */

export type Plan = "starter" | "pro" | "business";

export type Feature =
  | "dashboard" // Tableau de bord Direction + coût de revient & marge nette
  | "runs" // Exploitation & Flotte : saisie tournées, chauffeurs, véhicules
  | "simulator" // Simulateur de contrat (appels d'offres)
  | "retroactive" // Reprise rétroactive de l'historique
  | "margin_diagnostic" // Diagnostic de marge poste par poste (waterfall)
  | "recommendations" // Recommandations stratégiques chiffrées
  | "hr" // Module RH (congés, absences, calendrier)
  | "multi_user" // Multi-utilisateurs & gestion des rôles
  | "support_priority" // Support prioritaire
  | "tracking"; // (interne) Suivi temps reel des livraisons — reserve au compte maitre, non vendu

const MATRIX: Record<Plan, Feature[]> = {
  starter: ["dashboard", "runs", "simulator"],
  pro: [
    "dashboard",
    "runs",
    "simulator",
    "retroactive",
    "margin_diagnostic",
    "recommendations",
    "hr",
    "multi_user",
  ],
  business: [
    "dashboard",
    "runs",
    "simulator",
    "retroactive",
    "margin_diagnostic",
    "recommendations",
    "hr",
    "multi_user",
    "support_priority",
  ],
};

// Essai gratuit : acces limite a la Direction (tableau de bord) et a l'Exploitation & Flotte.
const TRIAL_FEATURES: Feature[] = ["dashboard", "runs"];

/**
 * Plafonds de l'essai gratuit (decouverte) : assez pour vivre le declic "marge reelle"
 * sur un vehicule, pas assez pour exploiter sa flotte gratuitement au quotidien.
 */
export const TRIAL_LIMITS = { vehicles: 1, runs: 15 } as const;

/** L'organisation est-elle en periode d'essai ? */
export function isTrialing(org: OrgLike): boolean {
  return !!org && (org.subscription_status || "").toLowerCase() === "trialing";
}

export const PLAN_LABELS: Record<Plan, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

/** Normalise une valeur de plan en provenance de la base (défaut historique : "pro"). */
export function normalizePlan(plan?: string | null): Plan {
  const v = (plan || "").toLowerCase();
  if (v === "starter" || v === "pro" || v === "business") return v;
  return "pro";
}

/** Le palier donné inclut-il la fonctionnalité (hors logique d'essai) ? */
export function planAllows(plan: string | null | undefined, feature: Feature): boolean {
  return MATRIX[normalizePlan(plan)].includes(feature);
}

type OrgLike = { subscription_plan?: string | null; subscription_status?: string | null } | null | undefined;

/**
 * L'organisation peut-elle utiliser la fonctionnalité, en tenant compte de l'essai ?
 * Pendant l'essai → Direction + Exploitation uniquement. Sinon → selon le palier payé.
 */
export function orgCan(org: OrgLike, feature: Feature): boolean {
  if (!org) return false;
  if ((org.subscription_status || "").toLowerCase() === "trialing") {
    return TRIAL_FEATURES.includes(feature);
  }
  return planAllows(org.subscription_plan, feature);
}

/** Liste des fonctionnalités effectivement accessibles (pour le menu, etc.). */
export function allowedFeatures(org: OrgLike): Feature[] {
  if (!org) return [];
  if ((org.subscription_status || "").toLowerCase() === "trialing") return [...TRIAL_FEATURES];
  return [...MATRIX[normalizePlan(org.subscription_plan)]];
}
