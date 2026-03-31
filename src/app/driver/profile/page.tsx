import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, Calendar, CreditCard, Award } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DriverProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organization_id) redirect("/login");

  const orgId = session.user.organization_id;

  let driver = null;
  if (['admin', 'owner', 'dispatcher', 'manager'].includes(session.user.role as string)) {
    driver = await prisma.driver.findFirst({ where: { organization_id: orgId } });
  } else {
    driver = await prisma.driver.findFirst({ where: { organization_id: orgId, email: session.user.email } });
  }

  if (!driver) return <div className="p-4 text-center mt-20 font-bold text-zinc-500">Profil Introuvable</div>;

  const now = new Date();
  
  const targetDriver = await prisma.driver.findUnique({
    where: { id: driver.id },
    include: {
      hr_events: {
        where: { event_type: { in: ['vacation', 'sick_leave'] } }
      },
      bonuses: {
        where: { month: { equals: now.getMonth() + 1 }, year: { equals: now.getFullYear() } }
      }
    }
  });

  if (!targetDriver) return null;

  const vacationsTaken = targetDriver.hr_events.filter(e => e.event_type === 'vacation').length;
  const leaveBalance = Math.max(0, 25 - (vacationsTaken * 5)); // Roughly 25 days / yr 
  const monthlyBonus = targetDriver.bonuses[0];

  return (
    <main className="flex-1 w-full pt-2">
      <h2 className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-3 ml-2">Mon Espace Personnel</h2>
      
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 mb-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-extrabold text-3xl shadow-lg ring-4 ring-blue-50 mb-3">
          {targetDriver.first_name.charAt(0)}
        </div>
        <h3 className="text-xl font-bold text-zinc-900 leading-tight">{targetDriver.first_name} {targetDriver.last_name}</h3>
        <p className="text-zinc-500 text-sm mt-1">{targetDriver.email}</p>
        <span className="mt-3 px-4 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-[11px] font-bold tracking-wider uppercase">
          Contrat Actif
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-zinc-900 mb-1">{leaveBalance}</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Congés (J)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-zinc-900 mb-1">{monthlyBonus?.status === 'granted' ? monthlyBonus.amount : '0'} €</span>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Prime Acquise</span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 mb-6">
        <h4 className="font-bold text-blue-900 mb-2 text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Coût de Base
        </h4>
        <p className="text-blue-800/80 text-[13px] leading-relaxed">
          Votre Taux de coût de base est fixé à <strong>{Number(targetDriver.daily_base_cost).toFixed(2)} €/Jour</strong> pour la rentabilité analytique des tournées PGM.
        </p>
      </div>
    </main>
  );
}
