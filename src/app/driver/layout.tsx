import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { UserButton } from "@/components/auth/UserButton";
import { Bell, Ban, Lock } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (session?.user && ['admin', 'owner', 'dispatcher', 'manager'].includes(session.user.role as string)) {
     redirect("/dispatch/dashboard");
  }

  const orgId = session?.user?.organization_id;

  let isTrialLocked = false;
  let isSuspended = false;

  if (orgId) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    
    if (org?.subscription_status === 'suspended') {
       isSuspended = true;
    }

    if (org?.subscription_status === 'trialing' && org.created_at) {
       const trialEndMs = org.created_at.getTime() + (7 * 24 * 60 * 60 * 1000);
       const nowMs = Date.now();
       const remainingTrialDays = Math.max(0, Math.ceil((trialEndMs - nowMs) / (1000 * 3600 * 24)));
       if (remainingTrialDays <= 0) {
          isTrialLocked = true;
       }
    }
  }

  const isLocked = isSuspended || isTrialLocked;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#f8f9fc] overscroll-none">
      {/* Mobile Top Header (App-like) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm md:hidden">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
             <span className="text-white font-extrabold text-[15px] tracking-tighter">PGM</span>
           </div>
           <span className="font-bold text-zinc-900 tracking-tight text-lg">Driver</span>
        </div>
        <div className="flex items-center gap-3">
           {!isLocked && (
             <button className="text-zinc-400 hover:text-zinc-800 transition-colors p-2 relative bg-zinc-50 rounded-full border border-zinc-100">
               <Bell className="w-[18px] h-[18px]" />
               <span className="absolute top-1.5 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-zinc-50"></span>
             </button>
           )}
           <UserButton />
        </div>
      </header>

      {/* Desktop Helper Warning - Shown only on large screens since this is a mobile app */}
      <div className="hidden md:flex bg-orange-50 border-b border-orange-200 p-2 justify-center items-center text-orange-700 text-sm font-medium">
        L'interface Chauffeur est optimisée pour une utilisation sur téléphone mobile.
      </div>

      {/* Main App Content Area */}
      <div className="flex-1 w-full max-w-lg mx-auto pb-[90px] pt-4 px-4 overflow-y-auto w-full scroll-smooth">
          {isSuspended ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4 bg-white border border-red-200 rounded-3xl shadow-lg p-8 w-full mt-4">
               <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2 mx-auto"><Ban className="w-10 h-10" /></div>
               <h2 className="text-3xl font-black text-red-600 tracking-tight leading-tight">Accès<br/>Désactivé</h2>
               <p className="text-zinc-600 text-[15px] mt-4 leading-relaxed font-medium">
                 L'exploitation de l'entreprise est temporairement suspendue.
               </p>
               <p className="text-zinc-400 text-xs">Veuillez contacter votre direction.</p>
            </div>
          ) : isTrialLocked ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4 bg-white border border-red-100 rounded-3xl shadow-md p-8 w-full mt-4">
               <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2 mx-auto"><Lock className="w-10 h-10" /></div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Période d'essai<br/>Terminée</h2>
               <p className="text-slate-500 text-[15px] mt-4 leading-relaxed">
                 L'accès à l'application Driver est bloqué. La direction doit valider l'abonnement sur l'espace d'exploitation.
               </p>
            </div>
          ) : (
            children
          )}
      </div>

      {/* iOS/Android Style Bottom Navigation */}
      {!isLocked && <MobileBottomNav />}
    </div>
  );
}
