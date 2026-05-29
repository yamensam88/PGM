import { Plus } from "lucide-react";

const faqs: { q: string; a: string }[] = [
  {
    q: "Je n'ai pas le temps de tout paramétrer.",
    a: "La mise en route prend une dizaine de minutes : vous créez vos chauffeurs, véhicules et clients, et le calcul de marge tourne dès la première tournée saisie. Pas de projet d'intégration de plusieurs semaines.",
  },
  {
    q: "Je ne suis pas à l'aise avec les chiffres ou l'informatique.",
    a: "PGM est conçu par un transporteur, pour le terrain — pas pour des financiers. Vous saisissez ce que vous connaissez (colis, kilomètres, présences), l'outil fait les calculs et vous montre l'essentiel en clair.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos données sont hébergées en Europe et restent strictement les vôtres. Elles ne sont jamais revendues ni partagées. Chaque entreprise est isolée des autres.",
  },
  {
    q: "Et si ça ne me convient pas ?",
    a: "L'essai se lance sans carte bancaire et sans engagement. Vous changez d'offre ou résiliez quand vous voulez, en quelques clics.",
  },
  {
    q: "Est-ce que ça remplace mon comptable ?",
    a: "Non, c'est complémentaire. Votre comptable établit vos comptes ; PGM vous donne la rentabilité en temps réel, tournée par tournée, sans attendre le bilan annuel pour réagir.",
  },
  {
    q: "Je gère déjà tout sur Excel.",
    a: "Excel décrit le passé et dépend de votre disponibilité pour le tenir à jour. PGM recalcule en continu, relie tout automatiquement et vous alerte quand une marge se dégrade — avant qu'il ne soit trop tard.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 mb-40 scroll-mt-24">
      <div className="text-center mb-12">
        <span className="inline-block mb-6 rounded-full bg-white/5 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 font-mono tracking-widest text-[10px] uppercase">
          Questions fréquentes
        </span>
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-[1.05]">
          Tout ce que vous vous demandez<br className="hidden sm:block" /> avant de vous lancer.
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-white/5 bg-zinc-900/40 px-6 open:border-indigo-500/20 open:bg-zinc-900/60 transition-colors"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-white [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus className="h-5 w-5 shrink-0 text-indigo-400 transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="pb-6 pr-8 text-sm leading-relaxed text-zinc-400 font-light">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
