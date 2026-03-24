"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function VehicleHistory({ vehicle }: { vehicle: any }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Chargement de l'historique...</div>;
  }

  const maintenances = vehicle.maintenance_logs || [];
  const incidents = vehicle.incidents || [];
  const financials = vehicle.financial_entries || [];

  // Combine into a single timeline feed
  const timeline: any[] = [];
  
  maintenances.forEach((m: any) => {
    timeline.push({
      id: m.id,
      date: new Date(m.service_date),
      type: "Entretien",
      title: m.maintenance_type,
      desc: m.description || m.vendor_name || "",
      cost: m.cost,
      status: new Date(m.service_date) > new Date() ? "RDV à venir" : "Réalisé"
    });
  });

  incidents.forEach((i: any) => {
    timeline.push({
      id: i.id,
      date: new Date(i.created_at),
      type: "Sinistre",
      title: "Casse matérielle",
      desc: `${i.description || 'Dommage'} (Resp: ${i.driver?.first_name || 'Inconnu'} ${i.driver?.last_name || ''})`,
      cost: financials.find((f: any) => f.entry_type === "cost" && f.category === "damage_cost" && new Date(f.entry_date).getTime() === new Date(i.created_at).getTime())?.amount || 0,
      status: "Enregistré"
    });
  });

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalMaintenance = financials.filter((f: any) => f.category === 'maintenance_cost').reduce((sum: number, f: any) => sum + Number(f.amount), 0);
  const totalDamage = financials.filter((f: any) => f.category === 'damage_cost').reduce((sum: number, f: any) => sum + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg dark:bg-white dark:border-slate-200">
          <p className="text-xs text-slate-500 uppercase font-semibold">Total Entretiens</p>
          <p className="text-2xl font-bold text-zinc-700 dark:text-slate-700">{totalMaintenance.toFixed(2)} €</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/20 dark:border-red-800/50">
          <p className="text-xs text-red-600 uppercase font-semibold">Total Casses / Sinistres</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{totalDamage.toFixed(2)} €</p>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-lg overflow-hidden dark:border-slate-200">
        <Table>
          <TableHeader className="bg-zinc-100 dark:bg-slate-50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeline.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-6">Aucun historique d'entretien ou de sinistre.</TableCell>
              </TableRow>
            )}
            {timeline.map((item) => (
              <TableRow key={item.id} className="dark:border-slate-200">
                <TableCell className="font-medium">{item.date.toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>
                  {item.type === 'Entretien' ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">Entretien</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300">Sinistre</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {Number(item.cost) > 0 ? `${Number(item.cost).toFixed(2)} €` : '-'}
                </TableCell>
                <TableCell className="text-right text-slate-500 text-xs">
                  {item.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
