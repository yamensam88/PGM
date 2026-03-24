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
  driver_id?: string | null;
  driver?: { first_name: string; last_name: string } | null;
  margin_net: number;
}

interface ExtraCost {
  driver_id: string | null;
  driver?: { first_name: string; last_name: string } | null;
  amount: number | any; // Decimal maps to roughly number/string
}

interface DriverProfitabilityChartProps {
  runs: RunData[];
  extraCosts?: ExtraCost[];
}

export function DriverProfitabilityChart({ runs, extraCosts = [] }: DriverProfitabilityChartProps) {
  const chartData = useMemo(() => {
    const dataByDriver: Record<string, { driver: string; Marge: number; id: string }> = {};

    // 1. Sum up operational margins from completed runs
    runs.forEach(run => {
      const driverId = run.driver_id || 'unassigned';
      const driverName = run.driver ? `${run.driver.first_name} ${run.driver.last_name}` : "Non Assigné";
      
      if (!dataByDriver[driverId]) {
        dataByDriver[driverId] = { id: driverId, driver: driverName, Marge: 0 };
      }
      dataByDriver[driverId].Marge += Number(run.margin_net || 0);
    });

    // 2. Subtract driver-specific damages and penalties
    extraCosts.forEach(cost => {
      const driverId = cost.driver_id;
      if (driverId && cost.driver) {
        if (!dataByDriver[driverId]) {
           dataByDriver[driverId] = { id: driverId, driver: `${cost.driver.first_name} ${cost.driver.last_name}`, Marge: 0 };
        }
        dataByDriver[driverId].Marge -= Number(cost.amount || 0);
      }
    });

    return Object.values(dataByDriver)
      .sort((a, b) => b.Marge - a.Marge) // Sort by most profitable
      .slice(0, 5) // Top 5 drivers
      .map(item => ({
        ...item,
        Marge: Number(item.Marge.toFixed(2)) // Clean decimal
      }));
  }, [runs, extraCosts]);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        Pas de données de chauffeurs.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const isPositive = value >= 0;
      return (
        <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-slate-900/5 z-50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.driver}</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />
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
            <linearGradient id="colorPosDriver" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="colorNegDriver" x1="0" y1="0" x2="1" y2="0">
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
            dataKey="driver" 
            type="category"
            axisLine={false}
            tickLine={false}
            width={120}
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
                <Cell key={`cell-${index}`} fill={entry.Marge >= 0 ? 'url(#colorPosDriver)' : 'url(#colorNegDriver)'} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
