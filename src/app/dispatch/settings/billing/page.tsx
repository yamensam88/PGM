import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, CreditCard, Receipt, Zap } from "lucide-react";

export const dynamic = 'force-dynamic';

function calculateBilling(activeDrivers: number) {
  if (activeDrivers === 0) return 200;
  if (activeDrivers <= 5) return 200;
  const extraDrivers = activeDrivers - 5;
  const extraTiers = Math.ceil(extraDrivers / 3);
  return 200 + (extraTiers * 100);
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.organization_id) {
    redirect("/login");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.user.organization_id },
    include: {
      drivers: { where: { status: 'active' }, select: { id: true } }
    }
  });

  if (!organization) redirect("/login");

  const activeDriversCount = organization.drivers.length;
  const currentMonthlyBill = calculateBilling(activeDriversCount);
  
  // Calculate next tier logic
  let driversToNextTier = 0;
  let nextTierBill = 0;
  let currentTierBase = 0;
  let currentTierMax = 0;

  if (activeDriversCount <= 5) {
     currentTierBase = 0;
     currentTierMax = 5;
     driversToNextTier = 5 - activeDriversCount;
     nextTierBill = 300;
  } else {
     const extraDrivers = activeDriversCount - 5;
     const currentTierIndex = Math.ceil(extraDrivers / 3);
     currentTierMax = 5 + (currentTierIndex * 3);
     currentTierBase = currentTierMax - 2;
     driversToNextTier = currentTierMax - activeDriversCount;
     nextTierBill = 200 + ((currentTierIndex + 1) * 100);
  }

  // Progress bar percentage (e.g. if we are at 7 drivers in the 6-8 tier)
  const tierWidth = currentTierMax - currentTierBase + 1; 
  const currentPositionInTier = activeDriversCount - currentTierBase + 1;
  const progressPercentage = (currentPositionInTier / tierWidth) * 100;

  return (
    <div className="space-y-8 max-w-5xl">
       <header className="border-b border-zinc-200 dark:border-slate-800 pb-5">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
             <CreditCard className="w-8 h-8 text-blue-500" />
             Abonnement & Facturation
          </h1>
          <p className="text-slate-500 mt-2">
             Gérez votre abonnement SaaS et analysez vos limites de palier opérationnel.
          </p>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-slate-200 shadow-sm overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Zap className="w-48 h-48" />
             </div>
             
             <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
               <div className="flex justify-between items-center">
                 <div>
                   <CardTitle className="text-xl text-slate-800">Votre Forfait</CardTitle>
                   <CardDescription>Facturation dynamique basée sur le nombre de chauffeurs actifs.</CardDescription>
                 </div>
                 <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-3 py-1">
                   <CheckCircle2 className="w-4 h-4 mr-1.5" /> Forfait Pro
                 </Badge>
               </div>
             </CardHeader>
             
             <CardContent className="p-8 pt-6 relative z-10">
               <div className="mb-6">
                 <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mb-1">Montant Mensuel Actuel</p>
                 <div className="flex items-baseline gap-2">
                   <span className="text-6xl font-black text-slate-900 tracking-tight">{currentMonthlyBill}</span>
                   <span className="text-2xl font-bold text-slate-400">€ / mois</span>
                 </div>
               </div>

               <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm mt-8">
                  <div className="flex justify-between items-end mb-3">
                     <div>
                       <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          Utilisation du Palier
                       </h4>
                       <p className="text-[13px] text-slate-500 mt-0.5">Vous exploitez actuellement {activeDriversCount} chauffeurs (Tiers: {currentTierBase === 0 ? '1' : currentTierBase} à {currentTierMax} chauffeurs).</p>
                     </div>
                     <span className="text-2xl font-bold text-blue-600">{activeDriversCount} / {currentTierMax}</span>
                  </div>
                  
                  <Progress value={progressPercentage} className="h-3 bg-slate-100 rounded-full *:bg-blue-600" />
                  
                  <div className="mt-4 flex items-start gap-2 text-[13px] text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                     <Zap className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                     <p>
                        Il vous reste <strong>{driversToNextTier} place(s)</strong> dans votre abonnement actuel à {currentMonthlyBill}€. 
                        Le passage à {currentTierMax + 1} chauffeurs activera le palier supérieur à <strong>{nextTierBill}€/mois</strong>.
                     </p>
                  </div>
               </div>
             </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm h-fit">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-[15px] flex items-center gap-2">
                 <Receipt className="w-4 h-4 text-slate-500" /> Mode de Résolution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-5 space-y-4">
               <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Méthode de Paiement</h4>
                  <div className="flex items-center gap-3 border border-slate-200 p-3 rounded-lg">
                     <div className="w-10 h-7 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-700">Prélèvement SEPA</p>
                        <p className="text-[11px] text-slate-500">Activé (En attente Stripe)</p>
                     </div>
                  </div>
               </div>
               
               <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 mt-2">Détails d'Entreprise</h4>
                  <div className="space-y-1 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <p><span className="text-slate-500">Raison Sociale:</span> <span className="font-semibold text-slate-800">{organization.name}</span></p>
                     <p><span className="text-slate-500">ID Fisc.:</span> <span className="font-semibold text-slate-800">{organization.tax_id || '-'}</span></p>
                     <p><span className="text-slate-500">Pays:</span> <span className="font-semibold text-slate-800">{organization.country || 'FR'}</span></p>
                  </div>
               </div>
            </CardContent>
          </Card>
       </div>
    </div>
  );
}
