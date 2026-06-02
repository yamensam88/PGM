import Stripe from "stripe";

/** Client Stripe — null si la clé n'est pas configurée (repli propre, pas de crash). */
// Sur Vercel (serverless), le client HTTP Node par défaut du SDK peut échouer
// (« An error occurred with our connection to Stripe »). On force le client basé sur fetch.
// La clé peut contenir un retour-ligne/espace parasite collé depuis Vercel
// ("invalid header value"). On retire tout caractère d'espacement (les clés Stripe n'en ont pas).
const STRIPE_KEY = (process.env.STRIPE_SECRET_KEY || "").replace(/\s+/g, "");
export const stripe = STRIPE_KEY
  ? new Stripe(STRIPE_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 2,
    })
  : null;

/** Mappe (palier, périodicité) -> Price ID Stripe, défini en variables d'environnement. */
export function stripeKeyDebug(): { len: number; prefix: string; suffix: string; mode: string } {
  return {
    len: STRIPE_KEY.length,
    prefix: STRIPE_KEY.slice(0, 8),
    suffix: STRIPE_KEY.slice(-4),
    mode: STRIPE_KEY.startsWith("sk_live_") ? "live" : STRIPE_KEY.startsWith("sk_test_") ? "test" : "inconnu",
  };
}

export function priceIdFor(tier: string, interval: "monthly" | "annual"): string | null {
  const clean = (v?: string) => (v || "").replace(/\s+/g, "") || undefined;
  const map: Record<string, string | undefined> = {
    "starter:monthly": clean(process.env.STRIPE_PRICE_STARTER_MONTHLY),
    "starter:annual": clean(process.env.STRIPE_PRICE_STARTER_ANNUAL),
    "pro:monthly": clean(process.env.STRIPE_PRICE_PRO_MONTHLY),
    "pro:annual": clean(process.env.STRIPE_PRICE_PRO_ANNUAL),
  };
  return map[`${tier}:${interval}`] || null;
}

export function appBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://pgm-ruddy.vercel.app";
  return u.replace(/\/$/, "");
}
