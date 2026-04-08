'use client';

import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardStats } from '@/types';

interface BarChartProps {
  stats: DashboardStats;
  type: 'scan_type' | 'language';
}

export default function BarChart({ stats, type }: BarChartProps) {
  const data =
    type === 'scan_type'
      ? [
          { name: 'Oral', value: stats.scans_by_type?.oral ?? 0, fill: '#3B82F6' },
          { name: 'Skin', value: stats.scans_by_type?.skin ?? 0, fill: '#8B5CF6' },
          { name: 'Other', value: stats.scans_by_type?.other ?? 0, fill: '#6B7280' },
        ]
      : [
          { name: 'English', value: stats.scans_by_language?.en ?? 0, fill: '#3B82F6' },
          { name: 'Hindi', value: stats.scans_by_language?.hi ?? 0, fill: '#F59E0B' },
          { name: 'Tamil', value: stats.scans_by_language?.ta ?? 0, fill: '#10B981' },
          { name: 'Telugu', value: stats.scans_by_language?.te ?? 0, fill: '#EF4444' },
        ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBar data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1A2234',
            border: '1px solid #1F2937',
            borderRadius: '12px',
            color: '#fff',
          }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <rect key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </RechartsBar>
    </ResponsiveContainer>
  );
}
