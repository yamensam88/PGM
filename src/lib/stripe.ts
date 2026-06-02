import Stripe from "stripe";

/** Client Stripe — null si la clé n'est pas configurée (repli propre, pas de crash). */
// Sur Vercel (serverless), le client HTTP Node par défaut du SDK peut échouer
// (« An error occurred with our connection to Stripe »). On force le client basé sur fetch.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
      maxNetworkRetries: 2,
    })
  : null;

/** Mappe (palier, périodicité) -> Price ID Stripe, défini en variables d'environnement. */
export function priceIdFor(tier: string, interval: "monthly" | "annual"): string | null {
  const map: Record<string, string | undefined> = {
    "starter:monthly": process.env.STRIPE_PRICE_STARTER_MONTHLY,
    "starter:annual": process.env.STRIPE_PRICE_STARTER_ANNUAL,
    "pro:monthly": process.env.STRIPE_PRICE_PRO_MONTHLY,
    "pro:annual": process.env.STRIPE_PRICE_PRO_ANNUAL,
  };
  return map[`${tier}:${interval}`] || null;
}

export function appBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://pgm-ruddy.vercel.app";
  return u.replace(/\/$/, "");
}
