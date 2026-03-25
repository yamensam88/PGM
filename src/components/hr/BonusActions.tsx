"use client";

import { useTransition } from "react";
import { toggleMonthlyBonus } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Check, X, Undo2 } from "lucide-react";
import { toast } from "sonner";

export function BonusActions({ driverId, currentMonth, currentYear, amount, currentStatus }: { driverId: string, currentMonth: number, currentYear: number, amount: number, currentStatus: string | null }) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: string) => {
    const formData = new FormData();
    formData.append("driverId", driverId);
    formData.append("action", action);
    formData.append("month", currentMonth.toString());
    formData.append("year", currentYear.toString());
    formData.append("amount", amount.toString());

    startTransition(async () => {
      try {
        const result = await toggleMonthlyBonus(formData);
        if (result.success) {
          toast.success("Statut de la prime mis à jour.");
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour.");
        }
      } catch (err: any) {
         toast.error(err.message || "Erreur inattendue.");
      }
    });
  };

  if (currentStatus === "granted") {
     return (
        <div className="flex items-center gap-2">
           <span className="text-emerald-500 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
              <Check className="w-3 h-3" /> Accordée
           </span>
           <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" title="Annuler la décision" onClick={() => handleAction("revoke")} disabled={isPending}>
              <Undo2 className="h-3 w-3" />
           </Button>
        </div>
     );
  }

  if (currentStatus === "refused") {
     return (
        <div className="flex items-center gap-2">
           <span className="text-red-500 text-[11px] font-bold uppercase tracking-wider bg-red-50 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
              <X className="w-3 h-3" /> Refusée
           </span>
           <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" title="Annuler la décision" onClick={() => handleAction("revoke")} disabled={isPending}>
              <Undo2 className="h-3 w-3" />
           </Button>
        </div>
     );
  }

  // Pending decision (null)
  return (
    <div className="flex items-center gap-2">
      <Button 
         type="button" 
         onClick={() => handleAction("grant")} 
         disabled={isPending}
         className="h-7 text-[11px] px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm transition-colors"
      >
         <Check className="w-3 h-3 mr-1" /> Accorder
      </Button>
      <Button 
         type="button" 
         onClick={() => handleAction("refuse")} 
         disabled={isPending}
         className="h-7 text-[11px] px-2.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"
      >
         <X className="w-3 h-3 mr-1" /> Refuser
      </Button>
    </div>
  );
}
