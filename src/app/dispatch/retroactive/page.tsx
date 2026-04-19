import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RetroactiveSimulationForm } from "@/components/finances/RetroactiveSimulationForm";

export default async function RetroactivePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user as any).role === "driver") {
    redirect("/driver");
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-24 h-screen">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 relative">
        <div className="flex justify-between items-end mb-8 relative">
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              Moteur de Reprise d'Historique
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
              Simulez et appliquez rétroactivement de nouvelles conditions financières à vos tournées finalisées.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="col-span-1 border border-indigo-100 bg-indigo-50/50 p-6 rounded-2xl">
              <h2 className="text-sm font-bold text-indigo-800 mb-2 uppercase tracking-widest">Comment ça marche ?</h2>
              <p className="text-sm text-indigo-700 leading-relaxed">
                  Cet outil récupère vos tarifs <strong>actuels</strong> (le loyer mensuel d'un véhicule aujourd'hui, le salaire de base d'un chauffeur tel qu'il est configuré actuellement, etc.) et les force sur les tournées clôturées durant la période sélectionnée. 
                  <br/><br/>
                  Utilisez d'abord la <strong className="font-semibold">Simulation</strong> pour vérifier l'impact que cela aura avant de cliquer sur le bouton d'application définitive.
              </p>
          </div>
          <RetroactiveSimulationForm />
        </div>
      </div>
    </div>
  );
}
