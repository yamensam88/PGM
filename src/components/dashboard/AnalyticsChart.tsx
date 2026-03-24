"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface RunData {
  date: Date;
  revenue: number;
  cost: number;
}

interface AnalyticsChartProps {
  runs: RunData[];
  filter: string;
}

export function AnalyticsChart({ runs, filter }: AnalyticsChartProps) {
  const chartData = useMemo(() => {
    const dataByDate: Record<string, { date: string; Revenu: number; Coût: number; Marge: number }> = {};

    runs.forEach(run => {
      // Group by day for daily/weekly, or maybe by week for monthly, but grouping by day is easier for now.
      const dateStr = run.date.toISOString().split('T')[0];
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = { date: dateStr, Revenu: 0, Coût: 0, Marge: 0 };
      }
      dataByDate[dateStr].Revenu += run.revenue;
      dataByDate[dateStr].Coût += run.cost;
      dataByDate[dateStr].Marge += (run.revenue - run.cost);
    });

    // Convert to array and sort by date
    return Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date)).map(item => ({
      ...item,
      // Format date for display
      date: new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
    }));
  }, [runs]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-slate-500 bg-zinc-50 dark:bg-white/50 rounded-lg border border-dashed border-zinc-200 dark:border-slate-200">
        Pas de données pour cette période.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCout" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip 
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)'
            }}
            itemStyle={{ fontWeight: 600, fontSize: '13px' }}
            labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }} iconType="circle" />
          <Area 
            type="monotone" 
            dataKey="Revenu" 
            stroke="#2563eb" 
            strokeWidth={3}
            fill="url(#colorRevenu)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
          />
          <Area 
            type="monotone" 
            dataKey="Coût" 
            stroke="#94a3b8" 
            strokeWidth={3}
            fill="url(#colorCout)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#64748b' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
