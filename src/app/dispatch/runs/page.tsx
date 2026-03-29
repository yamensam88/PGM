import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RunsTable } from "@/components/dashboard/RunsTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Wrench, Trash2, AlertTriangle, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CostBreakdownChart } from "@/components/dashboard/CostBreakdownChart";
import { VehicleAppointmentCell } from "@/components/dashboard/VehicleAppointmentCell";
import { CreateVehicleForm } from "@/components/forms/CreateVehicleForm";
import { CreateRunForm } from "@/components/forms/CreateRunForm";
import { CreateZoneForm } from "@/components/forms/CreateZoneForm";
import { DeleteZoneForm } from "@/components/forms/DeleteZoneForm";
import { VehicleRowActions } from "@/components/dashboard/VehicleRowActions";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DriversTable } from "@/components/dashboard/DriversTable";
import { ZoneSynthesisTable } from "@/components/dashboard/ZoneSynthesisTable";
import { CreateVehicleModal } from "@/components/dashboard/CreateVehicleModal";

export const dynamic = 'force-dynamic';

export default async function DispatchRunsPage({ searchParams }: { searchParams: Promise<{ filter?: string, from?: string, to?: string, date?: string }> }) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const filter = params?.filter;
  const fromParam = params?.from;
  const toParam = params?.to;
  const legacyDateParam = params?.date;

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  let endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  if (fromParam || toParam) {
    if (fromParam) startDate = new Date(fromParam);
    if (toParam) {
       endDate = new Date(toParam);
       endDate.setHours(23, 59, 59, 999);
    }
  } else if (legacyDateParam) {
     startDate = new Date(legacyDateParam);
     startDate.setHours(0,0,0,0);
     endDate = new Date(legacyDateParam);
     endDate.setHours(23,59,59,999);
  } else {
     const activeFilter = filter || 'daily';
     if (activeFilter === 'weekly') {
        startDate.setDate(startDate.getDate() - 6);
     } else if (activeFilter === 'monthly') {
        startDate.setDate(startDate.getDate() - 29);
     }
  }

  const whereClause: any = { 
    organization_id: session.user.organization_id,
    date: { gte: startDate, lte: endDate }
  };

  const rawRuns = await prisma.dailyRun.findMany({
    where: whereClause,
    include: {
      driver: { select: { first_name: true, last_name: true } },
      vehicle: { select: { plate_number: true } },
      client: { select: { name: true } },
      zone: { select: { name: true } },
      financial_entries: {
        where: { category: { in: ["maintenance_cost", "damage_cost"] } }
      }
    },
    orderBy: { date: "desc" },
    take: 100, // Fetch up to 100 recent runs for this view
  });

  const runs = rawRuns.map(run => ({
    ...run,
    fuel_consumed_liters: run.fuel_consumed_liters ? Number(run.fuel_consumed_liters) : 0,
    revenue_calculated: run.revenue_calculated ? Number(run.revenue_calculated) : 0,
    cost_driver: run.cost_driver ? Number(run.cost_driver) : 0,
    cost_vehicle: run.cost_vehicle ? Number(run.cost_vehicle) : 0,
    cost_fuel: run.cost_fuel ? Number(run.cost_fuel) : 0,
    cost_other: run.cost_other ? Number(run.cost_other) : 0,
    total_cost: run.total_cost ? Number(run.total_cost) : 0,
    margin_net: run.margin_net ? Number(run.margin_net) : 0,
    productivity_index: run.productivity_index ? Number(run.productivity_index) : null,
    penalty_risk_score: run.penalty_risk_score ? Number(run.penalty_risk_score) : 0,
    sst_score: run.sst_score ? Number(run.sst_score) : 0,
    financial_entries: run.financial_entries.map(e => ({ ...e, amount: Number(e.amount) }))
  }));

  const rawVehicles = await prisma.vehicle.findMany({
    where: { organization_id: session.user.organization_id },
    include: {
      maintenance_logs: { 
        where: { service_date: { gte: startDate, lte: endDate } },
        orderBy: { service_date: "desc" }, 
        take: 20 
      },
      incidents: { 
        where: { incident_type: "casse_vehicule", created_at: { gte: startDate, lte: endDate } }, 
        orderBy: { created_at: "desc" }, 
        take: 20, 
        include: { driver: { select: { first_name: true, last_name: true } } } 
      },
      financial_entries: { 
        where: { category: { in: ["maintenance_cost", "damage_cost"] }, entry_date: { gte: startDate, lte: endDate } }, 
        orderBy: { entry_date: "desc" } 
      }
    },
    orderBy: { created_at: "desc" },
  });

  const vehicles = rawVehicles.map(v => ({
     ...v,
     internal_cost_per_km: v.internal_cost_per_km ? Number(v.internal_cost_per_km) : 0,
     fixed_monthly_cost: v.fixed_monthly_cost ? Number(v.fixed_monthly_cost) : 0,
     insurance_monthly_cost: v.insurance_monthly_cost ? Number(v.insurance_monthly_cost) : 0,
     rental_monthly_cost: v.rental_monthly_cost ? Number(v.rental_monthly_cost) : 0,
     maintenance_logs: v.maintenance_logs.map(m => ({ ...m, cost: Number(m.cost) })),
     incidents: v.incidents.map(i => ({ 
         ...i, 
         gps_latitude: i.gps_latitude ? Number(i.gps_latitude) : null,
         gps_longitude: i.gps_longitude ? Number(i.gps_longitude) : null,
         ai_risk_score: i.ai_risk_score ? Number(i.ai_risk_score) : 0,
         penalty_exposure_amount: i.penalty_exposure_amount ? Number(i.penalty_exposure_amount) : 0,
         penalty_saved_amount: i.penalty_saved_amount ? Number(i.penalty_saved_amount) : 0,
     })),
     financial_entries: v.financial_entries.map(f => ({ ...f, amount: Number(f.amount) }))
  }));

  const activeVehicles = vehicles.filter(v => v.status !== 'archived');
  const archivedVehicles = vehicles.filter(v => v.status === 'archived');

  const actifsVehicules = activeVehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicules = activeVehicles.filter(v => v.status === 'maintenance').length;
  const inactifsVehicules = activeVehicles.filter(v => v.status === 'inactive').length;

  const rawDrivers = await prisma.driver.findMany({
    where: { organization_id: session.user.organization_id, job_title: "Chauffeur" } as any,
    include: {
      hr_events: {
        where: { event_type: { in: ["vacation", "sick_leave"] } },
        select: { start_date: true, end_date: true, event_type: true }
      },
      financial_entries: {
        where: { category: { in: ["maintenance_cost", "damage_cost"] }, entry_date: { gte: startDate, lte: endDate } },
        orderBy: { entry_date: "desc" }
      }
    },
    orderBy: { first_name: "asc" }
  });

  const rawRateCards = await prisma.rateCard.findMany({
    where: {
      client: { organization_id: session.user.organization_id }
    },
    include: { client: { select: { name: true } } }
  });

  const clients = await prisma.client.findMany({
    where: { organization_id: session.user.organization_id },
    orderBy: { name: "asc" }
  });

  const zones = await prisma.zone.findMany({
    where: { organization_id: session.user.organization_id },
    orderBy: { name: "asc" }
  });

  const drivers = rawDrivers.map(d => ({
    ...d,
    daily_base_cost: d.daily_base_cost ? Number(d.daily_base_cost) : 0,
    hourly_cost: d.hourly_cost ? Number(d.hourly_cost) : null,
    quality_rating: d.quality_rating ? Number(d.quality_rating) : 0,
    performance_score: d.performance_score ? Number(d.performance_score) : 0,
    financial_entries: d.financial_entries.map(e => ({ ...e, amount: Number(e.amount) }))
  }));

  const actifsChauffeurs = rawDrivers.filter(d => d.status === 'active').length;
  const presentsChauffeurs = new Set(runs.map(r => r.driver_id).filter(Boolean)).size;
  const absentsChauffeurs = Math.max(0, actifsChauffeurs - presentsChauffeurs);

  const zoneSynthesisMap: Record<string, any> = {};
  runs.forEach(r => {
    if (!r.zone?.name) return;
    const zName = r.zone.name;
    if (!zoneSynthesisMap[zName]) {
      zoneSynthesisMap[zName] = {
        zone: { id: (r.zone as any).id || zName, name: zName },
        runs_count: 0,
        packages_loaded: 0,
        packages_delivered: 0,
        packages_advised: 0,
        km_utiles: 0,
        margin_net: 0,
        maintenance_cost: 0,
        damage_cost: 0,
        penalty_cost: 0,
        runs: [],
      };
    }
    
    zoneSynthesisMap[zName].runs.push(r);
    zoneSynthesisMap[zName].runs_count += 1;
    const runLoaded = Number(r.packages_loaded || 0); // Exclude relay for Exploit consistency, or keep it if RunsTable adds it. Let's just use packages_loaded!
    const runDelivered = Number(r.packages_delivered || 0);
    const runAdvised = Number(r.packages_advised || 0);

    zoneSynthesisMap[zName].packages_loaded += runLoaded;
    zoneSynthesisMap[zName].packages_delivered += runDelivered;
    zoneSynthesisMap[zName].packages_advised += runAdvised;
    zoneSynthesisMap[zName].km_utiles += Math.max(0, (r.km_end || 0) - (r.km_start || Number(r.km_end)));
    
    // Sum up financial entries attached to runs
    if (r.financial_entries && r.financial_entries.length > 0) {
      r.financial_entries.forEach((entry: any) => {
        if (entry.category === 'maintenance_cost') zoneSynthesisMap[zName].maintenance_cost += Number(entry.amount);
        if (entry.category === 'damage_cost') zoneSynthesisMap[zName].damage_cost += Number(entry.amount);
        if (entry.category === 'penalty_cost') zoneSynthesisMap[zName].penalty_cost += Number(entry.amount);
      });
    }
  });

  const zoneSynthesisData = Object.values(zoneSynthesisMap).sort((a: any, b: any) => {
    return b.runs_count - a.runs_count;
  });

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-200 dark:border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Exploitation: Tournées</h1>
            <p className="text-slate-500 mt-1">Supervision temps réel : productivité, avisage et classement des chauffeurs.</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-2 w-full">
              <DateRangePicker />
              
              <Dialog>
                <DialogTrigger className="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:border-red-800/50 dark:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Supprimer une Zone</DialogTitle>
                    <DialogDescription>
                      Cette action est irréversible. Les entités liées à des tournées ne peuvent pas être supprimées.
                    </DialogDescription>
                  </DialogHeader>
                  <DeleteZoneForm zones={JSON.parse(JSON.stringify(zones))} />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm gap-2 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-zinc-50">
                  <Plus className="h-4 w-4" />
                  Zone
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer une Nouvelle Zone</DialogTitle>
                    <DialogDescription>
                      Ajoutez une nouvelle zone de livraison.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateZoneForm />
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une tournée
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer une Nouvelle Tournée</DialogTitle>
                    <DialogDescription>
                      Planifiez une tournée en assignant un client, un véhicule et un chauffeur.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateRunForm 
                    drivers={JSON.parse(JSON.stringify(drivers))} 
                    vehicles={JSON.parse(JSON.stringify(vehicles))} 
                    clients={JSON.parse(JSON.stringify(clients))} 
                    zones={JSON.parse(JSON.stringify(zones))} 
                    rateCards={JSON.parse(JSON.stringify(rawRateCards))} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* --- KPIs d'Exploitation (Phase 4) --- */}
        {(() => {
           const completedRuns = runs.filter(r => r.status === 'completed');
           
           const totalLoaded = completedRuns.reduce((sum, r) => sum + Number(r.packages_loaded || 0), 0);
           const totalAdvised = completedRuns.reduce((sum, r) => sum + Number(r.packages_advised || 0), 0);
           const totalDelivered = completedRuns.reduce((sum, r) => sum + Number(r.packages_delivered || 0), 0);

           const txLivraison = totalLoaded > 0 ? ((totalDelivered / totalLoaded) * 100).toFixed(1) : "0.0";
           const txAvisage = totalLoaded > 0 ? ((totalAdvised / totalLoaded) * 100).toFixed(1) : "0.0";
           
           // Productivité moyenne = livrés / tournée
           const productiviteTournee = completedRuns.length > 0 ? (totalDelivered / completedRuns.length).toFixed(1) : "0";

           // Écart entre chauffeurs sur une même zone (Mockup calculation for active zones)
           // On prend les runs, on groupe par zone, on cherche le max et le min de productivité
           const zonesStats: Record<string, { totalDelivered: number, count: number }> = {};
           completedRuns.forEach(r => {
             if (!r.zone?.name) return;
             const z = r.zone.name;
             const liv = Number(r.packages_delivered || 0);
             if(!zonesStats[z]) zonesStats[z] = { totalDelivered: 0, count: 0 };
             zonesStats[z].totalDelivered += liv;
             zonesStats[z].count += 1;
           });

           // Avg KM per run
           const totalKm = completedRuns.reduce((sum, r) => sum + Math.max(0, (r.km_end || 0) - (r.km_start || Number(r.km_end))), 0);
           const avgKmPerRun = completedRuns.length > 0 ? (totalKm / completedRuns.length).toFixed(0) : "0";

           return (
             <>
               {/* Effectifs & KPIs Top Bar */}
               <div className="flex flex-wrap gap-4 mb-8">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-800 p-4 flex-1 min-w-[340px]">
                     <h3 className="text-xs font-bold text-slate-500 tracking-widest mb-3 uppercase">Effectifs Chauffeurs</h3>
                     <div className="flex justify-between items-center text-center">
                       <div className="flex-1">
                         <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{actifsChauffeurs}</div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Actifs</div>
                       </div>
                       <div className="flex-1 border-l border-zinc-200 dark:border-slate-700">
                         <div className="text-3xl font-extrabold text-emerald-500">{presentsChauffeurs}</div>
                         <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Présents</div>
                       </div>
                       <div className="flex-1 border-l border-zinc-200 dark:border-slate-700">
                         <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{absentsChauffeurs}</div>
                         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Absents</div>
                       </div>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-800 p-4 flex-1 min-w-[340px]">
                     <h3 className="text-xs font-bold text-slate-500 tracking-widest mb-3 uppercase">Effectifs Véhicules</h3>
                     <div className="flex justify-between items-center text-center">
                       <div className="flex-1">
                         <div className="text-3xl font-extrabold text-emerald-500">{actifsVehicules}</div>
                         <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Actif</div>
                       </div>
                       <div className="flex-1 border-l border-zinc-200 dark:border-slate-700">
                         <div className="text-3xl font-extrabold text-amber-500">{maintenanceVehicules}</div>
                         <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1">En Maint.</div>
                       </div>
                       <div className="flex-1 border-l border-zinc-200 dark:border-slate-700">
                         <div className="text-3xl font-extrabold text-slate-500 dark:text-slate-400">{inactifsVehicules}</div>
                         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Inactif</div>
                       </div>
                     </div>
                  </div>

                 <div className="bg-white dark:bg-white flex-1 min-w-[180px] p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200">
                  <h3 className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Taux de Livraison</h3>
                  <p className="text-3xl font-bold text-emerald-600">{txLivraison}%</p>
                  <p className="text-xs text-slate-500 mt-1">{totalDelivered} livrés / {totalLoaded} chargés</p>
                 </div>

                 <div className="bg-white dark:bg-white flex-1 min-w-[180px] p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200">
                  <h3 className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Taux d'Avisage</h3>
                  <p className={`text-3xl font-bold ${Number(txAvisage) > 10 ? 'text-red-500' : 'text-zinc-700 dark:text-slate-700'}`}>{txAvisage}%</p>
                  <p className="text-xs text-slate-500 mt-1">{totalAdvised} avisés / {totalLoaded} chargés</p>
                 </div>

                 <div className="bg-white dark:bg-white flex-1 min-w-[180px] p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200">
                  <h3 className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Productivité Moy.</h3>
                  <p className="text-3xl font-bold text-blue-600">{productiviteTournee}</p>
                  <p className="text-xs text-slate-500 mt-1">Colis livrés / tournée</p>
                 </div>
                 
                 <div className="bg-white dark:bg-white flex-1 min-w-[180px] p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200">
                  <h3 className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Km Utiles / Jour</h3>
                  <p className="text-3xl font-bold text-purple-600">{avgKmPerRun} <span className="text-lg">km</span></p>
                  <p className="text-xs text-slate-500 mt-1">Moyenne par tournée</p>
                 </div>

                 <div className="bg-white dark:bg-white flex-1 min-w-[200px] p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200">
                  <h3 className="text-xs font-medium text-amber-600 mb-1 uppercase tracking-wider">Leaderboard Zone</h3>
                  <div className="mt-2 space-y-2">
                     {Object.entries(zonesStats).slice(0,2).map(([zone, stats]) => (
                        <div key={zone} className="flex justify-between text-sm">
                           <span className="font-medium truncate max-w-[120px]">{zone}</span>
                           <span className="text-slate-500">{(stats.totalDelivered / stats.count).toFixed(0)} moy/j</span>
                        </div>
                     ))}
                     {Object.keys(zonesStats).length === 0 && <span className="text-sm text-slate-500">Aucune data</span>}
                  </div>
                 </div>
               </div>
             </>
           );
        })()}

        <Tabs defaultValue="runs" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <TabsList>
              <TabsTrigger value="runs" className="text-base px-6">Tournées (Par Date)</TabsTrigger>
              <TabsTrigger value="drivers" className="text-base px-6">Chauffeurs</TabsTrigger>
              <TabsTrigger value="vehicles" className="text-base px-6">Flotte de Véhicules</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="runs" className="space-y-6 mt-0">
            {/* Global Runs Table */}
            <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-zinc-200 dark:border-slate-200 p-0 overflow-hidden">
               <ZoneSynthesisTable data={zoneSynthesisData} isExploitationMode={true} />
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6 mt-0">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Gestion des Chauffeurs Actifs</h2>
                  <p className="text-slate-500 mt-1">Gérez facilement les comptes et accès de vos chauffeurs.</p>
                </div>
             </header>

            <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-zinc-200 dark:border-slate-200 overflow-hidden">
               <DriversTable drivers={drivers} />
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6 mt-0">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Gestion du Parc Automobile</h2>
                  <p className="text-slate-500 mt-1">Gérez l'ensemble des véhicules et leurs coûts</p>
                  <div className="mt-4">
                    <CreateVehicleModal />
                  </div>
                </div>
             </header>

            <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-zinc-200 dark:border-slate-200 overflow-hidden">
              <Tabs defaultValue="active" className="w-full">
                <div className="border-b border-zinc-200 dark:border-slate-200 px-4 py-3">
                  <TabsList>
                    <TabsTrigger value="active" className="px-6">Flotte Active</TabsTrigger>
                    <TabsTrigger value="archived" className="px-6">Anciens Véhicules</TabsTrigger>
                  </TabsList>
                </div>
                {[
                  { value: "active", data: activeVehicles },
                  { value: "archived", data: archivedVehicles }
                ].map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="m-0">
                    <div className="overflow-x-auto w-full">
                      <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-slate-50">
                          <TableRow>
                            <TableHead>Plaque d'Immatriculation</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Kilométrage</TableHead>
                            <TableHead className="text-right">Propriété</TableHead>
                            <TableHead className="text-right">Coût Fixe Mensuel (€)</TableHead>
                            <TableHead className="text-center px-0">RDV / Intervention Prévue</TableHead>
                            <TableHead className="text-right text-orange-600 font-semibold">Entretien (€)</TableHead>
                            <TableHead className="text-right text-red-600 font-semibold">Sinistres (€)</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tab.data.map((vehicle) => (
                            <TableRow key={vehicle.id} className="hover:bg-zinc-50 dark:hover:bg-white/30 transition-colors">
                              <TableCell className="font-bold tracking-widest text-zinc-700 dark:text-slate-600">
                                <span className="bg-zinc-100 dark:bg-white px-3 py-1.5 rounded-md border border-zinc-200 dark:border-slate-300">
                                  {vehicle.plate_number}
                                </span>
                              </TableCell>
                               <TableCell className="capitalize text-zinc-600 dark:text-slate-500">
                                {vehicle.category || 'Non spécifié'}
                              </TableCell>
                              <TableCell>
                                {vehicle.status === 'active' ? (
                                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">Actif</Badge>
                                ) : vehicle.status === 'maintenance' ? (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">Maintenance</Badge>
                                ) : vehicle.status === 'archived' ? (
                                  <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300">Archivé</Badge>
                                ) : vehicle.status === 'inactive' ? (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300">Inactif</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-white dark:text-slate-600">{vehicle.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-zinc-600 dark:text-slate-500">
                                 {vehicle.current_km?.toLocaleString('fr-FR')} km
                              </TableCell>
                              <TableCell className="text-right">
                                 {(vehicle as any).ownership_type === 'rented' ? (
                                   <div className="flex flex-col items-end">
                                     <span className="text-sm font-semibold text-zinc-700 dark:text-slate-600">Locatier</span>
                                     <span className="text-xs text-slate-500">{(vehicle as any).lessor_name}</span>
                                   </div>
                                 ) : (
                                   <span className="text-sm font-semibold text-zinc-700 dark:text-slate-600">En Propre</span>
                                 )}
                              </TableCell>
                              <TableCell className="text-right text-slate-500">
                                {Number(vehicle.ownership_type === 'rented' ? vehicle.rental_monthly_cost : vehicle.fixed_monthly_cost).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center p-1 align-top">
                                <VehicleAppointmentCell vehicle={vehicle} />
                              </TableCell>
                              <TableCell className="text-right font-medium text-orange-600">
                                {vehicle.financial_entries.filter(e => e.category === 'maintenance_cost').reduce((sum, entry) => sum + Number(entry.amount), 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-red-600">
                                {vehicle.financial_entries.filter(e => e.category === 'damage_cost').reduce((sum, entry) => sum + Number(entry.amount), 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center w-40">
                                <ErrorBoundary>
                                  <VehicleRowActions 
                                     vehicle={JSON.parse(JSON.stringify(vehicle))} 
                                     drivers={JSON.parse(JSON.stringify(drivers))} 
                                  />
                                </ErrorBoundary>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
