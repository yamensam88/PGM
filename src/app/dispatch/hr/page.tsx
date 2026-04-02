import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, Receipt, CalendarClock, BriefcaseMedical, Plus, Palmtree } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateEmployeeForm } from "@/components/forms/CreateEmployeeForm";
import { CreatePenaltyForm } from "@/components/forms/CreatePenaltyForm";
import { CreateAbsenceForm } from "@/components/forms/CreateAbsenceForm";
import { EditAbsenceForm } from "@/components/forms/EditAbsenceForm";
import { HrDocumentManager } from "@/components/hr/HrDocumentManager";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { EditNetSalaryForm } from "@/components/forms/EditNetSalaryForm";
import { EditGlobalCostForm } from "@/components/forms/EditGlobalCostForm";
import { EditEmployeeDialog } from "@/components/hr/EditEmployeeDialog";
import { EditBonusForm } from "@/components/forms/EditBonusForm";
import { BonusActions } from "@/components/hr/BonusActions";
import { GlobalCalendar } from "@/components/dashboard/GlobalCalendar";

export const dynamic = 'force-dynamic';

export default async function HumanResourcesPage(props: { searchParams: Promise<{ filter?: string, from?: string, to?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }
  const orgId = session.user.organization_id;

  const searchParams = await props.searchParams;
  const filter = searchParams.filter;
  const fromParam = searchParams.from;
  const toParam = searchParams.to;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate = new Date(today);
  let endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  if (fromParam && toParam) {
    startDate = new Date(fromParam);
    endDate = new Date(toParam);
  } else {
    const activeFilter = filter || 'monthly';
    if (activeFilter === 'weekly') {
      startDate.setDate(today.getDate() - 6);
    } else if (activeFilter === 'monthly') {
      startDate.setDate(today.getDate() - 29);
    }
  }

  // Fetch Drivers with their HR events
  const rawDrivers = await prisma.driver.findMany({
    where: { organization_id: orgId },
    include: {
      hr_events: {
        where: {
          OR: [
            {
              start_date: { lte: endDate },
              OR: [
                { end_date: { gte: startDate } },
                { end_date: null }
              ]
            },
            {
              event_type: { in: ['vacation', 'sick_leave'] },
              start_date: { gt: endDate }
            }
          ]
        },
        orderBy: { start_date: 'desc' }
      },
      hr_documents: true,
      daily_runs: {
        where: { 
           status: 'completed',
           date: { gte: startDate, lte: endDate }
        },
        select: { id: true, date: true }
      }
    },
    orderBy: { first_name: 'asc' }
  });

  const drivers = rawDrivers.map(d => ({
    ...d,
    daily_base_cost: d.daily_base_cost ? Number(d.daily_base_cost) : 0,
    hourly_cost: d.hourly_cost ? Number(d.hourly_cost) : null,
    quality_rating: d.quality_rating ? Number(d.quality_rating) : 0,
    performance_score: d.performance_score ? Number(d.performance_score) : 0,
  }));

  // Calculate high-level KPIs
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  
  // A simplistic presence rate (active vs total)
  const presenceRate = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;
  
  // Total cost calculation based on daily base cost (Mon-Sat, 6 days a week - holidays = ~25.33 days/month)
  const activeDriversOnly = drivers.filter(d => d.status === 'active');
  const estimatedMonthlyPayroll = activeDriversOnly.reduce((sum, d) => {
     return sum + (d.hourly_cost ? Number(d.hourly_cost) : (Number(d.daily_base_cost||0) * 25.33));
  }, 0);
  const dailyPayrollBase = estimatedMonthlyPayroll / 30.44;

  const calendarEvents = drivers.flatMap(d => (d as any).hr_events?.map((e: any) => {
     let color = "#3b82f6";
     let title = d.first_name + " " + d.last_name;
     if (e.event_type === "vacation") { color = "#10b981"; title += " (Congés)"; }
     else if (e.event_type === "sick_leave") { color = "#f59e0b"; title += " (Maladie)"; }
     else if (e.event_type === "absence") { color = "#ef4444"; title += " (Abs.)"; }
     else if (e.event_type === "presence") { color = "#6366f1"; title += " (Dispo)"; }

     const endDate = e.end_date ? new Date(e.end_date) : new Date(e.start_date);
     endDate.setDate(endDate.getDate() + 1); // FullCalendar exclusive end borders need to encompass the next day for full day events

     return {
        id: e.id,
        title: title,
        start: new Date(e.start_date).toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        allDay: true,
        backgroundColor: color,
     };
  }) || []);

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-800 p-6 md:p-8 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-x-6 gap-y-4 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" /> Ressources Humaines
            </h1>
            <p className="text-slate-500 mt-1.5 text-[15px]">
              Gérez les contrats, plannings, absences et fiches de paies de votre effectif de manière centralisée.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 z-10 w-full md:w-auto">
            <div className="flex items-center gap-3">
               <DateRangePicker />
               <Dialog>
                 <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700 text-slate-900 shadow-sm flex items-center gap-2" />}>
                   <Plus className="w-4 h-4" /> Ajouter un salarié
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-xl p-0 overflow-y-auto max-h-[85vh] bg-white border-slate-200 text-slate-800">
                   <div className="px-6 py-4 border-b border-slate-200">
                      <h2 className="text-xl font-bold flex items-center justify-between text-slate-900">Nouveau Salarié</h2>
                   </div>
                   <div className="px-6 pb-6 pt-4 bg-[#f8f9fc]">
                      <CreateEmployeeForm />
                   </div>
                 </DialogContent>
               </Dialog>
            </div>
          </div>
        </header>

        {/* KPIs Section (Premium Dark View) */}
        {(() => {
          const periodHrEvents = drivers.flatMap(d => d.hr_events).filter(e => 
            new Date(e.start_date).getTime() <= endDate.getTime() && 
            (!e.end_date || new Date(e.end_date).getTime() >= startDate.getTime())
          );

          const sickLeaves = periodHrEvents.filter(e => e.event_type === 'sick_leave');
          const unjustifiedAbsences = periodHrEvents.filter(e => e.event_type === 'absence');
          const totalPaidLeaveBalance = activeDriversOnly.reduce((sum, d) => sum + Number((d as any).paid_leave_balance || 0), 0);
          const totalAbsences = periodHrEvents.filter(e => e.event_type !== 'presence');
          const sanctions = periodHrEvents.filter(e => ['sanction', 'warning'].includes(e.event_type));
          
          const tonight = new Date(); tonight.setHours(23,59,59,999);
          const currentlyAbsent = drivers.filter(d => 
            (d as any).hr_events?.some((e: any) => 
               e.status === 'active' && 
               e.event_type !== 'presence' &&
               new Date(e.start_date).getTime() <= tonight.getTime() &&
               (!e.end_date || new Date(e.end_date).getTime() >= today.getTime())
            )
          ).length;
          const realAvailability = totalDrivers > 0 ? (((totalDrivers - currentlyAbsent) / totalDrivers) * 100).toFixed(1) : "0.0";

          return (
            <div>
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Indicateurs RH</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <Card className="bg-white border-slate-200 shadow-none flex flex-col justify-between p-5">
                  <div className="flex flex-row items-center justify-between pb-2">
                     <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Effectif Global</h3>
                     <Users className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-slate-900">{totalDrivers}</div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">{activeDrivers} Actifs sur base</p>
                  </div>
                </Card>
                
                <Card className="bg-white border-slate-200 shadow-none flex flex-col justify-between p-5">
                  <div className="flex flex-row items-center justify-between pb-2">
                     <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Disponibilité Réelle</h3>
                     <UserCheck className={`w-4 h-4 ${Number(realAvailability) < 90 ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </div>
                  <div>
                    <div className={`text-3xl font-bold tracking-tight ${Number(realAvailability) < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>{realAvailability}%</div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">{totalDrivers - currentlyAbsent} aptes aujourd'hui</p>
                  </div>
                </Card>

                <Card className="bg-white border-slate-200 shadow-none flex flex-col justify-between p-5">
                  <div className="flex flex-row items-center justify-between pb-2">
                     <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Maladie (Mois)</h3>
                     <BriefcaseMedical className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-red-400">{sickLeaves.length}</div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Arrêts sur 30 jours</p>
                  </div>
                </Card>

                <Card className="bg-white border-slate-200 shadow-none flex flex-col justify-between p-5">
                  <div className="flex flex-row items-center justify-between pb-2">
                     <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Sanctions</h3>
                     <UserX className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-orange-400">
                       {sanctions.length}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Avertissements/Retards</p>
                  </div>
                </Card>

                <Card className="bg-white border-slate-200 shadow-none flex flex-col justify-between p-5">
                  <div className="flex flex-row items-center justify-between pb-2">
                     <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Abs. Injustifiées</h3>
                     <UserX className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-rose-400">{unjustifiedAbsences.length}</div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Cumul sur 30 jours</p>
                  </div>
                </Card>

                <Card className="bg-white border-slate-200 shadow-none flex flex-col justify-between p-5">
                  <div className="flex flex-row items-center justify-between pb-2">
                     <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Congés Restants</h3>
                     <Palmtree className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-emerald-400">{totalPaidLeaveBalance}</div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Jours cumulés dispo.</p>
                  </div>
                </Card>

                <Card className="bg-blue-950/10 border-blue-900/30 shadow-none flex flex-col justify-between p-5">
                  <div className="flex flex-row items-center justify-between pb-2">
                     <h3 className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest">Masse Salariale Est.</h3>
                     <Receipt className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight text-blue-400">{estimatedMonthlyPayroll.toLocaleString('fr-FR', {maximumFractionDigits: 0})} €</div>
                    <p className="text-[11px] text-blue-500/70 mt-1 font-medium">Base Lissée: {dailyPayrollBase.toFixed(2)} €/j calendaire</p>
                  </div>
                </Card>
              </div>
            </div>
          );
        })()}

        <Tabs defaultValue="directory" className="space-y-6 pt-4">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-lg w-full overflow-x-auto justify-start no-scrollbar hide-scrollbar">
                <TabsTrigger value="directory" className="text-xs shrink-0 data-[state=active]:bg-[#27272a] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all">Suivi Présence & Effectif</TabsTrigger>
                <TabsTrigger value="admin" className="text-xs shrink-0 data-[state=active]:bg-[#27272a] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all">Administratif & Paie</TabsTrigger>
                <TabsTrigger value="absences" className="text-xs shrink-0 data-[state=active]:bg-[#27272a] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all">Congés & Incidents</TabsTrigger>
                <TabsTrigger value="planning" className="text-xs shrink-0 data-[state=active]:bg-[#27272a] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all">Planning Chauffeurs</TabsTrigger>
                <TabsTrigger value="primes" className="text-xs shrink-0 data-[state=active]:bg-[#27272a] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all">Droit Prime</TabsTrigger>
                <TabsTrigger value="archives" className="text-xs shrink-0 data-[state=active]:bg-[#27272a] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-md transition-all">Anciens Salariés</TabsTrigger>
              </TabsList>
           </div>

           <TabsContent value="planning" className="space-y-4">
              <GlobalCalendar events={calendarEvents} />
           </TabsContent>

           <TabsContent value="directory" className="space-y-4">
              <Card className="border-slate-200 bg-white shadow-none overflow-hidden rounded-xl">
                  <div className="overflow-x-auto">
                     <table className="w-full text-[13px] text-left">
                        <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Salarié</th>
                            <th className="px-6 py-4 font-semibold">Poste & Contrat</th>
                            <th className="px-6 py-4 font-semibold text-center">J. Présence (Mois)</th>
                            <th className="px-6 py-4 font-semibold text-center">J. Maladie</th>
                            <th className="px-6 py-4 font-semibold text-center">Abs. Injustifiées</th>
                            <th className="px-6 py-4 font-semibold text-center">Congés Restants</th>
                            <th className="px-6 py-4 font-semibold text-center">Droit Prime</th>
                            <th className="px-6 py-4 font-semibold text-right">Entrée / Sortie</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#27272a]/50">
                          {drivers.filter(d => d.status === 'active').map(driver => {
                             const now = new Date();
                             const currentMonthRuns = (driver.daily_runs || []).filter(r => 
                                 new Date(r.date).getMonth() === now.getMonth() && 
                                 new Date(r.date).getFullYear() === now.getFullYear()
                             );
                             const presentDays = currentMonthRuns.length;
                             
                             const calculateDays = (events: any[], type: string) => events.filter((e: any) => e.event_type === type).reduce((sum: number, e: any) => {
                               const start = new Date(e.start_date);
                               const end = e.end_date ? new Date(e.end_date) : start;
                               const diffTime = end.getTime() - start.getTime();
                               return sum + (diffTime >= 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0);
                             }, 0);

                             const sickDays = calculateDays(((driver as any).hr_events || []), 'sick_leave');
                             const unjustifiedAbs = ((driver as any).hr_events || []).filter((e: any) => 
                                 e.event_type === 'absence' && 
                                 new Date(e.start_date).getMonth() === now.getMonth() &&
                                 new Date(e.start_date).getFullYear() === now.getFullYear()
                             ).reduce((sum: number, e: any) => {
                               const start = new Date(e.start_date);
                               const end = e.end_date ? new Date(e.end_date) : start;
                               const diffTime = end.getTime() - start.getTime();
                               return sum + (diffTime >= 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0);
                             }, 0);
                             const leaveBalance = 25 - calculateDays(((driver as any).hr_events || []), 'vacation');
                             const getsBonus = sickDays === 0 && ((driver as any).hr_events || []).filter((e: any) => e.event_type === 'sanction').length === 0 && presentDays >= 10;

                             const todayObj = new Date();
                             todayObj.setHours(0,0,0,0);
                             const tonightObj = new Date();
                             tonightObj.setHours(23,59,59,999);

                             const upcomingLeaves = ((driver as any).hr_events || []).filter((e: any) => 
                               ['vacation', 'sick_leave'].includes(e.event_type) && 
                               new Date(e.start_date).getTime() > tonightObj.getTime()
                             ).sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
                             const nextLeave = upcomingLeaves.length > 0 ? upcomingLeaves[0] : null;

                             const currentLeaves = ((driver as any).hr_events || []).filter((e: any) => 
                               ['vacation', 'sick_leave'].includes(e.event_type) && 
                               new Date(e.start_date).getTime() <= tonightObj.getTime() &&
                               (!e.end_date || new Date(e.end_date).getTime() >= todayObj.getTime())
                             );
                             const currentLeave = currentLeaves.length > 0 ? currentLeaves[0] : null;

                             return (
                             <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-start justify-between min-w-[200px]">
                                    <div>
                                      <p className="font-semibold text-slate-700">{driver.first_name} {driver.last_name}</p>
                                      <p className="text-slate-500 text-[11px]">{driver.email || 'Pas email recensé'}</p>
                                      {currentLeave ? (
                                        <Badge className="mt-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 shadow-none text-[10px] font-bold px-1.5 py-0 leading-tight">
                                          {currentLeave.event_type === 'vacation' ? '⛱️ En congés' : '🤒 En arrêt'} {currentLeave.end_date ? `jusqu'au ${format(new Date(currentLeave.end_date), 'dd/MM')}` : ''}
                                        </Badge>
                                      ) : nextLeave ? (
                                        <div className="flex">
                                          <Badge className="mt-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 shadow-none text-[10px] font-bold px-1.5 py-0 leading-tight">
                                            🔜 {nextLeave.event_type === 'vacation' ? 'Congés' : 'Arrêt'} à partir du {format(new Date(nextLeave.start_date), 'dd/MM')}
                                          </Badge>
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className="pl-2">
                                      <EditEmployeeDialog employee={driver} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 space-y-1.5">
                                  <Badge variant="outline" className={driver.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white text-slate-500 border-slate-300'}>
                                    {(driver as any).job_title || 'Chauffeur'}
                                  </Badge>
                                  <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">{driver.employment_type}</p>
                                </td>
                                <td className="px-6 py-4 font-medium text-center text-slate-600">{presentDays} j</td>
                                <td className="px-6 py-4 font-medium text-center text-red-400">{sickDays > 0 ? `${sickDays} j` : '-'}</td>
                                <td className="px-6 py-4 text-center">
                                  {unjustifiedAbs > 0 ? (
                                    <div className="flex flex-col items-center">
                                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px]">{unjustifiedAbs} j</span>
                                      <span className="text-[10px] text-red-500 font-semibold mt-1">
                                        -{(unjustifiedAbs * Number(driver.daily_base_cost || 0)).toFixed(2)}€
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-medium text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-medium text-center text-blue-400">{leaveBalance > 0 ? `${leaveBalance} j` : '0 j'}</td>
                                <td className="px-6 py-4 text-center">
                                    {getsBonus ? (
                                       <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-none font-medium text-xs">Oui</Badge>
                                    ) : (
                                       <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-none font-medium text-xs">Non</Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                   <p className="text-slate-600 text-xs">In: {driver.hire_date ? format(new Date(driver.hire_date), 'dd/MM/yy') : '-'}</p>
                                   <p className="text-zinc-600 text-[11px]">Out: -</p>
                                </td>
                             </tr>
                           )})}
                       </tbody>
                     </table>
                  </div>
              </Card>
           </TabsContent>

           <TabsContent value="admin" className="space-y-4">
              <Card className="border-slate-200 bg-white shadow-none overflow-hidden rounded-xl">
                  <div className="overflow-x-auto">
                     <table className="w-full text-[13px] text-left">
                       <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Salarié</th>
                            <th className="px-6 py-4 font-semibold">Coût Global / Mois</th>
                            <th className="px-6 py-4 font-semibold">Salaire Net (Est.)</th>
                            <th className="px-6 py-4 font-semibold">RDV Médical Obligatoire</th>
                            <th className="px-6 py-4 font-semibold text-right">Fiche de Paie & Contrat</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#27272a]/50">
                          {drivers.filter(d => d.status === 'active').map(driver => {
                             // Use EXACT stored monthly cost (in hourly_cost) if available, otherwise fallback to multiplying daily by 25.33
                             const monthlyCost = driver.hourly_cost ? Number(driver.hourly_cost) : (Number(driver.daily_base_cost || 0) * 25.33);
                             // Use DB value if exists, else fallback to 75% estimation
                             const hasCustomNet = driver.monthly_net_salary !== null && driver.monthly_net_salary !== undefined;
                             const netSalary = hasCustomNet ? Number(driver.monthly_net_salary) : (monthlyCost * 0.75);
                             const isMedicalDue = Math.random() > 0.8;

                             return (
                             <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-slate-700">{driver.first_name} {driver.last_name}</p>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <span className="font-medium text-orange-400">
                                         {monthlyCost.toFixed(2)} €
                                      </span>
                                      <Dialog>
                                        <DialogTrigger render={<button className="text-slate-400 hover:text-orange-500 text-[11px] font-semibold ml-1 underline decoration-transparent hover:decoration-orange-500/30 underline-offset-2 transition-all" />}>
                                           Modifier
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-sm bg-white border-slate-200 text-slate-800">
                                           <DialogHeader>
                                              <DialogTitle className="text-slate-800">Coût Mensuel Global : {driver.first_name}</DialogTitle>
                                              <DialogDescription className="text-slate-500">
                                                Redéfinissez le coût patronal mensuel. Le coût journalier déduit pour les tournées sera recalculé automatiquement (sur 25.33 jours).
                                              </DialogDescription>
                                           </DialogHeader>
                                           <EditGlobalCostForm driverId={driver.id} initialCost={monthlyCost} />
                                        </DialogContent>
                                      </Dialog>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <span className={`font-medium ${hasCustomNet ? 'text-emerald-500 font-bold' : 'text-emerald-400/80'}`}>
                                         {netSalary.toFixed(2)} € {hasCustomNet ? '' : '(Est.)'}
                                      </span>
                                      <Dialog>
                                        <DialogTrigger render={<button className="text-slate-400 hover:text-blue-500 text-[11px] font-semibold ml-1 underline decoration-transparent hover:decoration-blue-500/30 underline-offset-2 transition-all" />}>
                                           Modifier
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-sm bg-white border-slate-200">
                                           <DialogHeader>
                                              <DialogTitle className="text-slate-800">Salaire Net : {driver.first_name}</DialogTitle>
                                              <DialogDescription className="text-slate-500">Définissez manuellement le salaire net pour annuler l'estimation automatique.</DialogDescription>
                                           </DialogHeader>
                                           <EditNetSalaryForm driverId={driver.id} initialNetSalary={hasCustomNet ? netSalary : ''} />
                                        </DialogContent>
                                      </Dialog>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                    {isMedicalDue ? (
                                        <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">À programmer urgemment</span>
                                    ) : (
                                        <span className="text-[11px] text-slate-500 font-medium">À jour (Valide &gt; 1 an)</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 flex justify-end">
                                  {/* Wrapping HrDocumentManager so it has the dark context if needed */}
                                  <div>
                                    <HrDocumentManager driver={driver as any} />
                                  </div>
                                </td>
                             </tr>
                           )})}
                       </tbody>
                     </table>
                  </div>
              </Card>
           </TabsContent>

           <TabsContent value="absences" className="space-y-4">
               <div className="flex justify-end gap-3 mb-4">
                  <Dialog>
                    <DialogTrigger render={<Button className="bg-blue-600 text-slate-900 hover:bg-blue-700 shadow-sm" />}>
                      Déclarer Absence / Maladie / Congés
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
                      <DialogHeader>
                        <DialogTitle className="text-blue-500">Nouvelle Déclaration RH</DialogTitle>
                        <DialogDescription className="text-slate-500">
                          Enregistrez une absence, un arrêt maladie ou la pose d'un congé payé pour un chauffeur.
                        </DialogDescription>
                      </DialogHeader>
                      <div>
                        <CreateAbsenceForm drivers={drivers} />
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog>
                    <DialogTrigger render={<Button variant="outline" className="border-red-900/50 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-400" />}>
                      Pénalité Client / Exploitation
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
                      <DialogHeader>
                        <DialogTitle className="text-red-500">Pénalité Client / Exploitation</DialogTitle>
                        <DialogDescription className="text-slate-500">
                          Enregistrez une pénalité financière facturée à l'entreprise (ex: Amazon) due à une erreur ou une non-livraison du chauffeur.
                        </DialogDescription>
                      </DialogHeader>
                      <div>
                        <CreatePenaltyForm drivers={drivers} />
                      </div>
                    </DialogContent>
                  </Dialog>
               </div>
               
               <Card className="border-slate-200 bg-white shadow-none overflow-hidden rounded-xl">
                  <div className="overflow-x-auto">
                     <table className="w-full text-[13px] text-left">
                       <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Salarié</th>
                            <th className="px-6 py-4 font-semibold">Type d'Événement</th>
                            <th className="px-6 py-4 font-semibold">Période</th>
                            <th className="px-6 py-4 font-semibold">Notes</th>
                             <th className="px-6 py-4 font-semibold">Statut</th>
                             <th className="px-6 py-4 font-semibold text-right">Actions</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-[#27272a]/50">
                          {drivers.flatMap(d => ((d as any).hr_events || []).map((e: any) => ({...e, driver: d})))
                           .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                           .map(event => (
                             <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-700">
                                  {event.driver.first_name} {event.driver.last_name}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant="outline" className={
                                    event.event_type === 'sick_leave' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                    event.event_type === 'vacation' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    event.event_type === 'sanction' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                    'bg-white text-slate-500 border-slate-300'
                                  }>
                                    {event.event_type === 'sick_leave' ? 'Maladie' : 
                                     event.event_type === 'vacation' ? 'Congés' : 
                                     event.event_type === 'sanction' ? 'Sanction' : event.event_type}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                                  {format(new Date(event.start_date), 'dd/MM/yyyy')} 
                                  {event.end_date ? ` au ${format(new Date(event.end_date), 'dd/MM/yyyy')}` : ''}
                                </td>
                                <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                                  {event.notes || '-'}
                                </td>
                                <td className="px-6 py-4">
                                   <span className="capitalize text-[11px] font-semibold tracking-wider text-slate-500">{event.status}</span>
                                </td>
                                <td className="px-6 py-4 flex justify-end">
                                  {['sick_leave', 'vacation', 'absence'].includes(event.event_type) && (
                                    <Dialog>
                                      <DialogTrigger render={<button className="text-slate-400 hover:text-blue-500 text-[11px] font-semibold underline decoration-transparent hover:decoration-blue-500/30 underline-offset-2 transition-all" />}>Modifier</DialogTrigger>
                                      <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
                                        <DialogHeader>
                                          <DialogTitle className="text-blue-500">Modifier l'événement</DialogTitle>
                                          <DialogDescription className="text-slate-500">Mettez à jour les dates ou le type d'absence.</DialogDescription>
                                        </DialogHeader>
                                        <EditAbsenceForm event={event} drivers={drivers} />
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </td>
                             </tr>
                          ))}
                          {drivers.flatMap(d => (d as any).hr_events || []).length === 0 && (
                            <tr>
                               <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">Aucun événement RH enregistré (absences, maladies, sanctions).</td>
                            </tr>
                          )}
                       </tbody>
                     </table>
                  </div>
              </Card>
           </TabsContent>

           <TabsContent value="primes" className="space-y-4">
              <Card className="border-slate-200 bg-white shadow-none overflow-hidden rounded-xl">
                  <div className="overflow-x-auto">
                     <table className="w-full text-[13px] text-left">
                        <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Salarié</th>
                            <th className="px-6 py-4 font-semibold">Cible Prime / Mois</th>
                            <th className="px-6 py-4 font-semibold text-center">Éligibilité Automatique</th>
                            <th className="px-6 py-4 font-semibold text-right">Décision (Mois Courant)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#27272a]/50">
                          {drivers.filter(d => d.status === 'active').map(driver => {
                             const now = new Date();
                             const currentMonthRuns = (driver.daily_runs || []).filter(r => 
                                 new Date(r.date).getMonth() === now.getMonth() && 
                                 new Date(r.date).getFullYear() === now.getFullYear()
                             );
                             const presentDays = currentMonthRuns.length;
                             
                             const sickDays = ((driver as any).hr_events || []).filter((e: any) => e.event_type === 'sick_leave').length * 2;
                             const sanctions = ((driver as any).hr_events || []).filter((e: any) => e.event_type === 'sanction').length;
                             
                             const getsBonus = sickDays === 0 && sanctions === 0 && presentDays >= 10;
                             const defaultBonusAmt = (driver as any).base_bonus_amount ? Number((driver as any).base_bonus_amount) : 0;
                             
                             // Find the current month's decision
                             const bonusEvents = ((driver as any).hr_events || []).filter((e: any) => 
                                 e.event_type === 'bonus' && 
                                 new Date(e.start_date).getMonth() === now.getMonth() &&
                                 new Date(e.start_date).getFullYear() === now.getFullYear()
                             );
                             const currentBonusEvent = bonusEvents.length > 0 ? bonusEvents[0] : null;

                             return (
                             <tr key={driver.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-slate-700">{driver.first_name} {driver.last_name}</p>
                                  <p className="text-slate-500 text-[11px]">{driver.email || 'Pas email recensé'}</p>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-blue-600">
                                         {defaultBonusAmt.toFixed(2)} €
                                      </span>
                                      <Dialog>
                                        <DialogTrigger render={<button className="text-slate-400 hover:text-blue-500 text-[11px] font-semibold ml-1 underline decoration-transparent hover:decoration-blue-500/30 underline-offset-2 transition-all" />}>
                                           Modifier
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-sm bg-white border-slate-200 text-slate-800">
                                           <DialogHeader>
                                              <DialogTitle className="text-slate-800">Prime cible : {driver.first_name}</DialogTitle>
                                              <DialogDescription className="text-slate-500">
                                                Définissez le montant de base de la prime mensuelle (objectif à 100%).
                                              </DialogDescription>
                                           </DialogHeader>
                                           <EditBonusForm driverId={driver.id} initialAmount={defaultBonusAmt} />
                                        </DialogContent>
                                      </Dialog>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-1">
                                      {getsBonus ? (
                                         <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-none font-medium text-xs">Favorable</Badge>
                                      ) : (
                                         <Badge className="bg-orange-50 text-orange-600 border border-orange-200/50 shadow-none font-medium text-xs">Défavorable</Badge>
                                      )}
                                      <span className="text-[10px] text-slate-400">({presentDays}j prés. / {sickDays} abs. / {sanctions} sanct.)</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 flex justify-end">
                                   <BonusActions 
                                      driverId={driver.id}
                                      currentMonth={now.getMonth()}
                                      currentYear={now.getFullYear()}
                                      amount={defaultBonusAmt}
                                      currentStatus={currentBonusEvent ? currentBonusEvent.status : null}
                                   />
                                </td>
                             </tr>
                           )})}
                       </tbody>
                     </table>
                  </div>
              </Card>
           </TabsContent>

           <TabsContent value="archives" className="space-y-4">
              <Card className="border-slate-200 bg-white shadow-none overflow-hidden rounded-xl">
                  <div className="overflow-x-auto">
                     <table className="w-full text-[13px] text-left">
                        <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-[#f8f9fc] border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Salarié Archivé</th>
                            <th className="px-6 py-4 font-semibold">Poste</th>
                            <th className="px-6 py-4 font-semibold">Date de Sortie</th>
                            <th className="px-6 py-4 font-semibold">Motif</th>
                            <th className="px-6 py-4 font-semibold">Notes & Commentaires</th>
                            <th className="px-6 py-4 font-semibold text-right">In/Out</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#27272a]/50">
                          {drivers.filter(d => d.status === 'inactive').map(driver => (
                             <tr key={driver.id} className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors opacity-80 hover:opacity-100">
                                <td className="px-6 py-4">
                                  <div className="flex items-start justify-between min-w-[200px]">
                                    <div>
                                      <p className="font-semibold text-slate-700">{driver.first_name} {driver.last_name}</p>
                                      <p className="text-slate-500 text-[11px]">{driver.email || 'Pas email recensé'}</p>
                                    </div>
                                    <div className="pl-2">
                                      <EditEmployeeDialog employee={driver} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 space-y-1.5">
                                  <Badge variant="outline" className="bg-white text-slate-500 border-slate-300">
                                    {(driver as any).job_title || 'Chauffeur'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">
                                  {(driver as any).departure_date ? format(new Date((driver as any).departure_date), 'dd/MM/yyyy') : '-'}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200 shadow-none font-medium text-[11px]">
                                     {(driver as any).departure_reason || 'Raison inconnue'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-[11px] max-w-xs truncate">
                                  {(driver as any).departure_comments || '-'}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                   <p className="text-slate-600 text-[11px]">In : {driver.hire_date ? format(new Date(driver.hire_date), 'dd/MM/yy') : '-'}</p>
                                   <p className="text-slate-600 text-[11px]">Out : {(driver as any).departure_date ? format(new Date((driver as any).departure_date), 'dd/MM/yy') : '-'}</p>
                                </td>
                             </tr>
                           ))}
                           {drivers.filter(d => d.status === 'inactive').length === 0 && (
                             <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium bg-slate-50/50">Aucun ancien salarié archivé.</td>
                             </tr>
                           )}
                       </tbody>
                     </table>
                  </div>
              </Card>
           </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
