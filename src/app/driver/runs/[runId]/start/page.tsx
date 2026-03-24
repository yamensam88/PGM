import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { StartRunForm } from "@/components/forms/StartRunForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function DriverStartRunPage(props: { params: Promise<{ runId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const run = await prisma.dailyRun.findFirst({
    where: { 
        id: params.runId,
        organization_id: session.user.organization_id
    },
    include: {
      client: true,
      zone: true,
    }
  });

  if (!run || run.status !== "planned") {
    redirect("/driver");
  }

  // Fetch available vehicles for the organization
  const vehicles = await prisma.vehicle.findMany({
    where: { organization_id: session.user.organization_id, status: 'active' },
    select: { id: true, plate_number: true },
    orderBy: { plate_number: 'asc' }
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#f8f9fc] flex flex-col pb-24">
      <Header />
      
      <main className="flex-1 p-4 md:p-6 lg:max-w-xl mx-auto w-full mt-16 md:mt-4">
        <Link href="/driver" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-zinc-900 dark:hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour au planning
        </Link>

        <div>
           <h1 className="text-2xl font-bold text-zinc-900 dark:text-slate-900">Prise de Service</h1>
           <p className="text-slate-500 text-sm mt-1">Tournée prévue pour {run.client?.name} (Zone: {run.zone?.name})</p>
        </div>

        <StartRunForm 
           runId={run.id} 
           vehicles={vehicles}
           defaultVehicleId={run.vehicle_id}
           defaultPackagesLoaded={run.packages_loaded || 0}
           defaultPackagesRelay={run.packages_relay || 0}
        />
        
      </main>
    </div>
  );
}
