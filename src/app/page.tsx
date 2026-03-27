import Link from "next/link";
import { ArrowRight, BarChart3, ShieldAlert, Zap, Truck, Users, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "PGM | Le SaaS d'Exploitation Transport & Livraison",
  description: "Optimisez vos flottes, détectez les fraudes et maximisez votre marge nette en temps réel.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-zinc-50 font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-md">
         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
               <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
               </div>
               <span className="text-xl font-extrabold tracking-tight text-white">PGM</span>
            </div>
            <div className="flex items-center gap-4">
               <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                 Connexion
               </Link>
               <Link href="/register" className="text-sm font-bold bg-white text-zinc-950 px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors hidden sm:block">
                 Commencer l'essai gratuit
               </Link>
            </div>
         </div>
      </nav>

      <main className="pt-32 pb-16">
         {/* Hero Section */}
         <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 text-center">
            {/* Soft background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

            <Badge className="mb-6 bg-white/5 text-orange-400 border-white/10 px-3 py-1 font-medium tracking-wide shadow-none" variant="outline">
              🚀 LA RÉVOLUTION DU TRANSPORT LAST-MILE
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-8 leading-[1.1]">
              Reprenez le contrôle total <br className="hidden md:block"/> 
              de vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">marges nettes.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Fini les tableurs complexes et les estimations à vue d'œil. PGM est le premier ERP B2B qui calcule la rentabilité exacte de chaque tournée, détecte les anomalies de carburant et anticipe vos plannings RH en temps réel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link href="/register" className="h-14 px-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg flex items-center gap-2 transition-all shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)]">
                  Démarrer maintenant <ArrowRight className="w-5 h-5" />
               </Link>
               <Link href="#features" className="h-14 px-8 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-lg flex items-center border border-white/10 transition-colors">
                  Voir les fonctionnalités
               </Link>
            </div>
         </section>

         {/* Dashboard Preview / Mockup */}
         <section className="max-w-6xl mx-auto px-6 mb-32 relative">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-2 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10" />
               <div className="rounded-xl border border-white/5 bg-[#09090b] aspect-[16/9] flex flex-col overflow-hidden relative z-0">
                  {/* Fake App UI Header */}
                  <div className="h-12 border-b border-white/5 flex items-center px-4 gap-4 bg-zinc-950/50">
                     <div className="flex gap-1.5">
                       <div className="w-3 h-3 rounded-full bg-zinc-800" />
                       <div className="w-3 h-3 rounded-full bg-zinc-800" />
                       <div className="w-3 h-3 rounded-full bg-zinc-800" />
                     </div>
                     <div className="h-6 w-64 bg-zinc-800/50 rounded-md" />
                  </div>
                  {/* Fake App Body */}
                  <div className="flex-1 p-6 grid grid-cols-4 gap-6">
                     <div className="col-span-1 border-r border-white/5 pr-6 space-y-4">
                        <div className="h-8 w-full bg-zinc-800/30 rounded-md" />
                        <div className="h-8 w-3/4 bg-orange-500/10 rounded-md" />
                        <div className="h-8 w-5/6 bg-zinc-800/30 rounded-md" />
                     </div>
                     <div className="col-span-3 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                           <div className="h-24 bg-emerald-500/5 border border-emerald-500/10 rounded-xl" />
                           <div className="h-24 bg-zinc-800/30 rounded-xl" />
                           <div className="h-24 bg-red-500/5 border border-red-500/10 rounded-xl" />
                        </div>
                        <div className="h-64 bg-zinc-800/20 rounded-xl" />
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Features Section */}
         <section id="features" className="max-w-7xl mx-auto px-6 mb-32">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Pensé pour la Rentabilité Absolue.</h2>
               <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Trois piliers fondamentaux qui changent radicalement la gestion d'une entreprise de transport de marchandises.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
               {/* Feature 1 */}
               <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900/60 transition-colors">
                  <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                     <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Radar des Anomalies</h3>
                  <p className="text-zinc-400 leading-relaxed">
                     L'algorithme analyse toutes les clôtures et factures. Retrouvez instantanément les chauffeurs ayant une surconsommation de gasoil (plus de 12L/100) ou causant le plus d'usure mécanique.
                  </p>
               </div>

               {/* Feature 2 */}
               <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900/60 transition-colors">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                     <BarChart3 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Marge Nette Temps Réel</h3>
                  <p className="text-zinc-400 leading-relaxed">
                     Chaque tournée est décortiquée. PGM impute automatiquement le coût du chauffeur, le coût du véhicule (assurance, entretien), et le gasoil face au chiffre d'affaires du donneur d'ordre.
                  </p>
               </div>

               {/* Feature 3 */}
               <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl hover:bg-zinc-900/60 transition-colors">
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                     <LayoutDashboard className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Anticipation RH Totale</h3>
                  <p className="text-zinc-400 leading-relaxed">
                     Planifiez les tournées en toute sécurité. Le système bloque automatiquement l'assignation d'un chauffeur si ses congés payés ou un arrêt maladie intersectent avec la date de la livraison.
                  </p>
               </div>
            </div>
         </section>

         {/* Pricing Section */}
         <section className="max-w-5xl mx-auto px-6 mb-32">
            <div className="bg-gradient-to-b from-zinc-900 to-[#030712] border border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
               
               <div className="relative z-10">
                 <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Un tarif calqué sur votre réussite.</h2>
                 <p className="text-zinc-400 text-lg mb-12 max-w-2xl mx-auto">
                   Pas d'engagement, pas de frais cachés. Vous payez proportionnellement à la taille réelle de votre flotte sur le terrain.
                 </p>

                 <div className="bg-black/40 border border-white/10 rounded-2xl p-8 max-w-xl mx-auto backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-6">
                       <div className="text-left">
                          <h4 className="text-2xl font-bold text-white">Forfait Pro</h4>
                          <p className="text-orange-400 font-medium">1 à 5 chauffeurs actifs</p>
                       </div>
                       <div className="text-right">
                          <span className="text-4xl font-black text-white">200€</span>
                          <span className="text-zinc-500"> / mois</span>
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 mb-8 text-left">
                       <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-zinc-400" />
                          <span className="text-white font-medium">Croissance d'effectif</span>
                       </div>
                       <div className="font-bold text-emerald-400">+100€ <span className="text-zinc-500 font-normal text-sm">/ 3 chauffeurs supp.</span></div>
                    </div>

                    <ul className="space-y-4 text-left mb-8">
                       <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0"/> Plateforme Exploitation Complète</li>
                       <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0"/> Modules RH & Entretien Véhicules</li>
                       <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0"/> Intelligence Artificielle intégrée</li>
                       <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0"/> Support prioritaire</li>
                    </ul>

                    <Link href="/register" className="block w-full h-14 leading-[56px] text-center rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-lg transition-colors">
                       Créer mon espace entreprise
                    </Link>
                 </div>
               </div>
            </div>
         </section>
      </main>

      <footer className="border-t border-white/5 py-12 text-center text-zinc-500 text-sm">
         <p>© {new Date().getFullYear()} PGM Logiciel SaaS B2B. Propulsé par l'innovation de l'I.A.</p>
      </footer>
    </div>
  );
}
