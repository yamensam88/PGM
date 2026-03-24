import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateRunForm } from "@/components/forms/CreateRunForm";

export const dynamic = 'force-dynamic';

export default async function CreateRunPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const orgId = session.user.organization_id;

  // Prépare les données pour les sélecteurs
  const [drivers, vehicles, clients, zones, rateCards] = await Promise.all([
    prisma.driver.findMany({ where: { organization_id: orgId, status: 'active' } }),
    prisma.vehicle.findMany({ where: { organization_id: orgId, status: 'active' } }),
    prisma.client.findMany({ where: { organization_id: orgId } }),
    prisma.zone.findMany({ where: { organization_id: orgId } }),
    prisma.rateCard.findMany({ where: { organization_id: orgId }, include: { client: true } }),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#f8f9fc] p-6 md:p-12 font-sans text-zinc-900 dark:text-zinc-50">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="border-b border-zinc-200 dark:border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Planifier une Tournée</h1>
          <p className="text-slate-500 mt-1">Assignez les ressources et les objectifs pour une nouvelle tournée de livraison.</p>
        </header>

        <div className="bg-white dark:bg-white rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200 p-6">
           <CreateRunForm 
             drivers={drivers} 
             vehicles={vehicles} 
             clients={clients} 
             zones={zones} 
             rateCards={rateCards} 
           />
        </div>
      </div>
    </div>
  );
}
