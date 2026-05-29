import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { orgCan, type Feature } from "@/lib/plans";

/**
 * Garde côté page (fiable, basé sur la session + la base — indépendant de tout en-tête).
 *
 * Renvoie true si la section doit être bloquée :
 *  - pendant l'essai : SEULES la Direction et l'Exploitation sont accessibles ; toute page
 *    qui appelle ce garde est donc bloquée ;
 *  - sinon : bloquée si la fonctionnalité requise n'est pas incluse dans le palier payé.
 *
 * Les pages Direction (dashboard) et Exploitation (runs) n'appellent PAS ce garde.
 */
export async function isSectionBlocked(feature: Feature | null): Promise<boolean> {
  const session = (await getServerSession(authOptions)) as any;
  const orgId = session?.user?.organization_id;
  if (!orgId) return false;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { subscription_plan: true, subscription_status: true },
  });

  if ((org?.subscription_status || "").toLowerCase() === "trialing") return true;
  if (feature && !orgCan(org, feature)) return true;
  return false;
}
