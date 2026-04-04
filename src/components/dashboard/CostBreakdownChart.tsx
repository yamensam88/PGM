"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface RunData {
  cost_driver: number;
  cost_vehicle: number;
  cost_fuel: number;
}

interface CostBreakdownChartProps {
  runs: RunData[];
  totalMaintenanceCost?: number;
  totalDamageCost?: number;
  totalPenaltyCost?: number;
  totalAbsenceCost?: number;
  totalBonusCost?: number;
  idleVehicleFixedCost?: number;
  idleDriverFixedCost?: number;
  periodAdminFixedCosts?: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f43f5e', '#f97316', '#10b981', '#0ea5e9', '#14b8a6'];

export function CostBreakdownChart({ 
  runs, 
  totalMaintenanceCost, 
  totalDamageCost,
  totalPenaltyCost,
  totalAbsenceCost,
  totalBonusCost,
  idleVehicleFixedCost,
  idleDriverFixedCost,
  periodAdminFixedCosts
}: CostBreakdownChartProps) {
  const chartData = useMemo(() => {
    let driverVariableCost = 0;
    let vehicleVariableCost = 0;
    let fuelCost = 0;

    runs.forEach(run => {
      driverVariableCost += Number(run.cost_driver || 0);
      vehicleVariableCost += Number(run.cost_vehicle || 0);
      fuelCost += Number(run.cost_fuel || 0);
    });

    const driverTotal = driverVariableCost + (idleDriverFixedCost || 0);
    const vehicleTotal = vehicleVariableCost + (idleVehicleFixedCost || 0);

    const total = driverTotal + vehicleTotal + fuelCost + 
                 (totalMaintenanceCost || 0) + (totalDamageCost || 0) + 
                 (totalPenaltyCost || 0) + (totalBonusCost || 0) +
                 (periodAdminFixedCosts || 0);

    if (total === 0) return [];

    const data = [
      { name: 'Carburant', value: Number(fuelCost.toFixed(2)) }
    ];

    if (driverTotal > 0) {
      data.push({ name: 'Chauffeurs (Base+Var)', value: Number(driverTotal.toFixed(2)) });
    }
    if (vehicleTotal > 0) {
      data.push({ name: 'Flotte (Loyers+Usure)', value: Number(vehicleTotal.toFixed(2)) });
    }
    if (periodAdminFixedCosts && periodAdminFixedCosts > 0) {
      data.push({ name: 'Charges Exploit. (Admin, etc.)', value: Number(periodAdminFixedCosts.toFixed(2)) });
    }

    if (totalMaintenanceCost && totalMaintenanceCost > 0) {
      data.push({ name: 'Entretien', value: Number(totalMaintenanceCost.toFixed(2)) });
    }
    if (totalDamageCost && totalDamageCost > 0) {
      data.push({ name: 'Casses / Sinistres', value: Number(totalDamageCost.toFixed(2)) });
    }
    if (totalPenaltyCost && totalPenaltyCost > 0) {
      data.push({ name: 'Pénalités Client', value: Number(totalPenaltyCost.toFixed(2)) });
    }
    if (totalBonusCost && totalBonusCost > 0) {
      data.push({ name: 'Primes Validées', value: Number(totalBonusCost.toFixed(2)) });
    }

    return data;
  }, [runs, totalMaintenanceCost, totalDamageCost, totalPenaltyCost, totalAbsenceCost, totalBonusCost, idleVehicleFixedCost, idleDriverFixedCost, periodAdminFixedCosts]);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        Pas de frais associés.
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    // Only display percentage if the slice is large enough (>2%)
    if (percent < 0.02) return null;
    
    // Position label slightly outside the Donut ring
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        className="text-[12px] font-extrabold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-[250px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={8}
            dataKey="value"
            stroke="none"
            cornerRadius={4}
            label={renderCustomizedLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [`${value} €`, "Montant"]}
            contentStyle={{ 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)'
            }}
            itemStyle={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}
            labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 500, fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 500, paddingTop: '10px' }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
