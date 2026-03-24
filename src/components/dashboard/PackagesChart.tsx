"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface RunData {
  date: Date;
  packages_loaded: number | null;
  packages_advised: number | null;
  stops_failed: number | null;
}

interface PackagesChartProps {
  runs: RunData[];
}

export function PackagesChart({ runs }: PackagesChartProps) {
  const chartData = useMemo(() => {
    const dataByDate: Record<string, { date: string; Chargés: number; Livrés: number; Avisés: number }> = {};

    runs.forEach(run => {
      const dateStr = run.date.toISOString().split('T')[0];
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = { date: dateStr, Chargés: 0, Livrés: 0, Avisés: 0 };
      }
      const loaded = Number(run.packages_loaded || 0);
      const advised = Number(run.packages_advised || 0);
      const failed = Number(run.stops_failed || 0);
      const delivered = Math.max(0, loaded - advised - failed);

      dataByDate[dateStr].Chargés += loaded;
      dataByDate[dateStr].Livrés += delivered;
      dataByDate[dateStr].Avisés += advised;
    });

    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date)).map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    }));
  }, [runs]);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-slate-500 bg-zinc-50 dark:bg-white/50 rounded-lg border border-dashed border-zinc-200 dark:border-slate-200">
        Pas de données de colis.
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
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
          />
          <Tooltip 
            cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="Chargés" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="Livrés" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="Avisés" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
