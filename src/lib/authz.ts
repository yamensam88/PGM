/**
 * authz.ts — Contrôle d'accès UNIQUE pour les server actions (multi-locataire).
 *
 * Le middleware ne protège que la NAVIGATION (les pages). Les server actions sont des
 * endpoints POST appelables directement : elles doivent vérifier le rôle côté serveur,
 * sinon un compte chauffeur/RH/exploitation pourrait déclencher une action réservée à
 * la Direction. Ces helpers fournissent ce verrou.
 *
 * Rôles : admin, owner (= Direction, accès total), manager, dispatcher (= Exploitation),
 *         hr (= RH), finance, driver.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { orgCan, isTrialing, TRIAL_LIMITS, type Feature } from "@/lib/plans";

export type Role =
  | "admin"
  | "owner"
  | "manager"
  | "dispatcher"
  | "hr"
  | "finance"
  | "driver";

/** La Direction (admin/owner) a un accès total : elle passe tous les contrôles de rôle. */
const DIRECTION: Role[] = ["admin", "owner"];

export interface AuthedSession {
  user: { organization_id: string; role: Role; id?: string; email?: string };
}

/** Exige une session authentifiée rattachée à une organisation. Retourne la session. */
export async function requireSession(): Promise<AuthedSession> {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.user?.organization_id) {
    throw new Error("Non autorisé. Veuillez vous reconnecter.");
  }
  return session as AuthedSession;
}

/**
 * Exige que l'utilisateur ait l'un des rôles autorisés (la Direction passe toujours).
 * Lève une erreur explicite sinon. Retourne la session pour enchaîner.
 *
 * Exemple : const session = await requireRole(["hr"]);  // RH + Direction
 */
export async function requireRole(allowed: Role[]): Promise<AuthedSession> {
  const session = await requireSession();
  const role = session.user.role;
  if (DIRECTION.includes(role)) return session;
  if (!allowed.includes(role)) {
    throw new Error("Accès refusé : votre rôle ne permet pas cette action.");
  }
  return session;
}

/** Raccourci : action réservée à la Direction (admin/owner) uniquement. */
export async function requireDirection(): Promise<AuthedSession> {
  const session = await requireSession();
  if (!DIRECTION.includes(session.user.role)) {
    throw new Error("Accès refusé : action réservée à la Direction.");
  }
  return session;
}

/** Action reservee strictement au proprietaire (owner) — pas meme les admins. */
export async function requireOwner(): Promise<AuthedSession> {
  const session = await requireSession();
  if (session.user.role !== "owner") {
    throw new Error("Acces refuse : reserve au proprietaire (Direction).");
  }
  return session;
}

/**
 * Identifiant de l'organisation maîtresse (Super Admin de la plateforme).
 * Source autoritaire = variable d'env MASTER_ORG_ID si définie. Sinon, repli sur
 * « l'organisation la plus ancienne » (comportement historique, conservé pour ne rien
 * casser tant que l'env n'est pas réglée — mais fragile, cf. audit C1).
 * Retourne null si aucune organisation n'existe.
 */
// fix SA-C1
export async function getMasterOrgId(): Promise<string | null> {
  const fromEnv = process.env.MASTER_ORG_ID;
  if (fromEnv) return fromEnv;
  const oldest = await prisma.organization.findFirst({
    orderBy: { created_at: "asc" },
    select: { id: true },
  });
  return oldest?.id ?? null;
}

/** Exige que l'offre de l'organisation inclue la fonctionnalite (verrouillage par palier). Essai = acces complet. */
export async function requireFeature(feature: Feature): Promise<AuthedSession> {
  const session = await requireSession();
  const org = await prisma.organization.findUnique({
    where: { id: session.user.organization_id },
    select: { subscription_plan: true, subscription_status: true },
  });
  if (!orgCan(org, feature)) {
    throw new Error("Cette fonctionnalite n'est pas incluse dans votre offre. Passez a l'offre superieure pour y acceder.");
  }
  return session;
}


/**
 * Plafond d'essai : pendant l'essai (trialing), bloque la creation au-dela des quotas
 * (1 vehicule, 15 tournees). Hors essai (paye), ne fait rien. A appeler AVANT la creation.
 */
export async function assertTrialQuota(orgId: string, kind: "vehicles" | "runs"): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { subscription_status: true },
  });
  if (!isTrialing(org)) return;
  const limit = TRIAL_LIMITS[kind];
  const count =
    kind === "vehicles"
      ? await prisma.vehicle.count({ where: { organization_id: orgId } })
      : await prisma.dailyRun.count({ where: { organization_id: orgId } });
  if (count >= limit) {
    const label = kind === "vehicles" ? `${limit} vehicule` : `${limit} tournees`;
    throw new Error(
      `Limite de l'essai atteinte (${label}). Choisissez un abonnement pour en ajouter davantage et debloquer toutes les fonctionnalites.`
    );
  }
}

/**
 * Résout le Driver associé à la session courante (rôle "driver").
 * Lien fort par user_id si présent, sinon repli par email (bug M5/M10 : createDriver
 * ne renseigne pas toujours Driver.user_id). Toujours borné à l'organisation.
 * Retourne null si aucun profil chauffeur n'est trouvé.
 */
// fix P0-05
export async function resolveSessionDriver(): Promise<{ id: string } | null> {
  const session = await requireSession();
  const orgId = session.user.organization_id;
  const userId = session.user.id;
  const email = session.user.email;

  // 1) Lien fort par user_id (préféré dès que disponible)
  if (userId) {
    const byUser = await prisma.driver.findFirst({
      where: { organization_id: orgId, user_id: userId },
      select: { id: true },
    });
    if (byUser) return byUser;
  }

  // 2) Repli par email (chemin actuellement fonctionnel, cf. driver/page.tsx)
  if (email) {
    const byEmail = await prisma.driver.findFirst({
      where: { organization_id: orgId, email },
      select: { id: true },
    });
    if (byEmail) return byEmail;
  }

  return null;
}

/**
 * Vérifie que la session a le droit d'agir sur `run` (déjà chargé et confirmé
 * dans la bonne organisation par l'appelant).
 *  - Direction (admin/owner) + Exploitation (dispatcher/manager) : override total.
 *  - Chauffeur : autorisé uniquement si run.driver_id === driver de la session.
 *  - Autres rôles (hr, finance) : refusés (ils n'ont rien à piloter sur une tournée).
 * Lève une erreur explicite sinon.
 */
// fix P0-05
export async function assertCanOperateRun(run: { driver_id: string | null }): Promise<AuthedSession> {
  const session = await requireSession();
  const role = session.user.role;

  // Direction + Exploitation : override
  if (DIRECTION.includes(role) || role === "dispatcher" || role === "manager") {
    return session;
  }

  if (role === "driver") {
    const driver = await resolveSessionDriver();
    if (!driver) {
      throw new Error("Profil chauffeur introuvable. Contactez l'exploitation.");
    }
    if (run.driver_id !== driver.id) {
      throw new Error("Accès refusé : cette tournée n'est pas la vôtre.");
    }
    return session;
  }

  throw new Error("Accès refusé : votre rôle ne permet pas de piloter une tournée.");
}

/**
 * Vérifie qu'une entité (driver/vehicle/client/zone/rate_card) appartient bien
 * à l'organisation de la session, AVANT de l'écrire dans un run. Empêche
 * l'injection d'identifiants d'autres organisations (IDOR cross-tenant).
 * `id` vide/nul => ignoré (pas d'erreur). Lève une erreur claire sinon.
 */
// fix P0-07
type OrgScopedEntity = "driver" | "vehicle" | "client" | "zone" | "rateCard";
export async function assertBelongsToOrg(
  kind: OrgScopedEntity,
  id: string | null | undefined,
  orgId: string
): Promise<void> {
  if (!id) return;
  const labels: Record<OrgScopedEntity, string> = {
    driver: "Chauffeur",
    vehicle: "Véhicule",
    client: "Client",
    zone: "Zone",
    rateCard: "Grille tarifaire",
  };
  let found: { id: string } | null = null;
  switch (kind) {
    case "driver":
      found = await prisma.driver.findFirst({ where: { id, organization_id: orgId }, select: { id: true } });
      break;
    case "vehicle":
      found = await prisma.vehicle.findFirst({ where: { id, organization_id: orgId }, select: { id: true } });
      break;
    case "client":
      found = await prisma.client.findFirst({ where: { id, organization_id: orgId }, select: { id: true } });
      break;
    case "zone":
      found = await prisma.zone.findFirst({ where: { id, organization_id: orgId }, select: { id: true } });
      break;
    case "rateCard":
      found = await prisma.rateCard.findFirst({ where: { id, organization_id: orgId }, select: { id: true } });
      break;
  }
  if (!found) {
    throw new Error(`${labels[kind]} introuvable dans votre société.`);
  }
}
