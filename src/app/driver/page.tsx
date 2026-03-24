import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ChevronLeft } from "lucide-react";
import { UnifiedDeliveryForm } from "@/components/forms/UnifiedDeliveryForm";

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage(props: { searchParams: Promise<{ edit?: string, driverId?: string }> }) {
  const session = await getServerSession(authOptions);
  
  const searchParams = await props.searchParams;
  const isEditing = searchParams.edit === 'true';

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const orgId = session.user.organization_id;

  const targetDriverId = searchParams.driverId as string | undefined;

  let driver = null;

  // If admin/dispatcher/manager, allow impersonation via URL param or fallback to first driver
  if (['admin', 'owner', 'dispatcher', 'manager'].includes(session.user.role as string)) {
    if (targetDriverId) {
      driver = await prisma.driver.findFirst({
        where: { id: targetDriverId, organization_id: orgId }
      });
    } else {
      driver = await prisma.driver.findFirst({
        where: { organization_id: orgId }
      });
    }
  } else {
    // Standard driver login matches their email
    driver = await prisma.driver.findFirst({
      where: { 
        organization_id: orgId,
        email: session.user.email
      }
    });
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#f8f9fc] flex flex-col pt-16 mt-4">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-red-200">
              <CardContent className="pt-6 text-center">
                 <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                 <h2 className="text-xl font-bold text-zinc-900 dark:text-slate-900 mb-2">Profil non trouvé</h2>
                 <p className="text-slate-500 text-sm">
                   Aucun profil chauffeur associé à cet email n'a été trouvé. Veuillez contacter l'exploitation.
                 </p>
              </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  // Find today's daily run exactly matching the current day
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let rawCurrentRun = await prisma.dailyRun.findFirst({
    where: {
      driver_id: driver.id,
      date: todayUtc
    },
    orderBy: { created_at: "desc" }
  });

  let currentRun: any = rawCurrentRun ? {
    ...rawCurrentRun,
    fuel_consumed_liters: rawCurrentRun.fuel_consumed_liters ? Number(rawCurrentRun.fuel_consumed_liters) : null,
    revenue_calculated: rawCurrentRun.revenue_calculated ? Number(rawCurrentRun.revenue_calculated) : null,
    cost_driver: rawCurrentRun.cost_driver ? Number(rawCurrentRun.cost_driver) : null,
    cost_vehicle: rawCurrentRun.cost_vehicle ? Number(rawCurrentRun.cost_vehicle) : null,
    cost_fuel: rawCurrentRun.cost_fuel ? Number(rawCurrentRun.cost_fuel) : null,
    cost_other: rawCurrentRun.cost_other ? Number(rawCurrentRun.cost_other) : null,
    total_cost: rawCurrentRun.total_cost ? Number(rawCurrentRun.total_cost) : null,
    margin_net: rawCurrentRun.margin_net ? Number(rawCurrentRun.margin_net) : null,
    productivity_index: rawCurrentRun.productivity_index ? Number(rawCurrentRun.productivity_index) : null,
    penalty_risk_score: rawCurrentRun.penalty_risk_score ? Number(rawCurrentRun.penalty_risk_score) : null,
    sst_score: rawCurrentRun.sst_score ? Number(rawCurrentRun.sst_score) : null,
  } : null;

  // Auto-Create a planned run if none exists for today
  if (!currentRun) {
    const client = await prisma.client.findFirst({ where: { organization_id: orgId } });
    if (!client) {
       return (
        <div className="min-h-screen bg-[#f8f9fc] flex flex-col pt-16 mt-4">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
             <AlertTriangle className="w-12 h-12 text-orange-500 mb-4 mx-auto" />
             <h2 className="text-xl font-bold text-zinc-900">Configuration Manquante</h2>
             <p className="text-slate-500 mt-2">L'entreprise doit configurer au moins un client avant que vous n'ayez une tournée générée.</p>
          </div>
        </div>
       );
    }
    
    // We must pass a fallback vehicle as vehicle_id is required in the DB
    const fallbackVehicle = await prisma.vehicle.findFirst({ where: { organization_id: orgId } });
    if (!fallbackVehicle) {
       return (
        <div className="min-h-screen bg-[#f8f9fc] flex flex-col pt-16 mt-4">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
             <AlertTriangle className="w-12 h-12 text-orange-500 mb-4 mx-auto" />
             <h2 className="text-xl font-bold text-zinc-900">Configuration Manquante</h2>
             <p className="text-slate-500 mt-2">L'entreprise doit enregistrer au moins un véhicule.</p>
          </div>
        </div>
       );
    }

    // Generate a unique code
    const runCodeStr = `AUTO-${driver.id.substring(0, 4).toUpperCase()}-${todayUtc.getTime()}`;
    
    // Explicitly create today's empty run
    const freshlyCreatedRun = await prisma.dailyRun.create({
      data: {
        organization_id: orgId,
        driver_id: driver.id,
        client_id: client.id,
        vehicle_id: fallbackVehicle.id, // satisfying the required constraint
        date: todayUtc,
        status: 'planned',
        run_code: runCodeStr,
        stops_planned: 0,
        packages_loaded: 0
      }
    });

    currentRun = {
      ...freshlyCreatedRun,
      fuel_consumed_liters: 0,
      revenue_calculated: 0,
      cost_driver: 0,
      cost_vehicle: 0,
      cost_fuel: 0,
      cost_other: 0,
      total_cost: 0,
      margin_net: 0,
      productivity_index: null,
      penalty_risk_score: 0,
      sst_score: 0,
    };
  }

  // If completed, show success message
  if (currentRun?.status === 'completed' && !isEditing) {
    const nowLocal = new Date();
    const isToday = currentRun.date.getDate() === nowLocal.getDate() && 
                    currentRun.date.getMonth() === nowLocal.getMonth() && 
                    currentRun.date.getFullYear() === nowLocal.getFullYear();

    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col pb-24">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:max-w-xl mx-auto w-full mt-16 flex flex-col items-center justify-center text-center">
          <div className="bg-emerald-100/50 p-5 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Tournée Terminée !</h1>
          <p className="text-slate-500 mb-8 max-w-sm">
            Merci <strong>{driver.first_name}</strong>, les données de votre véhicule et vos chiffres de livraison ont été validés pour aujourd'hui.
          </p>
          <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wider">
            Bon repos
          </p>

          {isToday ? (
             <a href="?edit=true" className="mt-8 inline-flex items-center justify-center px-6 py-2.5 border border-zinc-200 bg-white text-zinc-700 rounded-lg font-medium text-sm hover:bg-zinc-50 transition-colors shadow-sm">
               Modifier ma saisie d'aujourd'hui
             </a>
          ) : (
             <p className="mt-8 text-sm text-slate-500">Cette tournée appartient à un jour précédent.</p>
          )}
        </main>
      </div>
    );
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { organization_id: orgId, status: 'active' },
    select: { id: true, plate_number: true },
    orderBy: { plate_number: 'asc' }
  });

  const clients = await prisma.client.findMany({
    where: { organization_id: orgId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  // Render unified form
  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col pb-24">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:max-w-4xl mx-auto w-full mt-16 md:mt-4">
        {targetDriverId && (
          <div className="mb-6">
            <Link href="/dispatch/runs" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour à l'exploitation
            </Link>
          </div>
        )}
        {isEditing && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
            <strong>Mode Édition :</strong> Vous modifiez la tournée que vous avez déjà soumise aujourd'hui.
          </div>
        )}
        <UnifiedDeliveryForm 
           driverId={driver.id} 
           vehicles={vehicles} 
           clients={clients}
           runId={currentRun?.id} 
           initialData={currentRun}
        />
      </main>
    </div>
  );
}
