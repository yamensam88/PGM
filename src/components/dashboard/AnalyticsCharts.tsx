"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyData {
  date: string;
  revenue: number;
  margin: number;
  costs: number;
}

interface AnalyticsChartsProps {
  financialData: DailyData[];
}

export function AnalyticsCharts({ financialData }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Graphique de Marge Nette */}
      <div className="bg-white dark:bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200">
        <h3 className="text-lg font-semibold mb-6">Évolution de la Marge Nette</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={financialData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}€`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="margin" 
                name="Marge Nette (€)" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphique Revenus vs Coûts */}
      <div className="bg-white dark:bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-slate-200">
        <h3 className="text-lg font-semibold mb-6">Revenus globaux vs Coûts</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `${value}€`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="revenue" name="Revenus (€)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" name="Coûts Flotte & Chauffeurs (€)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
