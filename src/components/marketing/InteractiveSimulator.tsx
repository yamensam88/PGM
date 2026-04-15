"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Truck } from "lucide-react";

export function InteractiveSimulator() {
  const [fleetSize, setFleetSize] = useState(10);
  
  // Estimation: un camion sans pilotage fin perd environ 6500 à 8500€ par an (usure, carburant non justifié, amendes, mauvaise rentabilité au km)
  const penaltyPerTruckPerYear = 7800;
  const lostMargin = fleetSize * penaltyPerTruckPerYear;

  return (
    <div className="w-full max-w-xl mx-auto bg-[#090b14] border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden mt-12 mb-8 group">
      {/* Decorative Glows */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-orange-500/30 transition-colors" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
      
      <div className="flex items-center justify-between mb-10 relative z-10">
         <Badge variant="outline" className="bg-black/50 border-orange-500/30 text-orange-400 font-mono text-[10px] tracking-widest shadow-none">
           [ ESTIMER MON POTENTIEL ]
         </Badge>
         <div className="flex items-center gap-2 text-zinc-400 font-medium text-xs tracking-wide">
           <Truck className="w-4 h-4" />
           TAILLE DE FLOTTE
         </div>
      </div>
      
      <div className="mb-10 relative z-10">
         <div className="flex gap-4 items-end mb-6">
           <span className="text-5xl font-black text-white leading-none">{fleetSize}</span>
           <span className="text-zinc-500 font-bold uppercase tracking-wider text-sm pb-1">Véhicules</span>
         </div>
         
         <div className="relative pt-2">
            <input 
               type="range" 
               min="3" 
               max="50" 
               step="1" 
               value={fleetSize}
               onChange={(e) => setFleetSize(parseInt(e.target.value))}
               className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
         </div>
         
         <div className="flex justify-between text-[11px] text-zinc-600 font-bold mt-3 px-1">
           <span>3 VL/PL</span>
           <span>50+ VL/PL</span>
         </div>
      </div>

      <div className="bg-[#03050a] rounded-2xl p-6 border border-white/5 text-center relative z-10 ring-1 ring-inset ring-white/5">
         <div className="text-[11px] text-red-500/70 font-bold tracking-widest uppercase mb-3 flex items-center justify-center gap-2">
           <TrendingDown className="w-3.5 h-3.5" />
           Manque à Gagner Annuel
         </div>
         <div className="text-4xl md:text-5xl font-black text-red-500 tracking-tight">
            - {new Intl.NumberFormat('fr-FR').format(lostMargin)} € 
         </div>
         <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent my-4"></div>
         <p className="text-zinc-500 text-xs leading-relaxed max-w-[280px] mx-auto">
           Extrapolé sur vos tendances. Carburant non optimisé, litiges ignorés et temps de travail non géré. Ne soyez plus une statistique.
         </p>
      </div>
    </div>
  );
}
