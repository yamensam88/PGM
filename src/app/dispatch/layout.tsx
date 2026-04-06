export const dynamic = 'force-dynamic';

import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import nextDynamic from "next/dynamic";

const OnboardingTour = nextDynamic(() => import("@/components/OnboardingTour").then((mod) => mod.OnboardingTour), { ssr: false });
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { Lock, AlertCircle, ArrowRight, Ban } from "lucide-react";

export default async function DispatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || "dispatcher";
  const userPermissions = (session?.user as any)?.permissions || {};
  const orgId = session?.user?.organization_id;

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isBillingPage = pathname.includes('/settings/billing');

  let isSuperAdmin = false;
  let remainingTrialDays = 0;
  let isTrialLocked = false;
  let isTrialing = false;
  let isSuspended = false;
  let renewalDaysRemaining: number | null = null;

  if (orgId) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    
    if (userRole === "owner") {
      const masterOrg = await prisma.organization.findFirst({ orderBy: { created_at: 'asc' } });
      if (masterOrg?.id === orgId) {
        isSuperAdmin = true;
      }
    }

    if (org?.subscription_status === 'suspended') {
       isSuspended = true;
    }

    if (org?.subscription_status === 'active') {
       // Check settings_json for a simulated or injected current_period_end
       const settings = typeof org.settings_json === 'string' 
          ? JSON.parse(org.settings_json) 
          : (org.settings_json as any || {});
       
       if (settings?.current_period_end) {
          const endMs = new Date(settings.current_period_end).getTime();
          const nowMs = Date.now();
          const diffDays = Math.ceil((endMs - nowMs) / (1000 * 3600 * 24));
          if (diffDays <= 7 && diffDays > 0) {
             renewalDaysRemaining = diffDays;
          }
       }
    }

    if (org?.subscription_status === 'trialing' && org.created_at) {
       isTrialing = true;
       const trialEndMs = org.created_at.getTime() + (7 * 24 * 60 * 60 * 1000);
       const nowMs = Date.now();
       remainingTrialDays = Math.max(0, Math.ceil((trialEndMs - nowMs) / (1000 * 3600 * 24)));
       if (remainingTrialDays <= 0) {
          isTrialLocked = true;
       }
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-[#f8f9fc]">
      <Sidebar userRole={userRole} isSuperAdmin={isSuperAdmin} userPermissions={userPermissions} />
      <div className="flex flex-col flex-1 w-full md:pl-64 transition-all duration-300">
        <OnboardingTour />

        {isTrialing && !isTrialLocked && (
          <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-center flex-wrap gap-4 text-sm font-medium sticky top-0 z-50 shadow-sm border-b border-orange-600/50">
             <div className="flex items-center gap-2">
               <AlertCircle className="w-4 h-4 hidden sm:block" />
               <span>Période d'essai en cours : Il vous reste {remainingTrialDays} jour{remainingTrialDays > 1 ? 's' : ''}.</span>
             </div>
              <Link href="/dispatch/settings/billing" className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wider ml-auto sm:ml-4 border border-white/10">
                 Prendre l'abonnement <ArrowRight className="w-3 h-3" />
              </Link>
           </div>
         )}

         {renewalDaysRemaining !== null && (
           <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-center flex-wrap gap-4 text-sm font-medium sticky top-0 z-50 shadow-sm border-b border-blue-700/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 hidden sm:block" />
                <span>Votre cycle de facturation se renouvelle dans {renewalDaysRemaining} jour{renewalDaysRemaining > 1 ? 's' : ''}.</span>
              </div>
              <Link href="/dispatch/settings/billing" className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-md flex items-center gap-1.5 transition-colors text-xs font-bold uppercase tracking-wider ml-auto sm:ml-4 border border-blue-400">
                 Gérer mon forfait <ArrowRight className="w-3 h-3" />
              </Link>
           </div>
         )}
 
         <Header mobileMenu={<MobileSidebar userRole={userRole} isSuperAdmin={isSuperAdmin} userPermissions={userPermissions} />} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 pb-20 relative">
          {isSuspended ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 bg-white border border-red-200 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto mt-12 relative z-10">
               <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 mx-auto"><Ban className="w-12 h-12" /></div>
               <div>
                  <h2 className="text-3xl font-black text-red-600 tracking-tight">Compte Désactivé</h2>
                  <p className="text-slate-600 max-w-md mx-auto text-[16px] mt-4 leading-relaxed font-medium">
                    Votre espace de travail a été suspendu par l'administration du service. Vous n'avez temporairement plus accès à l'exploitation PGM.
                  </p>
                  <p className="text-slate-500 max-w-sm mx-auto text-[14px] mt-4">
                    Veuillez contacter le support ou vérifier vos impayés pour réactiver votre abonnement.
                  </p>
               </div>
            </div>
          ) : isTrialLocked && !isBillingPage ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 bg-white border border-red-100 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto mt-12 relative z-10">
               <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 mx-auto"><Lock className="w-10 h-10" /></div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Période d'essai terminée</h2>
                  <p className="text-slate-500 max-w-md mx-auto text-[15px] mt-3 leading-relaxed">
                    Votre accès gratuit de 7 jours est arrivé à son terme. L'accès à votre exploitation et vos données CRM est temporairement bloqué.
                  </p>
               </div>
               <div className="w-full h-px bg-slate-100 my-4"></div>
               <Link href="/dispatch/settings/billing" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 inline-flex justify-center items-center gap-2 mt-4 text-[15px]">
                  Débloquer mon espace avec l'abonnement <ArrowRight className="w-5 h-5" />
               </Link>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
