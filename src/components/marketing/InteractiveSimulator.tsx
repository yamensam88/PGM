"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InteractiveSimulator() {
  const [fleetSize, setFleetSize] = useState(10);
  
  const penaltyPerTruckPerYear = 7800;
  const targetMargin = fleetSize * penaltyPerTruckPerYear;
  const [displayMargin, setDisplayMargin] = useState(targetMargin);

  useEffect(() => {
    let frameId: number;
    let current = displayMargin;
    const target = targetMargin;
    
    if (current === target) return;

    const animate = () => {
      current += (target - current) * 0.15;
      if (Math.abs(target - current) < 10) {
        setDisplayMargin(target);
      } else {
        setDisplayMargin(current);
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [targetMargin, displayMargin]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-xl mx-auto bg-[#05060A] border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-2xl relative mt-12 mb-8 group"
    >
      {/* Decorative Glows */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-orange-600/20 transition-all duration-700" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-red-600/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-red-600/20 transition-all duration-700" />
      <div className="absolute inset-0 ring-1 ring-white/5 rounded-[2rem] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-10 relative z-10">
         <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-400 font-mono text-[10px] tracking-widest shadow-none px-3 py-1">
           [ ESTIMER MON POTENTIEL ]
         </Badge>
         <div className="flex items-center gap-2 text-zinc-400 font-medium text-xs tracking-wide">
           <Truck className="w-4 h-4 text-orange-500/70" />
           TAILLE DE FLOTTE
         </div>
      </div>
      
      <div className="mb-10 relative z-10">
         <div className="flex gap-4 items-end mb-6">
           <motion.span 
              key={fleetSize}
              initial={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-5xl font-black text-white leading-none"
           >
             {fleetSize}
           </motion.span>
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
               className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/80 transition-all hover:bg-zinc-700 relative z-20"
            />
            {/* Glowing thumb trail simulation (Optional effect area) */}
            <motion.div 
               className="absolute top-2 left-0 h-2 bg-gradient-to-r from-orange-600 to-orange-400 rounded-l-lg pointer-events-none"
               style={{ width: `${((fleetSize - 3) / 47) * 100}%` }}
               layout
            />
         </div>
         
         <div className="flex justify-between text-[11px] text-zinc-600 font-bold mt-4 px-1">
           <span>3 VL/PL</span>
           <span>50+ VL/PL</span>
         </div>
      </div>

      <div className="bg-[#020305] rounded-2xl p-8 border border-white/5 text-center relative z-10 shadow-inner overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50" />
         <div className="text-[11px] text-red-500/80 font-bold tracking-widest uppercase mb-4 flex items-center justify-center gap-2">
           <TrendingDown className="w-4 h-4 animate-pulse" />
           Manque à Gagner Annuel
         </div>
         <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600 tracking-tighter drop-shadow-sm mb-1">
            - {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(displayMargin))} € 
         </div>
         <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/10 to-transparent my-6"></div>
         <p className="text-zinc-500 text-xs leading-relaxed max-w-[280px] mx-auto font-medium">
           Extrapolé sur vos tendances. Entretien non optimisé, litiges ignorés et temps non facturé. Ne soyez plus une statistique.
         </p>
      </div>
    </motion.div>
  );
}
