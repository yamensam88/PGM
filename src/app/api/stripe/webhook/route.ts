import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Statut Stripe -> statut interne (PAID_STATUSES = active|past_due dans lib/plans.ts).
function mapStatus(s: string): string {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  return "canceled";
}

export async function POST(req: Request) {
  const { stripe } = await import("@/lib/stripe");
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").replace(/\s+/g, "");
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe non configuré." }, { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(raw, sig as string, secret);
  } catch (e: any) {
    return NextResponse.json({ error: `Signature invalide: ${e.message}` }, { status: 400 });
  }

  async function applyToOrg(orgId: string, patch: { status?: string; plan?: string; customerId?: string; subscriptionId?: string; periodEnd?: number | null }) {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings_json: true } });
    if (!org) return;
    const settings: any = (org.settings_json as any) || {};
    if (patch.customerId) settings.stripe_customer_id = patch.customerId;
    if (patch.subscriptionId) settings.stripe_subscription_id = patch.subscriptionId;
    if (patch.periodEnd) settings.current_period_end = new Date(patch.periodEnd * 1000).toISOString();
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(patch.status ? { subscription_status: patch.status } : {}),
        ...(patch.plan ? { subscription_plan: patch.plan } : {}),
        settings_json: settings,
      },
    });
  }

  async function orgIdFromCustomer(customerId: string): Promise<string | null> {
    try {
      const c: any = await stripe!.customers.retrieve(customerId);
      return c && !c.deleted ? c.metadata?.orgId || null : null;
    } catch {
      return null;
    }
  }

  const obj: any = event.data.object;
  try {
    if (event.type === "checkout.session.completed") {
      const orgId = obj.client_reference_id || obj.metadata?.orgId;
      const interval = obj.metadata?.interval === "annual" ? "annual" : "monthly";
      const tier = obj.metadata?.tier || "pro";
      if (orgId) await applyToOrg(orgId, { status: "active", plan: `${tier}-${interval}`, customerId: obj.customer, subscriptionId: obj.subscription });
    } else if (event.type.startsWith("customer.subscription.")) {
      const orgId = await orgIdFromCustomer(obj.customer);
      if (orgId) {
        const status = event.type === "customer.subscription.deleted" ? "canceled" : mapStatus(obj.status);
        await applyToOrg(orgId, { status, customerId: obj.customer, subscriptionId: obj.id, periodEnd: obj.current_period_end });
      }
    } else if (event.type === "invoice.payment_failed") {
      const orgId = await orgIdFromCustomer(obj.customer);
      if (orgId) await applyToOrg(orgId, { status: "past_due" });
    }
  } catch (e: any) {
    console.error("stripe webhook handler error:", e);
    return NextResponse.json({ error: "handler" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
