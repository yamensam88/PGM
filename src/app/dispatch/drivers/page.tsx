import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreateDriverForm } from "@/components/forms/CreateDriverForm";
import { MoreHorizontal, Edit, UserX, Activity } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DispatchDriversPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const drivers = await prisma.driver.findMany({
    where: { 
      organization_id: session.user.organization_id,
      status: 'active' 
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-50">
        <header className="flex justify-between items-end border-b border-zinc-200 dark:border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Flotte: Chauffeurs</h1>
            <p className="text-slate-500 mt-1">Gérez votre personnel roulant et leurs coûts</p>
          </div>
          
          <Dialog>
            <DialogTrigger className="bg-blue-600 text-slate-900 hover:bg-blue-700 font-medium shadow-sm transition-colors inline-flex h-10 items-center justify-center rounded-md px-4 py-2">
                + Nouveau Chauffeur
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter un chauffeur</DialogTitle>
                <DialogDescription>
                  Créez un profil pour un nouveau chauffeur. Un accès utilisateur sera automatiquement généré.
                </DialogDescription>
              </DialogHeader>
              <CreateDriverForm />
            </DialogContent>
          </Dialog>
        </header>

        <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-zinc-200 dark:border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-slate-50">
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Coût / Jour (€)</TableHead>
                  <TableHead className="text-right">Score Productivité</TableHead>
                  <TableHead className="text-right">Score Qualité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id} className="hover:bg-zinc-50 dark:hover:bg-white/30 transition-colors">
                    <TableCell className="font-medium">
                      {driver.first_name} {driver.last_name}
                      <div className="text-xs font-normal text-slate-500 mt-0.5">{driver.email || driver.phone || "Sans contact"}</div>
                    </TableCell>
                    <TableCell>
                      {driver.status === 'active' ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">Actif</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-white dark:text-slate-600">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(driver.daily_base_cost).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(driver.performance_score).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(driver.quality_rating) < 50 ? (
                        <span className="text-orange-500 font-bold">{Number(driver.quality_rating).toFixed(2)}</span>
                      ) : (
                         <span className="text-emerald-500">{Number(driver.quality_rating).toFixed(2)}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {drivers.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Aucun chauffeur enregistré pour cette organisation.
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
