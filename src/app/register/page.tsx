"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerOrganization } from "@/lib/actions";
import { Truck, ArrowLeft, ArrowRight, ShieldCheck, Mail, Lock, Building, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerOrganization(formData);
      if (result.success) {
        router.push("/login?registered=true");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-50 flex font-sans">
      
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative">
         <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
         </Link>
         <div className="max-w-md w-full mx-auto mt-12 md:mt-0">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12 w-fit">
               <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-sm flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
               </div>
               <span className="text-xl font-extrabold tracking-tight text-white">PGM</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Créer votre espace</h1>
            <p className="text-zinc-400 mb-8 leading-relaxed">
               L'ERP d'excellence pour la livraison du dernier kilomètre. Essayez gratuitement, sans carte de crédit.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
               {error && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                 </div>
               )}

               <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Nom de l'entreprise</label>
                  <div className="relative">
                     <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                     <input required name="companyName" type="text" placeholder="Transports Dupont" 
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white rounded-xl h-12 pl-10 pr-4 transition-colors placeholder:text-zinc-600 outline-none" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-300">Prénom Administrateur</label>
                     <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input required name="adminFirstName" type="text" placeholder="Jean" 
                               className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white rounded-xl h-12 pl-10 pr-4 transition-colors placeholder:text-zinc-600 outline-none" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-300">Nom</label>
                     <input required name="adminLastName" type="text" placeholder="Dupont" 
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white rounded-xl h-12 px-4 transition-colors placeholder:text-zinc-600 outline-none" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Courriel Professionnel</label>
                  <div className="relative">
                     <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                     <input required name="email" type="email" placeholder="jean@transports-dupont.fr" 
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white rounded-xl h-12 pl-10 pr-4 transition-colors placeholder:text-zinc-600 outline-none" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Mot de passe robuste</label>
                  <div className="relative">
                     <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                     <input required name="password" type="password" placeholder="••••••••" minLength={8}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-white rounded-xl h-12 pl-10 pr-4 transition-colors placeholder:text-zinc-600 outline-none" />
                  </div>
               </div>

               <button type="submit" disabled={isPending} 
                       className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 mt-4">
                  {isPending ? "Création de la base de données..." : "Démarrer l'essai"} <ArrowRight className="w-4 h-4" />
               </button>

               <p className="text-center text-sm text-zinc-500 mt-6">
                 Vous avez déjà un espace B2B ? <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">Connectez-vous</Link>.
               </p>
            </form>
         </div>
      </div>

      {/* Right Panel: Value Proposition Cover */}
      <div className="hidden lg:flex flex-1 relative bg-zinc-900 border-l border-white/5 overflow-hidden items-center justify-center">
         {/* Background Effects */}
         <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 z-0" />
         <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full" />
         <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
         
         {/* Content overlay */}
         <div className="relative z-10 max-w-lg px-12">
            <ShieldCheck className="w-16 h-16 text-emerald-500 mb-8 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
               L'écosystème où chaque kilomètre parcouru génère un centime d'intelligence.
               <span className="text-orange-500">.</span>
            </h2>
            
            <div className="space-y-6 mt-12">
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                     <span className="text-sm font-bold text-zinc-300">1</span>
                  </div>
                  <div>
                     <h4 className="font-bold text-zinc-200">Isolement militaire des données</h4>
                     <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Votre flotte, vos employés, vos marges nettes sont confinées dans un cluster étanche inatteignable par vos concurrents.</p>
                  </div>
               </div>
               
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                     <span className="text-sm font-bold text-zinc-300">2</span>
                  </div>
                  <div>
                     <h4 className="font-bold text-zinc-200">Facturation dynamique</h4>
                     <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Payez uniquement l'outil au prorata de l'usage terrain de votre flotte. Si un salarié démissionne, la facture baisse.</p>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Decorative Grid Overlay */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay z-0" />
      </div>
    </div>
  );
}

function ShieldAlert(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
