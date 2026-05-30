import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { sendDeliveryAlertEmail } from "@/lib/emails";

export const dynamic = "force-dynamic";

const MAX_ALERTS = 200;

/**
 * Reçoit les alertes de l'agent de suivi (Colis Privé / GoFo) et les stocke
 * dans organization.settings_json.portal_alerts (aucune migration requise).
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
    if (!body || !body.title) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    // Organisation cible : variable d'env dédiée, sinon la première organisation (compte maître PGM).
    const orgId = process.env.PORTAL_ALERTS_ORG_ID
      || (await prisma.organization.findFirst({ orderBy: { created_at: "asc" }, select: { id: true } }))?.id;
    if (!orgId) return NextResponse.json({ error: "Aucune organisation." }, { status: 404 });

    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings_json: true } });
    const settings: any = (org?.settings_json as any) || {};
    const list: any[] = Array.isArray(settings.portal_alerts) ? settings.portal_alerts : [];

    // Anti-doublon : si une alerte avec la même clé existe déjà aujourd'hui, on ignore.
    const today = new Date().toISOString().slice(0, 10);
    if (body.key && list.some((a) => a.key === body.key && (a.ts || "").slice(0, 10) === today)) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const alert = {
      id: randomUUID(),
      key: body.key || randomUUID(),
      portal: String(body.portal || "Portail"),
      severity: ["high", "warning", "info"].includes(body.severity) ? body.severity : "info",
      title: String(body.title).slice(0, 200),
      message: String(body.message || "").slice(0, 600),
      ref: body.ref ? String(body.ref).slice(0, 120) : null,
      status: "new",
      ts: body.ts || new Date().toISOString(),
    };

    settings.portal_alerts = [alert, ...list].slice(0, MAX_ALERTS);
    await prisma.organization.update({ where: { id: orgId }, data: { settings_json: settings } });

    // Email sur alerte critique (best-effort, ne bloque jamais la reponse).
    if (alert.severity === "high") {
      try {
        const owner = await prisma.user.findFirst({
          where: { organization_id: orgId, role: { in: ["owner", "admin"] } },
          select: { email: true },
        });
        const to = process.env.ALERT_EMAIL || owner?.email;
        if (to) await sendDeliveryAlertEmail(to, alert);
      } catch (e) { /* email non bloquant */ }
    }

    return NextResponse.json({ ok: true, id: alert.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur." }, { status: 500 });
  }
}
