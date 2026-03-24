"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function DriverCostsChart({ data }: { data: { name: string, totalDamage: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Aucun coût de sinistre enregistré sur cette période.
      </div>
    );
  }

  return (
    <div className="h-64 mt-4 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" tickFormatter={(value) => `${value} €`} className="text-xs text-slate-500" />
          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip 
            formatter={(value: any) => [`${Number(value).toFixed(2)} €`, "Coût Sinistres"]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="totalDamage" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#ef4444" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
