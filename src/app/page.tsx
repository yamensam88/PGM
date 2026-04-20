import Link from "next/link";
import { ArrowRight, BarChart3, ShieldAlert, Zap, Route, Users, LayoutDashboard, CheckCircle2, TrendingUp, AlertTriangle, Lightbulb, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "PGM | Le SaaS d'Exploitation Transport & Livraison",
  description: "Optimisez vos flottes, détectez les fraudes et maximisez votre marge nette en temps réel.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-zinc-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-md">
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

      <main className="pt-32 pb-16">
         {/* Hero Section */}
         <section className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 text-center">
            {/* Soft background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none -z-10" />

            <Badge className="mb-6 bg-white/5 text-indigo-400 border-indigo-500/20 px-4 py-1.5 font-semibold tracking-wide shadow-none uppercase text-xs gap-2 flex items-center w-fit mx-auto inline-flex" variant="outline">
              <span className="relative flex h-2 w-2 shadow-[0_0_10px_rgba(99,102,241,0.8)]"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
              Né de l'expérience terrain
            </Badge>

            <h1 className="text-6xl md:text-8xl lg:text-[110px] xl:text-[130px] font-black tracking-tighter text-white mb-8 leading-[0.95] md:leading-[0.9]">
              Ne pilotez plus <br className="hidden sm:block" />
              <span className="text-indigo-400 inline-block pb-4 pt-2 md:pt-0 mt-2">à l'aveugle.</span>
            </h1>

            <div className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light space-y-4">
              <p>
                Le <strong>Cockpit Financier</strong> de référence conçu pour les transporteurs routiers de 3 à 50 véhicules. Tout ce dont vous avez besoin pour ne plus jamais perdre de marge sans le savoir.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link href="/register" className="h-14 px-8 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-lg flex items-center gap-2 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]">
                  Démarrer maintenant <ArrowRight className="w-5 h-5" />
               </Link>
            </div>
         </section>

         {/* Dashboard Preview / Mockup */}
         <section className="max-w-6xl mx-auto px-6 mb-40 relative">
            <div className="rounded-2xl border border-white/20 bg-white/5 p-2 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10" />
               <div className="rounded-xl border border-zinc-800 bg-[#0a0a0a] aspect-[16/9] flex flex-col overflow-hidden relative z-0">
                  {/* Fake App UI Header */}
                  <div className="h-12 border-b border-zinc-800 flex items-center px-4 gap-4 bg-zinc-900/50">
                     <div className="flex gap-1.5">
                       <div className="w-3 h-3 rounded-full bg-zinc-700" />
                       <div className="w-3 h-3 rounded-full bg-zinc-700" />
                       <div className="w-3 h-3 rounded-full bg-zinc-700" />
                     </div>
                     <div className="h-6 w-64 bg-zinc-800 rounded-md" />
                  </div>
                  {/* Fake App Body */}
                  <div className="flex-1 p-6 grid grid-cols-4 gap-6 bg-[#0a0a0a]">
                     <div className="col-span-1 border-r border-zinc-800 pr-6 space-y-4">
                        <div className="h-8 w-full bg-indigo-500/20 border border-indigo-500/30 rounded-md" />
                        <div className="h-8 w-3/4 bg-zinc-800/50 rounded-md" />
                        <div className="h-8 w-5/6 bg-zinc-800/50 rounded-md" />
                     </div>
                     <div className="col-span-3 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                           <div className="h-24 bg-zinc-900 border border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                              <div className="flex justify-between items-center"><div className="w-1/2 h-2.5 bg-zinc-700 rounded-full"></div><div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center"><div className="w-3 h-3 text-indigo-400 rounded-full border border-indigo-400/50"></div></div></div>
                              <div><div className="w-3/4 h-5 bg-zinc-200 rounded-md mb-2"></div><div className="w-1/3 h-2 bg-emerald-400 rounded-full"></div></div>
                           </div>
                           <div className="h-24 bg-zinc-900 border border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                              <div className="flex justify-between items-center"><div className="w-1/2 h-2.5 bg-zinc-700 rounded-full"></div><div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center"><div className="w-3 h-3 text-emerald-400 rounded-full border border-emerald-400/50"></div></div></div>
                              <div><div className="w-3/4 h-5 bg-zinc-200 rounded-md mb-2"></div><div className="w-1/3 h-2 bg-emerald-400 rounded-full"></div></div>
                           </div>
                           <div className="h-24 bg-zinc-900 border border-zinc-800 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                              <div className="flex justify-between items-center"><div className="w-1/2 h-2.5 bg-zinc-700 rounded-full"></div><div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center"><div className="w-3 h-3 text-rose-400 rounded-full border border-rose-400/50"></div></div></div>
                              <div><div className="w-1/2 h-5 bg-zinc-200 rounded-md mb-2"></div><div className="w-1/2 h-2 bg-rose-400 rounded-full"></div></div>
                           </div>
                        </div>
                        <div className="h-64 bg-zinc-900 border border-zinc-800 shadow-sm rounded-xl relative overflow-hidden flex flex-col p-5">
                           <div className="flex justify-between items-center mb-6">
                              <div className="h-4 w-48 bg-zinc-700 rounded-full"></div>
                              <div className="flex gap-2">
                                 <div className="h-6 w-16 bg-zinc-800 rounded-full"></div>
                                 <div className="h-6 w-16 bg-indigo-500/20 rounded-full border border-indigo-500/30"></div>
                              </div>
                           </div>
                           <div className="flex-1 border-b border-l border-zinc-800 relative mt-4">
                              <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-indigo-500/20 to-transparent clip-path-chart z-0"></div>
                           </div>
                           <div className="flex justify-between mt-3 px-2">
                              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map(d => <div key={d} className="text-[10px] font-medium text-zinc-500">{d}</div>)}
                           </div>
                           <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none z-20" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* 3 KPI Blocks */}
         <section className="max-w-7xl mx-auto px-6 mb-32">
           <div className="grid md:grid-cols-3 gap-6">
              {/* Box 1 */}
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
                 <div className="text-6xl lg:text-[80px] font-black tracking-tighter text-indigo-400 mb-6 leading-none">68 500</div>
                 <p className="text-zinc-400 leading-relaxed mb-8 text-sm md:text-base">
                   entreprises européennes de transport ont fermé en 2025. Le transport fait partie des secteurs les plus exposés.
                 </p>
                 <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">Altares • Bilan 2025</div>
              </div>
              {/* Box 2 */}
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
                 <div className="text-6xl lg:text-[80px] font-black tracking-tighter text-white mb-6 leading-none">+7.7%</div>
                 <p className="text-zinc-400 leading-relaxed mb-8 text-sm md:text-base">
                   de hausse des coûts d'exploitation en 2 ans. Quand les coûts montent plus vite que vos prix, la marge se dégrade sans bruit.
                 </p>
                 <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">CNR • Bilan 2025</div>
              </div>
              {/* Box 3 */}
              <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
                 <div className="text-6xl lg:text-[80px] font-black tracking-tighter text-white mb-6 leading-none">1<span className="text-indigo-400">×/an</span></div>
                 <p className="text-zinc-400 leading-relaxed mb-8 text-sm md:text-base">
                   C'est encore le rythme auquel beaucoup d'entreprises recalculent réellement leur rentabilité. Trop tard pour corriger à temps.
                 </p>
                 <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">Observation terrain PGM</div>
              </div>
           </div>
         </section>

         {/* Intertitle Massive */}
         <section className="max-w-6xl mx-auto px-6 mb-32 text-center">
           <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1]">
             Votre flotte roule déjà.<br />
             <span className="text-indigo-400">Il est temps de savoir ce qu'elle<br className="hidden md:block" /> vous rapporte vraiment.</span>
           </h2>
         </section>

         {/* Bento Grid Features */}
         <section className="max-w-7xl mx-auto px-6 mb-32">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                
                {/* Cost Box */}
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-zinc-900/80 to-zinc-950 relative overflow-hidden">
                    <div className="flex-1 z-10 w-full">
                       <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6">
                         <BarChart3 className="w-6 h-6 text-indigo-400" />
                       </div>
                       <h3 className="text-2xl font-bold text-white mb-4">Votre coût de revient réel, chaque mois</h3>
                       <p className="text-zinc-400 leading-relaxed mb-6 font-light">
                         PGM calcule automatiquement votre coût de revient, votre marge et votre seuil de rentabilité à partir de vos données réelles.
                       </p>
                       <div className="flex flex-wrap gap-2">
                           <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500">COÛT DE REVIENT</Badge>
                           <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500">MARGE NETTE</Badge>
                           <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500">SEUIL DE RENTABILITÉ</Badge>
                       </div>
                    </div>
                    <div className="w-full md:w-2/5 shrink-0 select-none z-10">
                        <div className="flex flex-col gap-3">
                            <div className="bg-[#030712] border border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-lg">
                                <span className="text-[10px] font-mono tracking-widest text-zinc-500">COÛT/KM</span>
                                <span className="font-bold text-white text-lg">1,84€</span>
                            </div>
                            <div className="bg-[#030712] border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-emerald-500/5">
                                <span className="text-[10px] font-mono tracking-widest text-zinc-500">MARGE NETTE</span>
                                <span className="font-bold text-emerald-400 text-lg">+12,4%</span>
                            </div>
                            <div className="bg-[#030712] border border-indigo-500/20 rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-indigo-500/5">
                                <span className="text-[10px] font-mono tracking-widest text-zinc-500">SEUIL</span>
                                <span className="font-bold text-white text-lg">1,61€</span>
                            </div>
                            {/* Small decorative bar chart */}
                            <div className="flex items-end h-12 gap-1 mt-2">
                                {[3, 4, 4, 5, 6, 5, 7].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm" style={{ height: `${h * 12}%`, opacity: 0.3 + (i * 0.1) }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulateur AO Box */}
                <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-zinc-900/80 to-zinc-950 relative overflow-hidden">
                    <div className="flex-1 z-10 w-full">
                       <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6">
                         <Route className="w-6 h-6 text-indigo-400" />
                       </div>
                       <h3 className="text-2xl font-bold text-white mb-4">Répondez aux bons appels d'offres</h3>
                       <p className="text-zinc-400 leading-relaxed mb-6 font-light">
                         Avant de vous engager, PGM simule la rentabilité d'un contrat. En quelques minutes, vous savez si un contrat mérite d'être signé, négocié ou refusé.
                       </p>
                       <div className="flex flex-wrap gap-2">
                           <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500">SIMULATION AO</Badge>
                           <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500">BREAK-EVEN</Badge>
                           <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500">RISQUE DE MARGE</Badge>
                       </div>
                    </div>
                    <div className="w-full md:w-2/5 shrink-0 select-none z-10">
                        <div className="flex flex-col gap-3">
                            <div className="bg-[#030712] border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-center shadow-lg relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50"></div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                                    <span className="text-sm font-bold text-white">Contrat A</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500 pl-4">Rentable · +8,2%</span>
                            </div>
                            <div className="bg-[#030712]/50 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-center shadow-lg relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50"></div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                                    <span className="text-sm font-bold text-white">Contrat B</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500 pl-4">Attention marge</span>
                            </div>
                            <div className="bg-[#030712]/50 border border-red-500/30 rounded-2xl p-4 flex flex-col justify-center shadow-lg relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50"></div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"></div>
                                    <span className="text-sm font-bold text-white opacity-80">Contrat C</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500 pl-4">Ne pas signer</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Diagnostic Box (Full width) */}
            <div className="bg-zinc-900/40 border border-white/5 p-8 md:p-12 rounded-3xl flex flex-col md:flex-row gap-12 items-center bg-gradient-to-tr from-zinc-900/80 to-[#030712] relative overflow-hidden">
                 <div className="flex-1 z-10 w-full">
                    <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6">
                      <ShieldAlert className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Comprenez exactement pourquoi votre marge baisse</h3>
                    <p className="text-zinc-400 leading-relaxed mb-8 max-w-xl font-light">
                      Carburant, entretien, péages, salaires : PGM identifie les écarts et les quantifie poste par poste.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500 px-3 py-1.5">WATERFALL</Badge>
                        <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500 px-3 py-1.5">IMPACT BRIDGE</Badge>
                        <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500 px-3 py-1.5">PLAN DE RÉSOLUTION</Badge>
                        <Badge variant="outline" className="bg-black/30 border-white/5 text-[10px] tracking-widest font-mono text-zinc-500 px-3 py-1.5">DIAGNOSTIC POSTE PAR POSTE</Badge>
                    </div>
                 </div>
                 <div className="w-full md:w-1/2 shrink-0 select-none z-10">
                     <div className="flex flex-col gap-4 pl-0 md:pl-12 border-l-0 md:border-l border-white/5">
                         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <div>
                               <h4 className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-0.5 font-mono">Mesuré</h4>
                               <p className="text-zinc-500 text-xs">Donnée réelle saisie</p>
                            </div>
                         </div>
                         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-colors">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                            <div>
                               <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-0.5 font-mono">Projeté</h4>
                               <p className="text-zinc-500 text-xs">Extrapolé de vos tendances</p>
                            </div>
                         </div>
                         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-colors">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                            <div>
                               <h4 className="text-amber-400 font-bold uppercase tracking-widest text-[10px] mb-0.5 font-mono">Estimé</h4>
                               <p className="text-zinc-500 text-xs">Hypothèse documentée</p>
                            </div>
                         </div>
                         <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-600"></div>
                            <div>
                               <h4 className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mb-0.5 font-mono">Manquant</h4>
                               <p className="text-zinc-500 text-xs">Aucun calcul fantôme</p>
                            </div>
                         </div>
                     </div>
                 </div>
            </div>
         </section>

         {/* Actionable Strategy Section */}
         <section className="max-w-7xl mx-auto px-6 mb-40">
           <div className="flex flex-col lg:flex-row gap-16 items-center">
             <div className="flex-1 space-y-8">
               <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 font-mono tracking-widest text-[10px] uppercase">Au-delà du calcul</Badge>
               <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[1.1]">
                 PGM ne vous dit pas seulement où vous en êtes.<br />
                 <span className="italic font-serif font-light text-indigo-400">Il vous dit quoi faire.</span>
               </h2>
               <p className="text-zinc-400 leading-relaxed text-lg font-light max-w-xl">
                 La plupart des outils mesurent. PGM met en évidence les actions prioritaires. Pour chaque écart détecté, il identifie le levier à actionner, quantifie son impact et estime le délai de retour.
               </p>
               
               <div className="pt-4 space-y-6">
                 <div className="flex gap-4 items-start">
                   <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                     <TrendingUp className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div>
                     <h4 className="text-white font-bold mb-1">Identification du levier prioritaire</h4>
                     <p className="text-zinc-500 text-sm leading-relaxed">Carburant, masse salariale, péages, sous-traitance — PGM identifie le poste qui pèse le plus sur votre rentabilité ce mois-ci.</p>
                   </div>
                 </div>
                 <div className="flex gap-4 items-start">
                   <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                     <Clock className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div>
                     <h4 className="text-white font-bold mb-1">Impact financier quantifié</h4>
                     <p className="text-zinc-500 text-sm leading-relaxed">Chaque recommandation est chiffrée : +X €/mois si vous ajustez ce tarif, -Y % si vous optimisez ce poste.</p>
                   </div>
                 </div>
               </div>
             </div>

             <div className="w-full lg:w-[500px] xl:w-[600px] shrink-0">
               <div className="bg-[#050505] border border-zinc-800 rounded-3xl p-8 relative shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                 
                 <div className="flex gap-4 items-center mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                     <Lightbulb className="w-6 h-6 text-indigo-400" />
                   </div>
                   <div>
                     <h4 className="font-bold text-white text-lg">Recommandation stratégique</h4>
                     <p className="text-zinc-400 text-sm">Augmenter le prix de vente de 3%</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4 mb-8">
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                     <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 mb-2">Amélioration<br/>Projetée</div>
                     <div className="font-bold text-emerald-400 text-xl">+3%</div>
                   </div>
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                     <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 mb-2">Impact<br/>Financier</div>
                     <div className="font-bold text-emerald-400 text-xl">+432 €<span className="text-xs font-normal text-zinc-500">/mois</span></div>
                   </div>
                   <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                     <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 mb-2">Délai<br/>d'action</div>
                     <div className="font-bold text-white text-lg mt-2">Immédiat</div>
                   </div>
                 </div>

                 <div className="mb-6 pb-6 border-b border-white/5">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">Situation Actuelle</span>
                     <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-500">Après Optimisation</span>
                   </div>
                   <div className="flex justify-between items-center text-sm py-1">
                     <span className="text-zinc-400">Prix de vente</span>
                     <div className="flex items-center gap-4">
                       <span className="text-zinc-300">1,35 €/km</span>
                       <ArrowRight className="w-3 h-3 text-zinc-600" />
                       <span className="text-emerald-400">1,39 €/km</span>
                     </div>
                   </div>
                   <div className="flex justify-between items-center text-sm py-1">
                     <span className="text-zinc-400">Marge nette</span>
                     <div className="flex items-center gap-4">
                       <span className="text-rose-400">0,04 €/km</span>
                       <ArrowRight className="w-3 h-3 text-zinc-600" />
                       <span className="text-emerald-400 font-bold">0,08 €/km ×2</span>
                     </div>
                   </div>
                 </div>

                 <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5 mb-4">
                   <div className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 mb-2">Impact Opérationnel</div>
                   <p className="text-sm text-indigo-200/70 leading-relaxed font-light">
                     Sur 10 800 km/mois, une hausse de tarif de 3% génère 432 € de marge supplémentaire. Votre profit mensuel double de 439 € à 871 €.
                   </p>
                 </div>
                 
                 <div className="text-[10px] font-mono text-zinc-600">
                   Risque faible • Applicable immédiatement
                 </div>
               </div>
             </div>
           </div>
         </section>

      </main>

      <footer className="border-t border-white/5 py-12 text-center text-zinc-500 text-sm space-y-2">
         <p>© {new Date().getFullYear()} PGM Logiciel SaaS B2B. Propulsé par l'innovation de l'I.A.</p>
         <p className="text-xs text-zinc-600 font-medium tracking-wide">Développé et créé par <span className="text-zinc-400">SR</span></p>
      </footer>
    </div>
  );
}
