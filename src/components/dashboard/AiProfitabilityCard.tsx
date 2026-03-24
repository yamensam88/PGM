"use client";

import { useState, useTransition } from "react";
import { generateAiProfitabilityReport } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

export function AiProfitabilityCard({ runId, initialReport }: { runId: string, initialReport?: any }) {
  const [isPending, startTransition] = useTransition();
  const [report, setReport] = useState<any>(initialReport);

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateAiProfitabilityReport(runId);
        if (result.success) {
          setReport({
            profitability_score: result.score,
            summary: result.summary
          });
        }
      } catch (err) {
        console.error("Erreur AI:", err);
      }
    });
  };

  if (!report) {
    return (
      <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center space-y-4 h-full">
         <Sparkles className="w-8 h-8 text-blue-400" />
         <p className="text-center text-slate-600 text-sm">Générez une analyse de rentabilité pilotée par l'IA pour cette tournée.</p>
         <Button onClick={handleGenerate} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
             {isPending ? "Analyse en cours..." : "Analyser la rentabilité"}
         </Button>
      </div>
    );
  }

  const isGood = report.profitability_score >= 65;

  return (
    <div className={`p-6 rounded-2xl shadow-sm border ${isGood ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-orange-950/30 border-orange-900/50'} h-full flex flex-col`}>
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Analyse IA
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                Score: {report.profitability_score}/100
            </div>
        </div>
        
        <p className="text-sm text-slate-600 flex-1">
            {report.summary}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-300/50 flex justify-end">
             <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isPending} className="text-xs text-slate-500 hover:text-slate-900">
                 {isPending ? "Actualisation..." : "Actualiser l'analyse"}
             </Button>
        </div>
    </div>
  );
}
