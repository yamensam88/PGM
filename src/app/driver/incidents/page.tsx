import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateDamageForm } from "@/components/forms/CreateDamageForm";
import { AlertTriangle, Info } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DriverIncidentsPage() {
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
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const currentRun = await prisma.dailyRun.findFirst({
    where: { driver_id: driver.id, date: todayUtc },
    orderBy: { created_at: "desc" }
  });

  if (!currentRun) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center mt-20 bg-white m-4 rounded-2xl shadow-sm border border-zinc-100">
         <Info className="w-12 h-12 text-blue-500 mb-4 mx-auto" />
         <h2 className="text-xl font-bold text-zinc-900 leading-tight mb-2">Aucune tournée active</h2>
         <p className="text-zinc-500 text-sm">Vous n'avez pas de véhicule assigné aujourd'hui pour déclarer un sinistre affectant une tournée.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full pt-2">
      <h2 className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-3 ml-2">Signaler un Incident</h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 mb-6">
        <div className="flex items-start gap-4 mb-4 pb-4 border-b border-zinc-100">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 text-lg leading-tight mb-1">Déclaration de Carence</h3>
            <p className="text-[12px] text-zinc-500 font-medium">Un justificatif photo est exigé par l'exploitation.</p>
          </div>
        </div>
        
        <div className="overflow-hidden">
          <CreateDamageForm 
             runId={currentRun.id} 
             vehicleId={currentRun.vehicle_id} 
             drivers={[{ id: driver.id, first_name: driver.first_name, last_name: driver.last_name }]} 
          />
        </div>
      </div>
    </main>
  );
}
