"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface RunData {
  date: Date;
  penalty_risk_score: number;
}

interface IncidentsChartProps {
  runs: RunData[];
}

export function IncidentsChart({ runs }: IncidentsChartProps) {
  const chartData = useMemo(() => {
    const dataByDate: Record<string, { date: string; Risque: number; Count: number }> = {};

    runs.forEach(run => {
      const dateStr = run.date.toISOString().split('T')[0];
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = { date: dateStr, Risque: 0, Count: 0 };
      }
      
      dataByDate[dateStr].Risque += Number(run.penalty_risk_score || 0);
      dataByDate[dateStr].Count += 1;
    });

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date)).map(item => ({
      ...item,
      // on affiche la moyenne du risque quotidien
      RisqueMoyen: Number((item.Risque / (item.Count || 1)).toFixed(1)),
      date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    }));
  }, [runs]);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-slate-500 bg-zinc-50 dark:bg-white/50 rounded-lg border border-dashed border-zinc-200 dark:border-slate-200">
        Pas de données d'incidents.
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRisque" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            domain={[0, 'dataMax + 10']}
          />
          <Tooltip 
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" name="Indice de Risque (Casses/Litiges)" dataKey="RisqueMoyen" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorRisque)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
