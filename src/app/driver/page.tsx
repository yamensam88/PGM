import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Truck, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DriverHome() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const orgId = session.user.organization_id;

  let driver = null;
  if (['admin', 'owner', 'dispatcher', 'manager'].includes(session.user.role as string)) {
    driver = await prisma.driver.findFirst({ where: { organization_id: orgId } });
  } else {
    driver = await prisma.driver.findFirst({ where: { organization_id: orgId, email: session.user.email } });
  }

  if (!driver) return <div className="p-4 text-center mt-20 font-bold text-zinc-500">Profil Introuvable, contactez l'exploitation.</div>;

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const currentRuns = await prisma.dailyRun.findMany({
    where: { driver_id: driver.id, date: todayUtc },
    orderBy: { created_at: "asc" }
  });

  const isCompleted = currentRuns.length > 0 && currentRuns.every(r => r.status === 'completed');

  return (
    <div className="space-y-6 pt-2">
      {/* Hello Section */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
         <div>
           <p className="text-zinc-500 text-sm font-medium tracking-tight mb-0.5">Bonjour,</p>
           <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight leading-none">{driver.first_name} {driver.last_name}</h1>
         </div>
         <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-md border-2 border-white">
            {driver.first_name.charAt(0)}
         </div>
      </section>

      {/* Hero Widget: Tournée du jour */}
      <section>
        <h2 className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 mb-3 ml-2">Ma Tournée d'Aujourd'hui</h2>
        <Link href="/driver/deliveries" className="block focus:outline-none focus:ring-[4px] focus:ring-orange-500/20 rounded-2xl transition-transform active:scale-[0.98]">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-lg border border-orange-400 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Truck className="w-24 h-24 transform rotate-[-10deg]" />
            </div>
            
            <div className="relative z-10">
              {isCompleted ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="font-extrabold text-[11px] uppercase tracking-widest text-white/90">Clôturée</span>
                  </div>
                  <h3 className="text-[26px] font-black leading-tight mb-2">Terminée pour<br/>aujourd'hui</h3>
                  <p className="text-white/80 text-[13px] font-medium">Les données ont bien été transmises à l'exploitation.</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-white animate-pulse" />
                    <span className="font-extrabold text-[11px] uppercase tracking-widest text-white/90">En cours</span>
                  </div>
                  <h3 className="text-[26px] font-black leading-tight mb-2">Saisir les<br/>Livraisons</h3>
                  <p className="text-white/90 text-[13px] font-medium bg-white/10 px-3 py-1.5 rounded-lg inline-block backdrop-blur-sm">Cliquez ici pour renseigner vos colis</p>
                </>
              )}
            </div>
          </div>
        </Link>
      </section>

      {/* Grid Menu */}
      <section className="grid grid-cols-2 gap-4">
        <Link href="/driver/incidents" className="bg-white px-2 py-6 rounded-2xl shadow-sm border border-white flex flex-col items-center justify-center text-center focus:ring-[4px] focus:ring-orange-500/20 transition-transform active:scale-[0.98]">
           <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
             <AlertTriangle className="w-7 h-7" />
           </div>
           <span className="font-bold text-zinc-900 text-[15px] mb-1">Casse / Panne</span>
           <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Signaler</span>
        </Link>

        {/* Historique or profile could be here */}
        <Link href="/driver/profile" className="bg-white px-2 py-6 rounded-2xl shadow-sm border border-white flex flex-col items-center justify-center text-center focus:ring-[4px] focus:ring-orange-500/20 transition-transform active:scale-[0.98]">
           <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
             <CheckCircle className="w-7 h-7" />
           </div>
           <span className="font-bold text-zinc-900 text-[15px] mb-1">Mon Compte</span>
           <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Infos RH</span>
        </Link>
      </section>
    </div>
  );
}
