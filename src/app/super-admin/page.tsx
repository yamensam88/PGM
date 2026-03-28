import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, Activity, Settings2, ArrowUpRight, CheckCircle2, ArrowLeft, Power, PowerOff } from "lucide-react";
import { toggleSaaSClientStatus } from "@/lib/actions";

export const dynamic = 'force-dynamic';

function calculateBilling(activeDrivers: number) {
  if (activeDrivers === 0) return 200; // Base de frais de maintien
  if (activeDrivers <= 5) return 200;
  const extraDrivers = activeDrivers - 5;
  const extraTiers = Math.ceil(extraDrivers / 3);
  return 200 + (extraTiers * 100);
}

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // NOTE: Sécurité Super-Admin stricte ! Seule l'organisation créatrice du système a accès.
  const masterOrg = await prisma.organization.findFirst({ orderBy: { created_at: 'asc' }, select: { id: true } });
  
  if (session.user.organization_id !== masterOrg?.id) {
    redirect("/dispatch/dashboard");
  }

  if (session.user.role !== 'owner' && session.user.role !== 'super_admin') {
    redirect("/dispatch/dashboard");
  }

  const organizations = await prisma.organization.findMany({
    include: {
      drivers: { where: { status: 'active' }, select: { id: true } },
      users: { select: { id: true } },
      vehicles: { where: { status: 'active' }, select: { id: true } }
    },
    orderBy: { created_at: 'desc' }
  });

  const mrrTotal = organizations.reduce((sum, org) => {
    return org.subscription_status === 'active' ? sum + calculateBilling(org.drivers.length) : sum;
  }, 0);

  const totalDriversSaaS = organizations.reduce((sum, org) => sum + org.drivers.length, 0);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/dispatch/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 text-sm font-medium transition-colors">
               <ArrowLeft className="w-4 h-4" />
               Retour au Dashboard Exploitation
            </Link>
            <div className="block">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-none mb-3">
                HQ PLATFORM CONTROL
              </Badge>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
              SaaS Central Admin
            </h1>
            <p className="text-zinc-400 mt-2 text-[15px] max-w-xl leading-relaxed">
              Supervisez toutes les entreprises clientes, leur utilisation de l'algorithme, et analysez le MRR (Monthly Recurring Revenue) généré par la plateforme.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-white text-zinc-950 hover:bg-zinc-200">
              <Building2 className="w-4 h-4 mr-2" />
              Nouvelle Instance Client
            </Button>
          </div>
        </header>

        {/* Global SaaS KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="w-24 h-24 text-emerald-500" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">MRR Total Estimé</h3>
                 <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                 </div>
              </div>
              <div className="text-4xl font-black text-emerald-400 tracking-tight">{mrrTotal.toLocaleString('fr-FR')} €</div>
              <p className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Basé sur le barème Tiers (+100€/3ch)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Clients Actifs</h3>
                 <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                 </div>
              </div>
              <div className="text-4xl font-black text-white tracking-tight">{organizations.filter(o => o.subscription_status === 'active').length}</div>
              <p className="text-xs text-zinc-500 mt-2 font-medium">Entreprises abonnées</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Chauffeurs Globaux</h3>
                 <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                 </div>
              </div>
              <div className="text-4xl font-black text-white tracking-tight">{totalDriversSaaS}</div>
              <p className="text-xs text-zinc-500 mt-2 font-medium">Sur toute la plateforme</p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800 shadow-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">État Plateforme</h3>
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                 </div>
              </div>
              <div className="text-4xl font-black text-white tracking-tight text-xl flex items-center gap-2 mt-2">
                 <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                 Opérationnelle
              </div>
              <p className="text-xs text-zinc-500 mt-3 font-medium">Bases de données étanches</p>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-zinc-200">Portefeuille Clients</h2>
          <Card className="bg-zinc-900 border-zinc-800 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-zinc-500 uppercase tracking-wider bg-zinc-950/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Entreprise</th>
                    <th className="px-6 py-4 font-semibold text-center">Effectif (Chauffeurs)</th>
                    <th className="px-6 py-4 font-semibold text-center">Véhicules</th>
                    <th className="px-6 py-4 font-semibold text-center">Utilisateurs</th>
                    <th className="px-6 py-4 font-semibold text-right">Abonnement Mensuel</th>
                    <th className="px-6 py-4 font-semibold text-center">Statut</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {organizations.map(org => {
                    const activeDriversCount = org.drivers.length;
                    const monthlyBill = calculateBilling(activeDriversCount);

                    return (
                      <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-100">{org.name}</p>
                          <p className="text-zinc-500 text-[11px] mt-0.5 font-mono">{org.id.split('-')[0]}...</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-zinc-800 rounded-lg font-bold text-zinc-300">
                             {activeDriversCount}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center text-zinc-500 font-medium">
                           {org.vehicles.length}
                        </td>
                        <td className="px-6 py-4 text-center text-zinc-500 font-medium">
                           {org.users.length}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="font-bold text-emerald-400">{monthlyBill} €</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {org.subscription_status === 'active' ? (
                             <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-none">Actif</Badge>
                          ) : org.subscription_status === 'trialing' ? (
                             <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-none">En Essai</Badge>
                          ) : org.subscription_status === 'suspended' ? (
                             <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 shadow-none">Désactivé</Badge>
                          ) : (
                             <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 shadow-none">{org.subscription_status}</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={toggleSaaSClientStatus as any} className="inline-block">
                             <input type="hidden" name="orgId" value={org.id} />
                             {org.subscription_status === 'suspended' ? (
                                <input type="hidden" name="action" value="activate" />
                             ) : (
                                <input type="hidden" name="action" value="suspend" />
                             )}
                             <Button 
                                type="submit" 
                                variant="ghost" 
                                size="sm" 
                                className={org.subscription_status === 'suspended' ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" : "text-red-500 hover:text-red-400 hover:bg-red-500/10"}
                                disabled={org.id === masterOrg?.id} // Ne pas s'auto-suspendre
                             >
                                {org.subscription_status === 'suspended' ? (
                                  <><Power className="w-4 h-4 mr-2" /> Réactiver</>
                                ) : (
                                  <><PowerOff className="w-4 h-4 mr-2" /> Suspendre</>
                                )}
                             </Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                  {organizations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 bg-zinc-950/20">Aucune entreprise cliente enregistrée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
