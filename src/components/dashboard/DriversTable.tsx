"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function DriversTable({ drivers }: { drivers: any[] }) {

  if(!drivers || drivers.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        Aucun chauffeur enregistré pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader className="bg-zinc-50 dark:bg-slate-50">
             <TableRow>
            <TableHead className="font-semibold text-zinc-600">Nom & Prénom</TableHead>
            <TableHead className="font-semibold text-zinc-600">Email / Identifiant</TableHead>
            <TableHead className="font-semibold text-zinc-600">Téléphone</TableHead>
            <TableHead className="font-semibold text-zinc-600">Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => {
            return (
              <TableRow key={driver.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/30 transition-colors">
                <TableCell className="font-medium">
                  {driver.first_name} {driver.last_name}
                </TableCell>
                <TableCell className="text-zinc-600">
                  {driver.email || '-'}
                </TableCell>
                <TableCell className="text-zinc-600">
                  {driver.phone || '-'}
                </TableCell>
                <TableCell>
                  {driver.status === 'active' ? (
                     <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Actif</Badge>
                  ) : (
                     <Badge variant="outline">{driver.status}</Badge>
                  )}
                </TableCell>
             </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
