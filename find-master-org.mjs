// Affiche les organisations triées par date de création (la PREMIÈRE = org maîtresse actuelle).
// Usage : node find-master-org.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const orgs = await prisma.organization.findMany({
  orderBy: { created_at: "asc" },
  select: { id: true, name: true, created_at: true, subscription_status: true },
});
console.log("\n=== Organisations (la 1ère ligne = org maîtresse) ===\n");
orgs.forEach((o, i) => {
  const tag = i === 0 ? "  <-- MASTER_ORG_ID" : "";
  console.log(`${i + 1}. ${o.id}  | ${o.name} | ${o.subscription_status} | ${o.created_at?.toISOString?.() || o.created_at}${tag}`);
});
console.log("\nCopie l'UUID de la 1ère ligne et mets-le dans MASTER_ORG_ID.\n");
await prisma.$disconnect();
