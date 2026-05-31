import { FinishRunForm } from "@/components/forms/FinishRunForm";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function FinishRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const run = await prisma.dailyRun.findFirst({
    where: { id: runId, organization_id: session.user.organization_id },
    include: {
      vehicle: true,
      driver: true,
      client: true,
    },
  });

  if (!run) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-zinc-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Fin de Service</h1>
          <p className="text-sm text-slate-500">
            {new Date(run.date).toLocaleDateString("fr-FR")} • {run.client.name}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl">
          <div className="mb-6 pb-6 border-b border-slate-200 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Chauffeur</span>
              <span className="font-medium">{run.driver.first_name} {run.driver.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Véhicule</span>
              <span className="font-medium">{run.vehicle.plate_number}</span>
            </div>
          </div>

          <FinishRunForm runId={run.id} initialKmStart={run.km_start ? Number(run.km_start) : null} />
        </div>

      </div>
    </div>
  );
}
