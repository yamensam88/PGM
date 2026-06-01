/**
 * audit-subscriptions.mjs — Audit & remédiation des abonnements (compte d'essai voyant tout).
 *
 * Contexte : le correctif de code (plans.ts) rend l'accès "fail-closed" — seuls les statuts
 * payants ('active' / 'past_due') débloquent le palier. Mais une organisation DÉJÀ en base
 * avec l'ancien défaut 'active'/'pro' continuera de tout voir tant que sa ligne n'est pas
 * corrigée. Ce script audite, durcit les DÉFAUTS de colonnes, et remet un compte en essai.
 *
 * À lancer depuis le dossier app/ (là où Prisma est généré et où la base est joignable) :
 *
 *   node scripts/audit-subscriptions.mjs
 *       → AUDIT seul (lecture seule). Liste les organisations et repère les cas suspects.
 *
 *   node scripts/audit-subscriptions.mjs --fix-email=ton@essai.fr
 *       → 1) durcit les défauts de colonnes (idempotent)  2) remet CE compte en 'trialing'.
 *
 *   node scripts/audit-subscriptions.mjs --fix-id=<orgId>
 *       → idem, mais ciblé par identifiant d'organisation.
 *
 *   node scripts/audit-subscriptions.mjs --harden-only
 *       → durcit seulement les défauts de colonnes, sans toucher aucune ligne.
 *
 * Sécurités : aucune écriture sans --fix-email / --fix-id / --harden-only.
 *             Le compte maître (1ʳᵉ organisation créée) n'est JAMAIS remis en essai.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || "").split("=")[1] || null;
const has = (k) => process.argv.includes(`--${k}`);
const fixEmail = arg("fix-email");
const fixId = arg("fix-id");
const hardenOnly = has("harden-only");

const PAID = new Set(["active", "past_due"]);

async function hardenDefaults() {
  // Idempotent : aligne les DÉFAUTS de colonnes sur la politique fail-closed.
  // N'altère AUCUNE ligne existante, change seulement ce que reçoit une future insertion nue.
  await prisma.$executeRawUnsafe(`ALTER TABLE "organizations" ALTER COLUMN "subscription_plan" SET DEFAULT 'starter';`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "organizations" ALTER COLUMN "subscription_status" SET DEFAULT 'trialing';`);
  console.log("🔒 Défauts de colonnes durcis : subscription_plan='starter', subscription_status='trialing'.");
}

async function main() {
  const orgs = await prisma.organization.findMany({
    orderBy: { created_at: "asc" },
    include: { users: { where: { role: "owner" }, select: { email: true } } },
  });
  const masterId = orgs[0]?.id;

  console.log("\n=== AUDIT ABONNEMENTS ===");
  for (const [i, o] of orgs.entries()) {
    const status = (o.subscription_status || "").toLowerCase();
    const ageDays = o.created_at ? Math.floor((Date.now() - o.created_at.getTime()) / 86400000) : null;
    const settings = typeof o.settings_json === "string" ? JSON.parse(o.settings_json || "{}") : (o.settings_json || {});
    const looksUnpaid = PAID.has(status) && !settings?.current_period_end && i !== 0;
    const flag = looksUnpaid ? "  ⚠️  PAYANT SANS PREUVE DE PAIEMENT (à vérifier)" : "";
    console.log(
      `${i === 0 ? "[MAÎTRE] " : "         "}${o.name} | id=${o.id} | plan=${o.subscription_plan} | status=${o.subscription_status} | âge=${ageDays}j | owner=${o.users.map((u) => u.email).join(",")}${flag}`
    );
  }

  if (hardenOnly) {
    await hardenDefaults();
    return;
  }

  if (!fixEmail && !fixId) {
    console.log("\nLecture seule. Pour corriger un compte : --fix-email=… ou --fix-id=… (durcit aussi les défauts).");
    console.log("Pour ne durcir que les défauts de colonnes : --harden-only.");
    return;
  }

  let target = null;
  if (fixId) target = orgs.find((o) => o.id === fixId);
  else if (fixEmail) target = orgs.find((o) => o.users.some((u) => (u.email || "").toLowerCase() === fixEmail.toLowerCase()));

  if (!target) return console.log(`\n❌ Aucune organisation trouvée pour ${fixEmail || fixId}.`);
  if (target.id === masterId) return console.log("\n⛔ Refus : le compte maître ne doit pas être remis en essai.");

  await hardenDefaults();
  await prisma.organization.update({
    where: { id: target.id },
    data: { subscription_status: "trialing" },
  });
  console.log(`\n✅ "${target.name}" remis en statut 'trialing'. Accès limité à Direction + Exploitation.`);
}

main().catch((e) => { console.error("Erreur:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
