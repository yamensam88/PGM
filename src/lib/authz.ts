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
import { orgCan, type Feature } from "@/lib/plans";

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
