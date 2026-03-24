"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, CheckCircle, Clock, LineChart, AlertTriangle, ChevronDown, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CreateDamageForm } from "@/components/forms/CreateDamageForm";
import { DriverHistoryDialog } from "./DriverHistoryDialog";
import { UpdateRunForm } from "@/components/forms/UpdateRunForm";
import { deleteRun } from "@/lib/actions";

type DailyRunWithRelations = any; // normally Prisma output

export function RunsTable({ data, showHistoryAction, isExploitationMode, groupByZone, disableDriverLink }: { data: DailyRunWithRelations[], showHistoryAction?: boolean, isExploitationMode?: boolean, groupByZone?: boolean, disableDriverLink?: boolean }) {
  const [incidentRunId, setIncidentRunId] = useState<DailyRunWithRelations | null>(null);
  const [historyDriver, setHistoryDriver] = useState<any>(null);
  const [editingRun, setEditingRun] = useState<DailyRunWithRelations | null>(null);
  
  const [filterDriver, setFilterDriver] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterZone, setFilterZone] = useState("");

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'planned': return <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full border-0">Planifié</Badge>;
      case 'in_progress': return <Badge variant="default" className="bg-blue-50 text-blue-600 font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">En cours</Badge>;
      case 'completed': return <Badge variant="default" className="bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100">Terminé</Badge>;
      case 'failed': return <Badge variant="destructive" className="bg-red-50 text-red-600 font-semibold px-2.5 py-0.5 rounded-full border border-red-100">Échec</Badge>;
      default: return <Badge variant="outline" className="font-medium rounded-full text-slate-500">{status}</Badge>;
    }
  };

  const handleAction = (action: string, id: string) => {
    toast.info(`Action: ${action} sur la tournée ${id}`);
  };

  const handleDeleteRun = async (runId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tournée ? Cette action supprimera également tous les événements et données financières liés à cette tournée. Action irréversible.")) return;
    
    // Optimistic UI state could be implemented, but simple logic works fine
    const res = await deleteRun(runId);
    if (res.success) {
      toast.success("Tournée supprimée avec succès.");
      // The page will automatically be revalidated from the server side
    } else {
      toast.error(res.error || "Erreur lors de la suppression");
    }
  };

  if(!data || data.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Aucune tournée n'a été planifiée pour cette période.
      </div>
    );
  }

  const filteredData = data.filter((run: any) => {
    const dName = `${run.driver?.first_name || ''} ${run.driver?.last_name || ''}`.toLowerCase();
    const cName = `${run.client?.name || ''}`.toLowerCase();
    const zName = `${run.zone?.name || ''}`.toLowerCase();
    
    if (filterDriver && !dName.includes(filterDriver.toLowerCase())) return false;
    if (filterClient && !cName.includes(filterClient.toLowerCase())) return false;
    if (filterZone && !zName.includes(filterZone.toLowerCase())) return false;
    return true;
  });

  const totalLoaded = filteredData.reduce((sum, run) => sum + (run.packages_loaded || 0), 0);
  const totalDelivered = filteredData.reduce((sum, run) => sum + (run.packages_delivered || 0), 0);
  const totalAdvised = filteredData.reduce((sum, run) => sum + ((run.packages_advised_direct || 0) + (run.packages_advised_relay || 0) || run.packages_advised || 0), 0);
  const totalEcart = totalLoaded - (totalDelivered + totalAdvised);
  const totalKm = filteredData.reduce((sum, run) => sum + (run.km_total || Math.max(0, (run.km_end || 0) - (run.km_start || 0))), 0);
  
  const totalMaintenance = filteredData.reduce((sum, run) => sum + Number(run.financial_entries?.filter((e: any) => e.category === 'maintenance_cost').reduce((s: number, e: any) => s + Number(e.amount), 0)), 0);
  const totalDamages = filteredData.reduce((sum, run) => sum + Number(run.financial_entries?.filter((e: any) => e.category === 'damage_cost').reduce((s: number, e: any) => s + Number(e.amount), 0)), 0);

  const groupedData = groupByZone ? filteredData.reduce((acc, run) => {
    const z = run.zone?.name || "Sans Zone";
    if(!acc[z]) acc[z] = [];
    acc[z].push(run);
    return acc;
  }, {} as Record<string, DailyRunWithRelations[]>) : null;

  const renderRunRow = (run: DailyRunWithRelations) => {
    const loaded = run.packages_loaded || 0;
    const delivered = run.packages_delivered || 0;
    const advised = (run.packages_advised_direct || 0) + (run.packages_advised_relay || 0) || run.packages_advised || 0;
    const ecart = loaded - (delivered + advised);
    const kmUtiles = run.km_total || Math.max(0, (run.km_end || 0) - (run.km_start || 0));

    return (
      <TableRow key={run.id} className="hover:bg-slate-50/50 border-0 transition-colors duration-200 group">
        <TableCell className="font-medium text-[13px] px-4">
          {run.driver ? (
            disableDriverLink ? (
              <span className="text-slate-700 font-semibold block">
                {run.driver.first_name} {run.driver.last_name}
              </span>
            ) : (
              <Link href={`/driver?driverId=${run.driver_id}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors block" title="Ouvrir le formulaire chauffeur">
                {run.driver.first_name} {run.driver.last_name}
              </Link>
            )
          ) : (
            <span className="text-slate-500 italic">Non assigné</span>
          )}
        </TableCell>
        <TableCell className="px-4">
          <span className="text-[12px] font-mono font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
            {run.vehicle?.plate_number}
          </span>
        </TableCell>
        <TableCell className="text-[13px] text-slate-600 font-medium px-4">{run.client?.name}</TableCell>
        <TableCell className="text-[13px] text-slate-500 px-4">{run.zone?.name}</TableCell>
        
        <TableCell className="text-center text-[13px] text-slate-600 font-semibold">{loaded}</TableCell>
        <TableCell className="text-center text-[13px] text-emerald-600 font-bold">{delivered}</TableCell>
        <TableCell className="text-center text-[13px] text-orange-500 font-bold">{advised}</TableCell>
        
        <TableCell className="text-center">
          {ecart !== 0 ? (
            <Badge variant="outline" className="border-red-100 text-red-600 bg-red-50 font-semibold rounded-full px-2">
              {ecart > 0 ? `-${ecart}` : `+${Math.abs(ecart)}`}
            </Badge>
          ) : (
            <span className="text-slate-300 font-medium text-[13px]">-</span>
          )}
        </TableCell>

        <TableCell className="text-center font-medium text-[13px] text-slate-600">
          {kmUtiles} <span className="text-slate-400 text-[11px]">km</span>
        </TableCell>
        
        <TableCell className="text-center">
          {getStatusBadge(run.status)}
        </TableCell>

        <TableCell className="text-right px-4">
          <div className="flex flex-col items-end gap-0.5">
             {Number(run.financial_entries?.filter((e: any) => e.category === 'maintenance_cost').reduce((s: number, e: any) => s + Number(e.amount), 0)) > 0 && (
               <span className="text-[11px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                 {run.financial_entries?.filter((e: any) => e.category === 'maintenance_cost').reduce((sum: number, entry: any) => sum + Number(entry.amount), 0).toFixed(0)}€ Maint.
               </span>
             )}
             {Number(run.financial_entries?.filter((e: any) => e.category === 'damage_cost').reduce((s: number, e: any) => s + Number(e.amount), 0)) > 0 && (
               <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                 {run.financial_entries?.filter((e: any) => e.category === 'damage_cost').reduce((sum: number, entry: any) => sum + Number(entry.amount), 0).toFixed(0)}€ Casse
               </span>
             )}
             {Number(run.financial_entries?.filter((e: any) => e.category === 'maintenance_cost' || e.category === 'damage_cost').reduce((s: number, e: any) => s + Number(e.amount), 0)) === 0 && (
               <span className="text-slate-300 font-medium text-[13px]">-</span>
             )}
          </div>
        </TableCell>

        <TableCell className="text-right px-4">
          <span className="text-[13px] font-medium text-slate-600">
            {new Date(run.date).toLocaleDateString("fr-FR")}
          </span>
        </TableCell>

        {isExploitationMode ? (
          <TableCell className="text-right px-4">
            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
              {showHistoryAction && run.driver && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" 
                  onClick={() => setHistoryDriver(run.driver)} 
                  title="Historique Financier du Chauffeur"
                  type="button"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => setEditingRun(run)} title="Modifier la tournée">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => setIncidentRunId(run)} title="Déclarer Casse/Sinistre">
                <AlertTriangle className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-full" onClick={() => handleDeleteRun(run.id)} title="Supprimer la tournée">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        ) : (
          <TableCell className="text-right px-4">
            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
              {showHistoryAction && run.driver && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" 
                  onClick={() => setHistoryDriver(run.driver)} 
                  title="Historique Financier du Chauffeur"
                  type="button"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => setEditingRun(run)} title="Modifier la tournée">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => setIncidentRunId(run)} title="Déclarer Casse/Sinistre">
                <AlertTriangle className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-700 hover:bg-red-100 rounded-full" onClick={() => handleDeleteRun(run.id)} title="Supprimer la tournée">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Link href={`/dispatch/runs/${run.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="Détails" type="button">
                  <FileText className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const uniqueDrivers = React.useMemo(() => Array.from(new Set(data.map((r: any) => `${r.driver?.first_name || ''} ${r.driver?.last_name || ''}`.trim()).filter(Boolean))).sort(), [data]);
  const uniqueClients = React.useMemo(() => Array.from(new Set(data.map((r: any) => r.client?.name).filter(Boolean))).sort(), [data]);
  const uniqueZones = React.useMemo(() => Array.from(new Set(data.map((r: any) => r.zone?.name).filter(Boolean))).sort(), [data]);

  return (
    <>

      <div className="overflow-x-auto w-full rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] ring-1 ring-slate-900/5">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-100">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="px-4 py-2">
                <div className="relative inline-flex items-center">
                  <select
                    value={filterDriver}
                    onChange={e => setFilterDriver(e.target.value)}
                    className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-transparent cursor-pointer focus:outline-none hover:text-slate-800 max-w-[140px] pr-5 truncate appearance-none"
                    title="Filtrer par Chauffeur"
                  >
                    <option value="">CHAUFFEUR</option>
                    {uniqueDrivers.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-4">Véhicule</TableHead>
              <TableHead className="px-4 py-2">
                <div className="relative inline-flex items-center">
                  <select
                    value={filterClient}
                    onChange={e => setFilterClient(e.target.value)}
                    className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-transparent cursor-pointer focus:outline-none hover:text-slate-800 max-w-[120px] pr-5 truncate appearance-none"
                    title="Filtrer par Client"
                  >
                    <option value="">CLIENT</option>
                    {uniqueClients.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </TableHead>
              <TableHead className="px-4 py-2">
                <div className="relative inline-flex items-center">
                  <select
                    value={filterZone}
                    onChange={e => setFilterZone(e.target.value)}
                    className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest bg-transparent cursor-pointer focus:outline-none hover:text-slate-800 max-w-[100px] pr-5 truncate appearance-none"
                    title="Filtrer par Zone"
                  >
                    <option value="">ZONE</option>
                    {uniqueZones.map(z => <option key={z as string} value={z as string}>{z as string}</option>)}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-0 pointer-events-none" />
                </div>
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Total</TableHead>
              <TableHead className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest text-center">Livré</TableHead>
              <TableHead className="text-[11px] font-semibold text-orange-600 uppercase tracking-widest text-center">Avisé</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Écart</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Km Utiles</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">Statut</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right px-4">Dommages</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right px-4">Date</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-right px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100/80">
            {groupByZone && groupedData ? (
              Object.entries(groupedData as Record<string, DailyRunWithRelations[]>).map(([zoneName, zoneRuns]) => {
                const zLoaded = zoneRuns.reduce((s, r) => s + (r.packages_loaded || 0), 0);
                const zDelivered = zoneRuns.reduce((s, r) => s + (r.packages_delivered || 0), 0);
                const zAdvised = zoneRuns.reduce((s, r) => s + ((r.packages_advised_direct || 0) + (r.packages_advised_relay || 0) || r.packages_advised || 0), 0);
                const zEcart = zLoaded - (zDelivered + zAdvised);
                const zKm = zoneRuns.reduce((sum, run) => sum + (run.km_total || Math.max(0, (run.km_end || 0) - (run.km_start || 0))), 0);
                const zMaint = zoneRuns.reduce((sum, run) => sum + Number(run.financial_entries?.filter((e: any) => e.category === 'maintenance_cost').reduce((s: number, e: any) => s + Number(e.amount), 0)), 0);
                const zDamages = zoneRuns.reduce((sum, run) => sum + Number(run.financial_entries?.filter((e: any) => e.category === 'damage_cost').reduce((s: number, e: any) => s + Number(e.amount), 0)), 0);

                return (
                  <React.Fragment key={zoneName}>
                    <TableRow className="bg-slate-50/40 hover:bg-slate-50/40 border-b border-t border-slate-200">
                      <TableCell colSpan={13} className="font-bold text-indigo-900 py-3 text-[12px] uppercase tracking-widest pl-4">
                        Zone : {zoneName} <span className="text-slate-400 font-medium normal-case ml-2 tracking-normal">({zoneRuns.length} tournées)</span>
                      </TableCell>
                    </TableRow>
                    
                    {zoneRuns.map(run => renderRunRow(run))}
                    
                    <TableRow className="bg-slate-50 border-t border-slate-100 hover:bg-slate-50">
                      <TableCell colSpan={4} className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-4">
                        Sous-total Zone
                      </TableCell>
                      <TableCell className="text-center text-[12px] text-slate-700 font-bold">{zLoaded}</TableCell>
                      <TableCell className="text-center text-[12px] text-emerald-600 font-bold">{zDelivered}</TableCell>
                      <TableCell className="text-center text-[12px] text-orange-600 font-bold">{zAdvised}</TableCell>
                      <TableCell className="text-center">
                        {zEcart !== 0 ? (
                          <Badge variant="outline" className="border-red-100/80 text-red-600 bg-red-50/80 font-medium rounded-full px-1.5">
                             {zEcart > 0 ? `-${zEcart}` : `+${Math.abs(zEcart)}`}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 font-medium text-[12px]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-[12px] text-slate-700 font-bold">
                        {zKm} <span className="text-[10px] text-slate-500 font-medium">km</span>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right px-4">
                        <div className="flex flex-col items-end gap-0.5">
                           {zMaint > 0 && <span className="text-[10px] text-orange-500">{zMaint.toFixed(0)}€ Maint.</span>}
                           {zDamages > 0 && <span className="text-[10px] text-red-500">{zDamages.toFixed(0)}€ Casse</span>}
                           {zMaint === 0 && zDamages === 0 && <span className="text-slate-300 font-medium text-[12px]">-</span>}
                        </div>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            ) : (
              filteredData.map((run: any) => renderRunRow(run))
            )}
          </TableBody>
        </Table>
      </div>

      <div>
        <Dialog open={!!incidentRunId} onOpenChange={(open) => !open && setIncidentRunId(null)}>
          <DialogContent className="sm:max-w-[500px] bg-white border-slate-200 text-slate-800">
            <DialogHeader>
              <DialogTitle className="text-red-500">Déclarer un sinistre</DialogTitle>
              <DialogDescription className="text-slate-500">
                Enregistrez une casse rattachée à cette tournée. Le véhicule sélectionné est <strong className="text-slate-700">{incidentRunId?.vehicle?.plate_number}</strong>.
              </DialogDescription>
            </DialogHeader>
            {incidentRunId && (
              <CreateDamageForm 
                runId={incidentRunId.id}
                vehicleId={incidentRunId.vehicle_id} 
                drivers={incidentRunId.driver ? [{id: incidentRunId.driver.id, first_name: incidentRunId.driver.first_name, last_name: incidentRunId.driver.last_name}] : []} 
                onSuccess={() => {
                  setIncidentRunId(null);
                  toast.success("Sinistre enregistré avec succès.");
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingRun} onOpenChange={(open) => !open && setEditingRun(null)}>
          <DialogContent className="sm:max-w-[700px] bg-white border-slate-200 text-slate-800">
            <DialogHeader>
              <DialogTitle className="text-blue-600">Modifier la tournée</DialogTitle>
              <DialogDescription className="text-slate-500">
                Mettez à jour les valeurs d'avancement de la tournée en cours.
              </DialogDescription>
            </DialogHeader>
            {editingRun && (
              <UpdateRunForm 
                initialData={editingRun} 
                onSuccess={() => {
                  setEditingRun(null);
                  toast.success("Tournée mise à jour avec succès.");
                }} 
              />
            )}
          </DialogContent>
        </Dialog>

        {historyDriver && (
          <DriverHistoryDialog 
            open={!!historyDriver} 
            onOpenChange={(open) => !open && setHistoryDriver(null)}
            driverId={historyDriver.id}
            driverName={`${historyDriver.first_name} ${historyDriver.last_name}`}
          />
        )}
      </div>
    </>
  );
}
