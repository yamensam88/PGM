import Link from "next/link";
import { ArrowRight, BarChart3, ShieldAlert, Zap, Route, Users, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InteractiveSimulator } from "@/components/marketing/InteractiveSimulator";
import { FadeIn } from "@/components/marketing/FadeIn";

export const metadata = {
  title: "PGM | Le SaaS d'Exploitation Transport & Livraison",
  description: "Optimisez vos flottes, détectez les fraudes et maximisez votre marge nette en temps réel.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-zinc-50 font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
               <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center p-0.5">
                  <img src="/logo.png" alt="PGM Icon" className="w-full h-full object-contain" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xl font-extrabold tracking-tight text-white leading-none">PGM</span>
                 <span className="text-[9px] text-zinc-400 font-medium tracking-widest mt-1">PILOTAGE • GESTION • MAÎTRISE</span>
               </div>
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

      <main className="pt-24 pb-16">
         {/* Categories Banner */}
         <div className="w-full border-b border-white/5 bg-white/[0.02]">
            <div className="max-w-7xl mx-auto px-6 py-4 flex text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-widest gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide justify-center">
               <span className="hover:text-white transition-colors cursor-pointer">Transport Routier</span>
               <span className="text-zinc-800">|</span>
               <span className="hover:text-white transition-colors cursor-pointer">Sous-Traitants</span>
               <span className="text-zinc-800">|</span>
               <span className="hover:text-white transition-colors cursor-pointer">PME Fret</span>
               <span className="text-zinc-800">|</span>
               <span className="hover:text-white transition-colors cursor-pointer">Appels d'Offres</span>
               <span className="text-zinc-800">|</span>
               <span className="hover:text-white transition-colors cursor-pointer">Messagerie</span>
               <span className="text-zinc-800">|</span>
               <span className="hover:text-white transition-colors cursor-pointer">Longue Distance</span>
            </div>
         </div>

         {/* Hero Section */}
         <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
            {/* Dynamic Aurora Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-orange-600/10 via-red-600/10 to-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <FadeIn delay={0.1}>
               <Badge className="mb-8 bg-black border-orange-500/20 text-orange-400 px-4 py-1.5 font-semibold tracking-wide shadow-none uppercase text-xs gap-2 flex items-center w-fit mx-auto inline-flex" variant="outline">
                 <span className="relative flex h-2 w-2 shadow-[0_0_10px_rgba(249,115,22,0.8)]"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>
                 Né de l'expérience terrain
               </Badge>

               <h1 className="text-6xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-8 leading-[1.05]">
                 Ne pilotez plus à l'<br className="block md:hidden" />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 inline-block pb-2 pt-2 md:pt-0">aveugle.</span>
               </h1>

               <div className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light space-y-4">
                 <p>
                   Le <strong>Cockpit Financier</strong> de référence conçu pour les transporteurs routiers de 3 à 50 véhicules. Calculez enfin votre coût de revient réel, votre <strong>seuil de rentabilité</strong> et surveillez la marge nette de vos contrats au jour le jour.
                 </p>
               </div>
            </FadeIn>

            <FadeIn delay={0.2} direction="up">
               <InteractiveSimulator />
            </FadeIn>

            <FadeIn delay={0.3}>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register" className="h-14 px-8 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-lg flex items-center gap-2 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                     Démarrer maintenant <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="#features" className="h-14 px-8 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-lg flex items-center border border-white/10 transition-colors backdrop-blur-md">
                     Voir les fonctionnalités
                  </Link>
               </div>
            </FadeIn>
         </section>

         {/* Dashboard Preview / Mockup in 3D */}
         <section className="max-w-6xl mx-auto px-6 mb-40 relative" style={{ perspective: "2000px" }}>
            <FadeIn delay={0.4}>
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20 pointer-events-none" />
               <div 
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 shadow-[0_50px_100px_-20px_rgba(249,115,22,0.15)] relative overflow-hidden group transition-transform duration-1000 ease-out hover:rotate-0"
                  style={{ transform: "rotateX(15deg) rotateY(-5deg) scale(0.95)" }}
               >
                  <div className="rounded-xl border border-white/10 bg-[#05060A] aspect-[16/9] flex flex-col overflow-hidden relative z-0">
                     {/* Fake App UI Header */}
                     <div className="h-12 border-b border-white/5 flex items-center px-4 gap-4 bg-[#0A0D14]">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-white/20" />
                          <div className="w-3 h-3 rounded-full bg-white/20" />
                          <div className="w-3 h-3 rounded-full bg-white/20" />
                        </div>
                        <div className="h-6 w-64 bg-white/5 rounded-md" />
                     </div>
                     {/* Fake App Body */}
                     <div className="flex-1 p-6 grid grid-cols-4 gap-6 bg-transparent">
                        <div className="col-span-1 border-r border-white/5 pr-6 space-y-4">
                           <div className="h-8 w-full bg-white/10 rounded-md" />
                           <div className="h-8 w-3/4 bg-white/5 rounded-md" />
                           <div className="h-8 w-5/6 bg-white/5 rounded-md" />
                        </div>
                        <div className="col-span-3 space-y-6">
                           <div className="grid grid-cols-3 gap-4">
                              <div className="h-24 bg-white/5 border border-white/10 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                                 <div className="flex justify-between items-center"><div className="w-1/2 h-2.5 bg-white/20 rounded-full"></div><div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center"><div className="w-3 h-3 text-blue-500 rounded-full border border-blue-500/50"></div></div></div>
                                 <div><div className="w-3/4 h-5 bg-white/10 rounded-md mb-2"></div><div className="w-1/3 h-2 bg-blue-400 rounded-full"></div></div>
                              </div>
                              <div className="h-24 bg-white/5 border border-white/10 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                                 <div className="flex justify-between items-center"><div className="w-1/2 h-2.5 bg-white/20 rounded-full"></div><div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"><div className="w-3 h-3 text-emerald-500 rounded-full border border-emerald-500/50"></div></div></div>
                                 <div><div className="w-3/4 h-5 bg-white/10 rounded-md mb-2"></div><div className="w-1/3 h-2 bg-emerald-400 rounded-full"></div></div>
                              </div>
                              <div className="h-24 bg-white/5 border border-white/10 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                                 <div className="flex justify-between items-center"><div className="w-1/2 h-2.5 bg-white/20 rounded-full"></div><div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"><div className="w-3 h-3 text-red-500 rounded-full border border-red-500/50"></div></div></div>
                                 <div><div className="w-1/2 h-5 bg-white/10 rounded-md mb-2"></div><div className="w-1/2 h-2 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.8)]"></div></div>
                              </div>
                           </div>
                           <div className="h-64 bg-white/5 border border-white/10 shadow-sm rounded-xl relative overflow-hidden flex flex-col p-5">
                              <div className="flex justify-between items-center mb-6">
                                 <div className="h-4 w-48 bg-white/20 rounded-full"></div>
                                 <div className="flex gap-2">
                                    <div className="h-6 w-16 bg-white/10 rounded-full"></div>
                                    <div className="h-6 w-16 bg-blue-500/20 rounded-full border border-blue-500/30"></div>
                                 </div>
                              </div>

                           {/* Fake Chart Lines */}
                           <div className="flex-1 border-b border-l border-slate-100 relative mt-4">
                              <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-blue-500/10 to-transparent clip-path-chart z-0"></div>
                              <div className="absolute bottom-[20%] left-[10%] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>
                              <div className="absolute bottom-[40%] left-[30%] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>
                              <div className="absolute bottom-[30%] left-[50%] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>
                              <div className="absolute bottom-[70%] left-[70%] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>
                              <div className="absolute bottom-[60%] left-[90%] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10"></div>
                           </div>
                           <div className="flex justify-between mt-3 px-2">
                              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(d => <div key={d} className="text-[10px] font-medium text-slate-400">{d}</div>)}
                           </div>
                           <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none z-20" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            </FadeIn>
         </section>

         {/* Features Section */}
         <section id="features" className="max-w-7xl mx-auto px-6 mb-40">
            <FadeIn delay={0.1}>
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-sm">Pensé pour la Rentabilité Absolue.</h2>
                  <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Trois piliers fondamentaux qui changent radicalement la gestion d'une entreprise de transport de marchandises.</p>
               </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8">
               {/* Feature 1 */}
               <FadeIn delay={0.2}>
                  <div className="bg-[#05060A] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.02] hover:border-white/10 transition-all duration-500 group">
                     <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
                        <ShieldAlert className="w-7 h-7" />
                     </div>
                     <Badge variant="outline" className="mb-4 bg-red-500/10 border-red-500/20 text-red-400 font-mono text-[10px] tracking-widest shadow-none rounded-md px-2 py-1">
                       [ EN QUELQUES SECONDES ]
                     </Badge>
                     <h3 className="text-xl font-bold text-white mb-3">Radar des Anomalies</h3>
                     <p className="text-zinc-400 leading-relaxed text-sm">
                        Carburant, entretien, péages, salaires : PGM identifie les écarts et les quantifie pour que vous compreniez exactement pourquoi votre marge baisse. Retrouvez instantanément les chauffeurs extravagants.
                     </p>
                  </div>
               </FadeIn>

               {/* Feature 2 */}
               <FadeIn delay={0.3}>
                  <div className="bg-[#05060A] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.02] hover:border-white/10 transition-all duration-500 group">
                     <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                        <BarChart3 className="w-7 h-7" />
                     </div>
                     <Badge variant="outline" className="mb-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-mono text-[10px] tracking-widest shadow-none rounded-md px-2 py-1">
                       [ BREAK-EVEN & MARGE RÉELLE ]
                     </Badge>
                     <h3 className="text-xl font-bold text-white mb-3">Marge Nette Temps Réel</h3>
                     <p className="text-zinc-400 leading-relaxed text-sm">
                        Chaque tournée est décortiquée. PGM impute automatiquement le coût réel du chauffeur, l'usure du véhicule et le gasoil face au chiffre d'affaires du donneur d'ordre, pour un résultat comptable immédiat.
                     </p>
                  </div>
               </FadeIn>

               {/* Feature 3 */}
               <FadeIn delay={0.4}>
                  <div className="bg-[#05060A] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.02] hover:border-white/10 transition-all duration-500 group">
                     <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                        <LayoutDashboard className="w-7 h-7" />
                     </div>
                     <Badge variant="outline" className="mb-4 bg-blue-500/10 border-blue-500/20 text-blue-400 font-mono text-[10px] tracking-widest shadow-none rounded-md px-2 py-1">
                       [ SIMULATION AO ]
                     </Badge>
                     <h3 className="text-xl font-bold text-white mb-3">Anticipation et Contrats</h3>
                     <p className="text-zinc-400 leading-relaxed text-sm">
                        En quelques minutes, vous savez si un contrat mérite d'être signé, négocié ou refusé. Simulez vos futures tournées en vous basant sur vos historiques de coûts pour ne plus jamais rouler à perte.
                     </p>
                  </div>
               </FadeIn>
            </div>
         </section>

         {/* Methodology Section */}
         <section className="max-w-5xl mx-auto px-6 mb-32">
            <FadeIn delay={0.2} direction="up">
               <div className="bg-[#05060A] border border-white/5 rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                  
                  <div className="text-center mb-16">
                     <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">Aucun calcul fantôme.</h2>
                     <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                       PGM s'appuie sur la doctrine de la donnée vraie. Vous ne pilotez plus sur une intuition, mais sur de l'analytique pure.
                     </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                     <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/[0.02] hover:border-emerald-500/30 transition-all duration-300">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                        <div>
                           <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-1">Mesuré</h4>
                           <p className="text-zinc-400 text-sm">Donnée réelle saisie quotidiennement par les exploitants de la flotte.</p>
                        </div>
                     </div>
                     <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/[0.02] hover:border-blue-500/30 transition-all duration-300">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                        <div>
                           <h4 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-1">Projeté</h4>
                           <p className="text-zinc-400 text-sm">Extrapolé mathématiquement de vos propres tendances et marges lissées.</p>
                        </div>
                     </div>
                     <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/[0.02] hover:border-orange-500/30 transition-all duration-300">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                        <div>
                           <h4 className="text-orange-400 font-bold uppercase tracking-wider text-xs mb-1">Estimé</h4>
                           <p className="text-zinc-400 text-sm">Hypothèse financière documentée et validée par les indices routiers (CNR).</p>
                        </div>
                     </div>
                     <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-zinc-600 mt-1.5"></div>
                        <div>
                           <h4 className="text-zinc-400 font-bold uppercase tracking-wider text-xs mb-1">Traçable</h4>
                           <p className="text-zinc-500 text-sm italic">Absolument aucun indicateur de rentabilité n'est deviné ni laissé au hasard avec PGM.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-16 text-center">
                      <Link href="/register" className="h-14 px-8 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-lg inline-flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                         Rejoindre l'infrastructure PGM <ArrowRight className="w-5 h-5" />
                      </Link>
                  </div>
               </div>
            </FadeIn>
         </section>
      </main>

      <footer className="border-t border-white/5 py-12 text-center text-zinc-500 text-sm space-y-2">
         <p>© {new Date().getFullYear()} PGM Logiciel SaaS B2B. Propulsé par l'innovation de l'I.A.</p>
         <p className="text-xs text-zinc-600 font-medium tracking-wide">Développé et créé par <span className="text-zinc-400">SR</span></p>
      </footer>
    </div>
  );
}
