import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/BackButton";
import { AiProfitabilityCard } from "@/components/dashboard/AiProfitabilityCard";

export const dynamic = 'force-dynamic';

export default async function RunDetailsPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const { runId } = await params;

  const run = await prisma.dailyRun.findUnique({
    where: { 
        id: runId,
        organization_id: session.user.organization_id 
    },
    include: {
      driver: true,
      vehicle: true,
      client: true,
      zone: true,
      incidents: {
          orderBy: { created_at: 'asc' }
      }
    },
  });

  if (!run) {
    return notFound();
  }

  const aiReport = await prisma.aiReport.findFirst({
      where: {
          organization_id: session.user.organization_id,
          report_type: "run_profitability",
          structured_data_json: {
             path: ['run_id'],
             equals: runId
          }
      }
  });

  // Extract json values if standard fields don't exist
  const existingReportData = aiReport ? {
      profitability_score: (aiReport.structured_data_json as any)?.profitability_score,
      summary: (aiReport.structured_data_json as any)?.summary
  } : undefined;

  const revenue = run.revenue_calculated ? Number(run.revenue_calculated) : 0;
  const driverCost = run.cost_driver ? Number(run.cost_driver) : 0;
  const fleetCost = run.cost_vehicle ? Number(run.cost_vehicle) : 0;
  const marginNet = run.margin_net ? Number(run.margin_net) : (revenue - driverCost - fleetCost);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#f8f9fc] p-6 md:p-12 font-sans text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Retour Button */}
        <div className="mb-2">
           <BackButton />
        </div>

        {/* En-tête de la tournée */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 dark:border-slate-200 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">Détails Tournée</h1>
              <Badge variant={run.status === 'completed' ? 'default' : run.status === 'in_progress' ? 'secondary' : 'outline'}
                     className={run.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                {run.status === 'completed' ? 'Terminée' : run.status === 'in_progress' ? 'En Cours' : 'Planifiée'}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              Date: {new Date(run.date).toLocaleDateString("fr-FR")} • ID: <span className="font-mono text-xs">{run.id.slice(0,8)}</span>
            </p>
          </div>
        </header>

        {/* Ressources & KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloc Ressources */}
            <div className="bg-white dark:bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200 space-y-4">
                <h2 className="text-xl font-semibold">Ressources & Client</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-500">Chauffeur</p>
                        <p className="font-medium">{run.driver.first_name} {run.driver.last_name}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Véhicule</p>
                        <p className="font-medium">{run.vehicle.plate_number}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Client</p>
                        <p className="font-medium">{run.client.name}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Zone</p>
                        <p className="font-medium">{run.zone?.name || 'Non spécifiée'}</p>
                    </div>
                </div>
            </div>

            {/* Bloc Financier & IA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Sous-bloc Bilan */}
               <div className="bg-white dark:bg-white text-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                   <h2 className="text-xl font-semibold">Bilan Financier</h2>
                   {run.status === 'completed' ? (
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <p className="text-slate-500 text-sm">Chiffre d'Affaires</p>
                               <p className="text-2xl font-bold text-emerald-400">{revenue.toFixed(2)} €</p>
                           </div>
                           <div>
                               <p className="text-slate-500 text-sm">Marge Nette</p>
                               <p className={`text-2xl font-bold ${marginNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                   {marginNet > 0 ? '+' : ''}{marginNet.toFixed(2)} €
                               </p>
                           </div>
                           <div>
                               <p className="text-slate-500 text-sm">Coût Chauffeur</p>
                               <p className="text-lg font-medium">{driverCost.toFixed(2)} €</p>
                           </div>
                           <div>
                               <p className="text-slate-500 text-sm">Coût Flotte</p>
                               <p className="text-lg font-medium">{fleetCost.toFixed(2)} €</p>
                           </div>
                       </div>
                   ) : (
                       <div className="h-full flex items-center text-slate-500 italic text-sm">
                           Bilan disponible une fois la tournée clôturée.
                       </div>
                   )}
               </div>

               {/* Sous-bloc IA */}
               {run.status === 'completed' && (
                  <AiProfitabilityCard runId={run.id} initialReport={existingReportData} />
               )}
            </div>
        </div>

        {/* Timeline (Événements & Incidents) */}
        <div className="bg-white dark:bg-white rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-6">Timeline de la tournée</h2>
            <div className="space-y-6">
                
                {/* Départ */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5" />
                        <div className="w-0.5 h-16 bg-zinc-200 dark:bg-zinc-700 mt-2" />
                    </div>
                    <div>
                        <p className="font-medium">Création de la tournée</p>
                        <p className="text-sm text-slate-500">{new Date(run.created_at || '').toLocaleString("fr-FR")}</p>
                    </div>
                </div>

                {/* Incidents (s'il y en a) */}
                {run.incidents.map((incident, index) => (
                    <div key={incident.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mt-1.5" />
                            {index < run.incidents.length - 1 || run.status === 'completed' ? (
                                <div className="w-0.5 h-full min-h-[4rem] bg-zinc-200 dark:bg-zinc-700 mt-2" />
                            ) : null}
                        </div>
                        <div className="pb-6">
                            <Badge variant="outline" className="border-orange-500 text-orange-600 mb-1">Incident Callisé</Badge>
                            <p className="font-medium">{incident.incident_type}</p>
                            <p className="text-sm text-slate-500">{new Date(incident.created_at || '').toLocaleString("fr-FR")}</p>
                            {incident.description && <p className="text-sm mt-2 p-3 bg-zinc-50 dark:bg-slate-50 rounded-md border border-zinc-100 dark:border-slate-200">{incident.description}</p>}
                        </div>
                    </div>
                ))}

                {/* Arrivée */}
                {run.status === 'completed' && (
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1.5" />
                        </div>
                        <div>
                            <p className="font-medium text-emerald-600 dark:text-emerald-400">Clôture de la tournée</p>
                            <p className="text-sm text-slate-500">{new Date(run.return_time || '').toLocaleString("fr-FR")}</p>
                            <div className="mt-2 text-sm text-zinc-600 dark:text-slate-500 space-y-1">
                                <p>Kilométrage: {Number(run.km_start || 0)} → {Number(run.km_end || 0)} ({Number(run.km_end || 0) - Number(run.km_start || 0)} km)</p>
                                <p>Stops réalisés: {run.stops_completed} (Planifiés: {run.stops_planned})</p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>

      </div>
    </div>
  );
}
