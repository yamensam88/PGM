"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";

type Tier = {
  name: string;
  fleet: string;
  monthly: number | null;
  annual: number | null;
  featured: boolean;
  cta: string;
  href: string;
  features: string[];
};

const tiers: Tier[] = [
  {
    name: "Starter",
    fleet: "1 à 5 véhicules",
    monthly: 99,
    annual: 79,
    featured: false,
    cta: "Démarrer l'essai",
    href: "/register",
    features: [
      "Tableau de bord Direction",
      "Saisie tournées, chauffeurs & véhicules",
      "Coût de revient & marge nette en temps réel",
      "Simulateur de contrat (appels d'offres)",
      "1 utilisateur",
    ],
  },
  {
    name: "Pro",
    fleet: "6 à 15 véhicules",
    monthly: 249,
    annual: 199,
    featured: true,
    cta: "Démarrer l'essai",
    href: "/register",
    features: [
      "Tout Starter, plus :",
      "Diagnostic de marge poste par poste",
      "Recommandations stratégiques chiffrées",
      "Module RH (congés, absences, calendrier)",
      "Multi-utilisateurs & gestion des rôles",
      "Reprise rétroactive de l'historique",
    ],
  },
  {
    name: "Business",
    fleet: "16 à 50 véhicules",
    monthly: null,
    annual: null,
    featured: false,
    cta: "Nous contacter",
    href: "/register",
    features: [
      "Tout Pro, plus :",
      "Accompagnement à la mise en route",
      "Paramétrage sur-mesure de vos grilles",
      "Support prioritaire",
      "Volume de véhicules adapté",
    ],
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="tarifs" className="max-w-7xl mx-auto px-6 mb-40 scroll-mt-24">
      <div className="text-center mb-12">
        <span className="inline-block mb-6 rounded-full bg-white/5 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 font-mono tracking-widest text-[10px] uppercase">
          Tarifs
        </span>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[1.05] mb-5">
          Un prix clair.<br className="sm:hidden" /> <span className="text-indigo-400">Rentabilisé dès la première marge récupérée.</span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto font-light text-lg">
          Sans engagement, sans carte bancaire pour l'essai. Vous changez d'offre ou résiliez quand vous voulez.
        </p>

        {/* Toggle mensuel / annuel */}
        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!annual ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${annual ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}
          >
            Annuel
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${annual ? "bg-indigo-600 text-white" : "bg-indigo-500/15 text-indigo-400"}`}>−20%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {tiers.map((tier) => {
          const price = annual ? tier.annual : tier.monthly;
          const isQuote = tier.monthly === null;
          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                tier.featured
                  ? "border-indigo-500/40 bg-gradient-to-b from-indigo-500/10 to-zinc-900/40 shadow-[0_0_60px_-15px_rgba(99,102,241,0.4)]"
                  : "border-white/5 bg-zinc-900/40"
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    <Sparkles className="w-3 h-3" /> Le plus choisi
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{tier.fleet}</p>

              <div className="mt-6 mb-6 min-h-[64px]">
                {isQuote ? (
                  <div className="text-4xl font-black tracking-tight text-white">Sur devis</div>
                ) : (
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-black tracking-tighter text-white">{price}€</span>
                    <span className="mb-1.5 text-sm text-zinc-500">/ mois</span>
                  </div>
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  {isQuote
                    ? "Tarif adapté à votre volume"
                    : annual
                    ? "facturé annuellement (−20%)"
                    : "facturé mensuellement, sans engagement"}
                </p>
              </div>

              <Link
                href={tier.href}
                className={`group mb-8 flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold transition-all ${
                  tier.featured
                    ? "bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_0_40px_-12px_rgba(99,102,241,0.6)]"
                    : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <ul className="space-y-3 text-sm">
                {tier.features.map((f, i) => (
                  <li key={i} className={`flex gap-3 ${f.endsWith(":") ? "text-zinc-300 font-semibold" : "text-zinc-400"}`}>
                    {!f.endsWith(":") && <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-zinc-600 font-mono tracking-wide">
        Tous les prix sont en euros HT. Hébergement européen · Données privées, jamais revendues.
      </p>
    </section>
  );
}
