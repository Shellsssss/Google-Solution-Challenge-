'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/dashboard/Sidebar';
import { getAdminUsers, getSystemHealth, getAllCentres } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

function UptimeDisplay({ seconds }: { seconds: number }) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return <span style={{ fontFamily: 'monospace', color: 'var(--success)', fontWeight: 700 }}>{d}d {h}h {m}m</span>;
}

const ROLE_COLOR: Record<string, string> = {
  admin: 'var(--danger)', doctor: 'var(--brand)', patient: 'var(--ink-soft)',
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'health' | 'users' | 'centres'>('health');

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  const { data: health, isLoading: hl } = useQuery({ queryKey: ['system-health'], queryFn: getSystemHealth, refetchInterval: 30_000 });
  const { data: users, isLoading: ul } = useQuery({ queryKey: ['admin-users'], queryFn: getAdminUsers });
  const { data: centres, isLoading: cl } = useQuery({ queryKey: ['centres-all'], queryFn: getAllCentres });

  return (
    <div className="dash">
      <Sidebar activeTab="" onTabChange={() => {}} />

      <div className="dash-main">
        <h2 style={{ marginBottom: '4px' }}>Admin Panel</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: '24px' }}>System management and oversight</p>

        {/* Tabs */}
        <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--surface)', padding: '4px', borderRadius: '14px', border: '1px solid var(--line)', marginBottom: '24px' }}>
          {(['health', 'users', 'centres'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: tab === t ? 'var(--brand)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--ink-soft)',
                textTransform: 'capitalize',
              }}>
              {t === 'health' ? '🟢 System Health' : t === 'users' ? '👥 Users' : '🏥 Centres'}
            </button>
          ))}
        </div>

        {tab === 'health' && (
          hl ? <p style={{ color: 'var(--ink-soft)' }}>Loading…</p> :
          health ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'API Status', ok: health.api_status === 'ok' },
                  { label: 'Oral Model', ok: health.model_status?.oral ?? false },
                  { label: 'Skin Model', ok: health.model_status?.skin ?? false },
                  { label: 'Firebase', ok: health.firebase_status ?? false },
                ].map(({ label, ok }) => (
                  <div key={label} className="kpi">
                    <div className="lbl">{label}</div>
                    <div className="val" style={{ fontSize: '24px', color: ok ? 'var(--success)' : 'var(--danger)' }}>
                      {ok ? '●' : '○'}
                    </div>
                    <div style={{ fontSize: '13px', color: ok ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {ok ? 'Operational' : 'Offline'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '13px', fontWeight: 700 }}>UPTIME</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
                    <UptimeDisplay seconds={health.uptime_seconds ?? 0} />
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '13px', fontWeight: 700 }}>VERSION</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, marginTop: '4px' }}>{health.version ?? '1.0.0'}</div>
                </div>
              </div>
            </div>
          ) : <p style={{ color: 'var(--ink-soft)' }}>Could not load. Is backend running?</p>
        )}

        {tab === 'users' && (
          ul ? <p style={{ color: 'var(--ink-soft)' }}>Loading…</p> :
          <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="ja-table">
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Scans', 'Joined'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.name}</td>
                    <td style={{ color: 'var(--ink-soft)' }}>{u.email}</td>
                    <td>
                      <span className="ja-pill" style={{ background: 'var(--brand-soft)', color: ROLE_COLOR[u.role] ?? 'var(--ink-soft)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--ink-soft)' }}>{u.scan_count}</td>
                    <td style={{ color: 'var(--ink-soft)' }}>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'centres' && (
          cl ? <p style={{ color: 'var(--ink-soft)' }}>Loading…</p> :
          <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="ja-table">
              <thead>
                <tr>
                  {['Name', 'City', 'State', 'Phone', 'Type'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(centres ?? []).map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td style={{ color: 'var(--ink-soft)' }}>{c.city}</td>
                    <td style={{ color: 'var(--ink-soft)' }}>{c.state}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ink-soft)' }}>{c.phone}</td>
                    <td style={{ color: 'var(--ink-soft)', textTransform: 'capitalize' }}>{c.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
