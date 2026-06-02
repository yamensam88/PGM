import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CreditCard, Receipt, Zap, Truck } from "lucide-react";
import { updateBillingInterval } from "@/lib/actions";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

export const dynamic = 'force-dynamic';

type Tier = { key: string; label: string; monthly: number | null; min: number; max: number; quote: boolean };

// Tarification alignee sur la landing : par nombre de vehicules.
function tierForVehicles(n: number): Tier {
  if (n <= 5) return { key: "starter", label: "Starter", monthly: 99, min: 1, max: 5, quote: false };
  if (n <= 15) return { key: "pro", label: "Pro", monthly: 249, min: 6, max: 15, quote: false };
  return { key: "business", label: "Business", monthly: null, min: 16, max: Infinity, quote: true };
}

const ALL_TIERS: Tier[] = [
  { key: "starter", label: "Starter", monthly: 99, min: 1, max: 5, quote: false },
  { key: "pro", label: "Pro", monthly: 249, min: 6, max: 15, quote: false },
  { key: "business", label: "Business", monthly: null, min: 16, max: Infinity, quote: true },
];

export default async function BillingPage(props: { searchParams: Promise<{ stripe?: string; reason?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organization_id },
    include: {
      vehicles: { where: { status: "active" }, select: { id: true } },
    },
  });

  if (!organization) redirect("/login");

  const { stripe: stripeMsg, reason: stripeReason } = await props.searchParams;
  const settingsJson: any = (organization.settings_json as any) || {};
  const hasStripeCustomer = !!settingsJson.stripe_customer_id;
  const paid = ["active", "past_due"].includes((organization.subscription_status || "").toLowerCase());

  const activeVehicles = organization.vehicles.length;
  const tier = tierForVehicles(activeVehicles);

  const isAnnual = organization.subscription_plan === "pro-annual";
  const annualEquivMonthly = tier.monthly != null ? Math.round(tier.monthly * 0.8) : null;
  const displayMonthly = isAnnual ? annualEquivMonthly : tier.monthly;
  const annualTotal = tier.monthly != null ? Math.round(tier.monthly * 12 * 0.8) : null;

  // Progression dans le palier (vehicules)
  const tierWidth = tier.max - tier.min + 1;
  const posInTier = Math.min(Math.max(activeVehicles - tier.min + 1, 0), tierWidth);
  const progressPercentage = tier.quote ? 100 : (posInTier / tierWidth) * 100;
  const tierRange = tier.quote ? `${tier.min} et plus` : `${tier.min} a ${tier.max}`;
  const vehiclesToNext = !tier.quote ? Math.max(0, tier.max - activeVehicles) : 0;

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="border-b border-zinc-200 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-indigo-500" />
          Abonnement & Facturation
        </h1>
        <p className="text-slate-500 mt-2">
          Votre offre est determinee par la taille de votre flotte (nombre de vehicules actifs).
        </p>
      </header>

      {stripeMsg && (
        <div className={`rounded-lg p-3 text-sm border ${stripeMsg === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : stripeMsg === "cancel" ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
          {stripeMsg === "success" ? "✓ Paiement confirmé — votre abonnement est actif." :
           stripeMsg === "cancel" ? "Paiement annulé. Vous pouvez réessayer quand vous voulez." :
           stripeMsg === "unconfigured" ? "Paiement non configuré : les clés Stripe manquent côté serveur (Vercel)." :
           stripeMsg === "noprice" ? "Tarif Stripe introuvable pour ce palier : le Price ID n'est pas renseigné." :
           stripeMsg === "nocustomer" ? "Aucun abonnement à gérer pour le moment." :
           (stripeReason ? `Erreur Stripe : ${stripeReason}` : "Une erreur est survenue avec le paiement. Réessayez.")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap className="w-48 h-48" />
          </div>

          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-slate-800">Votre Forfait</CardTitle>
                <CardDescription>Tarification basee sur le nombre de vehicules actifs.</CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Forfait {tier.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-8 pt-6 relative z-10">
            <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit mb-8 border border-slate-200/60 shadow-inner">
              <form action={updateBillingInterval as any}>
                <input type="hidden" name="plan" value="pro-monthly" />
                <button type="submit" className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${!isAnnual ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}>
                  Mensuel
                </button>
              </form>
              <form action={updateBillingInterval as any}>
                <input type="hidden" name="plan" value="pro-annual" />
                <button type="submit" className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${isAnnual ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}>
                  Annuel <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">-20%</span>
                </button>
              </form>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mb-1">
                {tier.quote ? "Tarification" : `Montant ${isAnnual ? "annuel" : "mensuel"} actuel`}
              </p>
              {tier.quote ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">Sur devis</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 tracking-tight">{displayMonthly}</span>
                  <span className="text-2xl font-bold text-slate-400">&euro; / mois</span>
                </div>
              )}
              {isAnnual && !tier.quote && (
                <p className="text-sm text-indigo-600 font-medium mt-2">
                  Facture annuellement : <strong>{annualTotal}&euro; / an</strong> (2 mois offerts).
                </p>
              )}
              {tier.quote && (
                <p className="text-sm text-slate-500 mt-2">
                  Au-dela de 15 vehicules, votre tarif est etabli sur mesure. Contactez-nous pour une proposition.
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mt-8">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-500" /> Taille de flotte
                  </h4>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Vous exploitez {activeVehicles} vehicule(s) actif(s) (palier {tier.label} : {tierRange}).
                  </p>
                </div>
                <span className="text-2xl font-bold text-indigo-600">{tier.quote ? `${activeVehicles} vehicules` : `${activeVehicles} / ${tier.max}`}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }} />
              </div>
              <div className="mt-4 flex items-start gap-2 text-[13px] text-slate-600 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                <Zap className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                {tier.quote ? (
                  <p>Vous etes sur le palier <strong>Business</strong>. Votre tarif est personnalise selon votre volume.</p>
                ) : (
                  <p>
                    Il vous reste <strong>{vehiclesToNext} vehicule(s)</strong> avant de passer au palier superieur.
                    Au-dela de {tier.max} vehicules, vous basculez automatiquement vers l&apos;offre suivante.
                  </p>
                )}
              </div>
            </div>

            {/* Comparatif des offres */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {ALL_TIERS.map((t) => {
                const active = t.key === tier.key;
                return (
                  <div key={t.key} className={`rounded-xl border p-4 ${active ? "border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{t.label}</span>
                      {active && <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.5 rounded">Actuel</span>}
                    </div>
                    <div className="text-lg font-black text-slate-900">{t.quote ? "Sur devis" : `${t.monthly}€`}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t.quote ? `${t.min} et plus` : `${t.min} a ${t.max}`} vehicules</div>
                    {t.quote ? (
                      <a href="mailto:contact@pgm.fr" className="mt-3 block w-full text-center rounded-md bg-slate-800 text-white text-[11px] font-semibold px-2 py-1.5 hover:bg-slate-900">Nous contacter</a>
                    ) : (
                      <div className="mt-3">
                        <CheckoutButton tier={t.key} interval={isAnnual ? "annual" : "monthly"} label={active ? "S'abonner" : "Choisir cette offre"} className={`w-full rounded-md text-[11px] font-semibold px-2 py-1.5 transition-colors disabled:opacity-50 ${active ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-indigo-300 text-indigo-700 hover:bg-indigo-50"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm h-fit">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500" /> Mode de Resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Methode de Paiement</h4>
              <div className="space-y-3">
                <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded ${paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {organization.subscription_status === "active" ? "Abonnement actif" : organization.subscription_status === "past_due" ? "Paiement en retard" : organization.subscription_status === "canceled" ? "Abonnement résilié" : "Période d'essai"}
                </span>

                {tier.quote ? (
                  <a href="mailto:contact@pgm.fr" className="block w-full text-center rounded-lg bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 hover:bg-slate-900">Contactez-nous (offre Business)</a>
                ) : (
                  <CheckoutButton tier={tier.key} interval={isAnnual ? "annual" : "monthly"} label={paid ? "Mettre à jour le paiement" : `S'abonner — ${displayMonthly}€ / mois`} className="w-full rounded-lg bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-indigo-700 disabled:opacity-50" />
                )}

                {hasStripeCustomer && (
                  <CheckoutButton portal label="Gérer mon abonnement (carte, factures, résiliation)" className="w-full rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold px-4 py-2.5 hover:bg-slate-50 disabled:opacity-50" />
                )}

                <p className="text-[10px] text-slate-400 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Paiement sécurisé par Stripe.</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 mt-2">Details d&apos;Entreprise</h4>
              <div className="space-y-1 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p><span className="text-slate-500">Raison Sociale:</span> <span className="font-semibold text-slate-800">{organization.name}</span></p>
                <p><span className="text-slate-500">ID Fisc.:</span> <span className="font-semibold text-slate-800">{organization.tax_id || "-"}</span></p>
                <p><span className="text-slate-500">Pays:</span> <span className="font-semibold text-slate-800">{organization.country || "FR"}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
