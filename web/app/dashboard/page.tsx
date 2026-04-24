'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/dashboard/Sidebar';
import ScansTable from '@/components/dashboard/ScansTable';
import LineChart from '@/components/charts/LineChart';
import DonutChart from '@/components/charts/DonutChart';
import BarChart from '@/components/charts/BarChart';
import { getDashboardStats, getRecentScans } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useAppStore } from '@/store';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [activeTab, setActiveTab] = useState('overview');
  const qc = useQueryClient();

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 30_000,
  });

  const { data: scansData, isLoading: scansLoading } = useQuery({
    queryKey: ['recent-scans'],
    queryFn: () => getRecentScans({ limit: 10, offset: 0 }),
    staleTime: 30_000,
  });

  return (
    <div className="dash">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="dash-main">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Dashboard</h2>
          <p style={{ color: 'var(--ink-soft)' }}>Welcome back, {user?.name ?? 'User'}</p>
        </div>

        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-soft)' }}>Loading…</div>
        ) : stats ? (
          <>
            {activeTab === 'overview' && (
              <>
                {/* KPI cards */}
                <div className="dash-kpis">
                  <div className="kpi">
                    <div className="lbl">Total Scans</div>
                    <div className="val">{stats.total_scans}</div>
                    <div className="delta">↑ +12% this week</div>
                  </div>
                  <div className="kpi">
                    <div className="lbl">High Risk</div>
                    <div className="val" style={{ color: 'var(--danger)' }}>{stats.high_risk_count}</div>
                  </div>
                  <div className="kpi">
                    <div className="lbl">Avg Confidence</div>
                    <div className="val">{(stats.average_confidence * 100).toFixed(1)}%</div>
                    <div className="delta">↑ Model accuracy</div>
                  </div>
                  <div className="kpi">
                    <div className="lbl">Reports</div>
                    <div className="val">{stats.total_scans}</div>
                    <div className="delta">↑ +8%</div>
                  </div>
                </div>

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="panel">
                    <h3>Scans Over Time</h3>
                    <LineChart data={stats.scans_by_day} />
                  </div>
                  <div className="panel">
                    <h3>Risk Distribution</h3>
                    <DonutChart stats={stats} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="panel">
                    <h3>By Scan Type</h3>
                    <BarChart stats={stats} type="scan_type" />
                  </div>
                  <div className="panel">
                    <h3>By Language</h3>
                    <BarChart stats={stats} type="language" />
                  </div>
                </div>

                {/* Recent scans */}
                <div className="panel">
                  <h3>Recent Scans</h3>
                  {scansLoading ? (
                    <p style={{ color: 'var(--ink-soft)' }}>Loading scans…</p>
                  ) : (
                    <ScansTable scans={scansData?.scans ?? []} total={scansData?.total ?? 0} page={1}
                      onPageChange={() => {}}
                      onRefresh={() => qc.invalidateQueries({ queryKey: ['recent-scans'] })} />
                  )}
                </div>
              </>
            )}

            {activeTab === 'analytics' && (
              <div className="panel" style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📈</div>
                <h3>Advanced Analytics</h3>
                <p style={{ color: 'var(--ink-soft)' }}>Geographic heatmap and model performance metrics coming soon.</p>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="panel" style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                <h3>Your Reports</h3>
                <p style={{ color: 'var(--ink-soft)' }}>Downloaded reports will appear here.</p>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-soft)' }}>
            Could not load dashboard. Is the backend running?
          </div>
        )}
      </div>
    </div>
  );
}
