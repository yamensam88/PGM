import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { sendDeliveryAlertEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";

const MAX_ALERTS = 200;
const SEV = ["high", "warning", "info"];

function normalize(b: any, prev?: any) {
  return {
    id: prev?.id || randomUUID(),
    key: b.key || randomUUID(),
    portal: String(b.portal || "Portail"),
    severity: SEV.includes(b.severity) ? b.severity : "info",
    title: String(b.title || "").slice(0, 200),
    message: String(b.message || "").slice(0, 600),
    ref: b.ref ? String(b.ref).slice(0, 120) : null,
    // On conserve le statut "resolved" si l'utilisateur avait deja resolu cette cle.
    status: prev?.status === "resolved" ? "resolved" : "new",
    // On garde le ts d'origine pour un ordre stable.
    ts: prev?.ts || b.ts || new Date().toISOString(),
  };
}

async function emailNewHigh(orgId: string, alerts: any[]) {
  const high = alerts.filter((a) => a.severity === "high" && a.status !== "resolved");
  if (!high.length) return;
  try {
    const owner = await prisma.user.findFirst({
      where: { organization_id: orgId, role: { in: ["owner", "admin"] } },
      select: { email: true },
    });
    const to = process.env.ALERT_EMAIL || owner?.email;
    if (to) for (const a of high) await sendDeliveryAlertEmail(to, a);
  } catch (e) { /* email non bloquant */ }
}

/**
 * Reçoit les alertes de l'agent de suivi (Colis Privé / GoFo).
 * Deux modes :
 *  - SYNC  : body = { sync: true, alerts: [...] }  -> REMPLACE le fil par l'instantané courant
 *            (les alertes marquées "résolu" le restent ; les anciennes disparues sont retirées).
 *  - SIMPLE: body = { title, ... }                 -> ajoute une seule alerte (compat. ascendante).
 * Auth : en-tête x-pgm-secret === process.env.PGM_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.PGM_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook non configuré (PGM_WEBHOOK_SECRET manquant)." }, { status: 503 });
    }
    if (req.headers.get("x-pgm-secret") !== secret) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Payload invalide." }, { status: 400 });

    const orgId = process.env.PORTAL_ALERTS_ORG_ID
      || (await prisma.organization.findFirst({ orderBy: { created_at: "asc" }, select: { id: true } }))?.id;
    if (!orgId) return NextResponse.json({ error: "Aucune organisation." }, { status: 404 });

    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings_json: true } });
    const settings: any = (org?.settings_json as any) || {};
    const list: any[] = Array.isArray(settings.portal_alerts) ? settings.portal_alerts : [];

    // ---- MODE SYNC : remplace le fil par l'instantané courant ----
    if (body.sync && Array.isArray(body.alerts)) {
      const prevByKey = new Map(list.map((a) => [a.key, a]));
      const rebuilt = body.alerts.slice(0, MAX_ALERTS).map((b: any) => normalize(b, prevByKey.get(b.key)));
      settings.portal_alerts = rebuilt;
      await prisma.organization.update({ where: { id: orgId }, data: { settings_json: settings } });
      // Email seulement pour les alertes critiques NOUVELLES (clé absente du fil précédent).
      await emailNewHigh(orgId, rebuilt.filter((a: any) => !prevByKey.has(a.key)));
      return NextResponse.json({ ok: true, synced: rebuilt.length });
    }

    // ---- MODE SIMPLE : une seule alerte (compat) ----
    if (!body.title) return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    const today = new Date().toISOString().slice(0, 10);
    if (body.key && list.some((a) => a.key === body.key && (a.ts || "").slice(0, 10) === today)) {
      return NextResponse.json({ ok: true, deduped: true });
    }
    const alert = normalize(body);
    settings.portal_alerts = [alert, ...list].slice(0, MAX_ALERTS);
    await prisma.organization.update({ where: { id: orgId }, data: { settings_json: settings } });
    if (alert.severity === "high") await emailNewHigh(orgId, [alert]);
    return NextResponse.json({ ok: true, id: alert.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}
