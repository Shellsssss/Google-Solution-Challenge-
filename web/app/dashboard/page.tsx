'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/dashboard/Sidebar';
import KPICard from '@/components/dashboard/KPICard';
import ScansTable from '@/components/dashboard/ScansTable';
import LineChart from '@/components/charts/LineChart';
import DonutChart from '@/components/charts/DonutChart';
import BarChart from '@/components/charts/BarChart';
import { Spinner } from '@/components/ui/Spinner';
import { getDashboardStats, getRecentScans } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useAppStore } from '@/store';
import { TrendingUp, AlertTriangle, BarChart2, FileText } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports'>('overview');

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
    <div className="flex h-screen bg-background-primary overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-muted mt-0.5">Welcome back, {user?.name ?? 'User'}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-background-card rounded-xl p-1 border border-border mb-6 w-fit">
            {(['overview', 'analytics', 'reports'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>

          {statsLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : stats ? (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard title="Total Scans" value={stats.total_scans} icon={TrendingUp} trend="+12%" trendUp />
                    <KPICard title="High Risk" value={stats.high_risk_count} icon={AlertTriangle} accent="danger" />
                    <KPICard title="Avg Confidence" value={`${(stats.average_confidence * 100).toFixed(1)}%`} icon={BarChart2} accent="success" />
                    <KPICard title="Reports" value={stats.total_scans} icon={FileText} trend="+8%" trendUp />
                  </div>

                  {/* Charts row 1 */}
                  <div className="grid lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3 bg-background-card rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">Scans Over Time</h3>
                      <LineChart data={stats.scans_by_day} />
                    </div>
                    <div className="lg:col-span-2 bg-background-card rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">Risk Distribution</h3>
                      <DonutChart stats={stats} />
                    </div>
                  </div>

                  {/* Charts row 2 */}
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="bg-background-card rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">By Scan Type</h3>
                      <BarChart data={[
                        { name: 'Oral', value: stats.scans_by_type.oral },
                        { name: 'Skin', value: stats.scans_by_type.skin },
                        { name: 'Other', value: stats.scans_by_type.other },
                      ]} color="#3B82F6" />
                    </div>
                    <div className="bg-background-card rounded-2xl border border-border p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">By Language</h3>
                      <BarChart data={[
                        { name: 'English', value: stats.scans_by_language.en },
                        { name: 'Hindi', value: stats.scans_by_language.hi },
                        { name: 'Tamil', value: stats.scans_by_language.ta },
                        { name: 'Telugu', value: stats.scans_by_language.te },
                      ]} color="#10B981" />
                    </div>
                  </div>

                  {/* Recent scans table */}
                  <div className="bg-background-card rounded-2xl border border-border p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Recent Scans</h3>
                    {scansLoading ? <Spinner /> : <ScansTable scans={scansData?.items ?? []} />}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="bg-background-card rounded-2xl border border-border p-8 text-center">
                  <BarChart2 className="h-12 w-12 text-muted mx-auto mb-3" />
                  <p className="text-white font-medium">Advanced Analytics</p>
                  <p className="text-muted text-sm mt-1">Geographic heatmap and model performance metrics</p>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="bg-background-card rounded-2xl border border-border p-8 text-center">
                  <FileText className="h-12 w-12 text-muted mx-auto mb-3" />
                  <p className="text-white font-medium">Your Reports</p>
                  <p className="text-muted text-sm mt-1">Downloaded reports will appear here</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted">Could not load dashboard data. Is the backend running?</div>
          )}
        </div>
      </main>
    </div>
  );
}
