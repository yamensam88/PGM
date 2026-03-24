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
  Cell
} from "recharts";

interface RunData {
  zone?: { name: string } | null;
  margin_net: number;
}

interface ZoneProfitabilityChartProps {
  runs: RunData[];
}

export function ZoneProfitabilityChart({ runs }: ZoneProfitabilityChartProps) {
  const chartData = useMemo(() => {
    const dataByZone: Record<string, { zone: string; Marge: number }> = {};

    runs.forEach(run => {
      const zoneName = run.zone?.name || "Non Assigné";
      if (!dataByZone[zoneName]) {
        dataByZone[zoneName] = { zone: zoneName, Marge: 0 };
      }
      dataByZone[zoneName].Marge += Number(run.margin_net || 0);
    });

    return Object.values(dataByZone)
      .sort((a, b) => b.Marge - a.Marge) // Sort by most profitable
      .slice(0, 5) // Top 5 zones
      .map(item => ({
        ...item,
        Marge: Number(item.Marge.toFixed(2)) // Clean decimal
      }));
  }, [runs]);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        Pas de données géographiques.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const isPositive = value >= 0;
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-slate-900/5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.zone}</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-orange-500' : 'bg-red-500'}`} />
            <p className={`text-sm font-extrabold ${isPositive ? 'text-slate-800' : 'text-red-500'}`}>
              {value > 0 ? '+' : ''}{value.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[250px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          barSize={18}
        >
          <defs>
            <linearGradient id="colorPosZone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorNegZone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
          <XAxis 
            type="number"
            hide={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
            tickFormatter={(value) => `${value}€`}
          />
          <YAxis 
            dataKey="zone" 
            type="category"
            axisLine={false}
            tickLine={false}
            width={100}
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc', opacity: 0.6 }}
            content={<CustomTooltip />}
          />
          <Bar 
            dataKey="Marge" 
            radius={[6, 6, 6, 6]}
            background={{ fill: '#f1f5f9', radius: 8 }}
          >
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.Marge >= 0 ? 'url(#colorPosZone)' : 'url(#colorNegZone)'} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
