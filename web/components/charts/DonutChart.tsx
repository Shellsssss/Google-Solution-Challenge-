'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardStats } from '@/types';

interface DonutChartProps {
  stats: DashboardStats;
}

export default function DonutChart({ stats }: DonutChartProps) {
  const total = stats.total_scans || 1;

  const data = [
    { name: 'Low Risk', value: stats.low_risk_count, color: '#10B981' },
    { name: 'High Risk', value: stats.high_risk_count, color: '#EF4444' },
    { name: 'Invalid', value: stats.invalid_count, color: '#F59E0B' },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A2234',
            border: '1px solid #1F2937',
            borderRadius: '12px',
            color: '#fff',
          }}
          formatter={(value: number) => [
            `${value} (${((value / total) * 100).toFixed(1)}%)`,
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          formatter={(value) => <span style={{ color: '#9CA3AF' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
