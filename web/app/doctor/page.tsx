'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/dashboard/Sidebar';
import { getDoctorQueue, getDoctorReviewed, submitDoctorReview } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { useAppStore } from '@/store';
import { formatDate } from '@/lib/utils';
import type { DoctorQueueItem } from '@/types';

const RECS = [
  'No action needed',
  'Follow-up in 1 month',
  'Follow-up in 1 week',
  'Specialist referral',
  'Urgent — contact patient now',
];

const RISK_COLOR: Record<string, string> = {
  HIGH_RISK: 'var(--danger)', LOW_RISK: 'var(--success)', INVALID: 'var(--warn)',
};

export default function DoctorPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [tab, setTab] = useState<'queue' | 'reviewed'>('queue');
  const [reviewing, setReviewing] = useState<DoctorQueueItem | null>(null);
  const [notes, setNotes] = useState('');
  const [rec, setRec] = useState(RECS[0]);
  const [followUp, setFollowUp] = useState('');
  const qc = useQueryClient();

  useEffect(() => { if (!getToken()) router.push('/login'); }, [router]);

  const { data: queue, isLoading: ql } = useQuery({ queryKey: ['doctor-queue'], queryFn: getDoctorQueue });
  const { data: reviewed, isLoading: rl } = useQuery({ queryKey: ['doctor-reviewed'], queryFn: getDoctorReviewed });

  const sub = useMutation({
    mutationFn: () => submitDoctorReview(reviewing!.id, { notes, recommendation: rec, follow_up_date: followUp }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor-queue'] }); setReviewing(null); setNotes(''); },
  });

  return (
    <div className="dash">
      <Sidebar activeTab="" onTabChange={() => {}} />

      <div className="dash-main">
        <h2 style={{ marginBottom: '4px' }}>Doctor Portal</h2>
        <p style={{ color: 'var(--ink-soft)', marginBottom: '24px' }}>Review AI screening results — {user?.name}</p>

        {/* Tabs */}
        <div style={{ display: 'inline-flex', gap: '4px', background: 'var(--surface)', padding: '4px', borderRadius: '14px', border: '1px solid var(--line)', marginBottom: '24px' }}>
          {(['queue', 'reviewed'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: tab === t ? 'var(--brand)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--ink-soft)',
              }}>
              {t === 'queue' ? `📋 Review Queue${queue ? ` (${queue.length})` : ''}` : '✅ Reviewed Cases'}
            </button>
          ))}
        </div>

        {tab === 'queue' && (
          ql ? <p style={{ color: 'var(--ink-soft)' }}>Loading…</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(queue ?? []).length === 0 && (
                <div className="panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-soft)' }}>
                  ✅ No pending reviews. All caught up!
                </div>
              )}
              {(queue ?? []).map((item) => (
                <div key={item.id} className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${RISK_COLOR[item.risk_level] ?? 'var(--line)'}` }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>Patient-{item.id.slice(-4).toUpperCase()}</p>
                    <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{formatDate(item.created_at)} · {item.scan_type}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="ja-pill" style={{ background: item.risk_level === 'HIGH_RISK' ? 'var(--danger-soft)' : 'var(--brand-soft)', color: RISK_COLOR[item.risk_level] ?? 'var(--ink)' }}>
                      {item.risk_level.replace('_', ' ')}
                    </span>
                    <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>{(item.confidence * 100).toFixed(0)}%</span>
                    <button className="btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setReviewing(item)}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'reviewed' && (
          rl ? <p style={{ color: 'var(--ink-soft)' }}>Loading…</p> :
          <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="ja-table">
              <thead>
                <tr>{['Patient', 'Date', 'Risk', 'Recommendation'].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(reviewed ?? []).map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700 }}>Patient-{item.id.slice(-4).toUpperCase()}</td>
                    <td style={{ color: 'var(--ink-soft)' }}>{formatDate(item.created_at)}</td>
                    <td><span className="ja-pill" style={{ background: item.risk_level === 'HIGH_RISK' ? 'var(--danger-soft)' : 'var(--brand-soft)', color: RISK_COLOR[item.risk_level] ?? 'var(--ink)' }}>{item.risk_level.replace('_', ' ')}</span></td>
                    <td style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>{item.doctor_recommendation ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,36,29,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
            <h2 style={{ marginBottom: '16px' }}>🩺 Review Scan</h2>
            <span className="ja-pill" style={{ background: reviewing.risk_level === 'HIGH_RISK' ? 'var(--danger-soft)' : 'var(--brand-soft)', color: RISK_COLOR[reviewing.risk_level] ?? 'var(--ink)', marginBottom: '16px', display: 'inline-block' }}>
              {reviewing.risk_level.replace('_', ' ')}
            </span>
            <div className="field" style={{ marginTop: '12px' }}>
              <label>Doctor Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Doctor notes…" style={{ resize: 'none', width: '100%', border: '1.5px solid var(--line)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }} />
            </div>
            <div className="field">
              <label>Recommendation</label>
              <select value={rec} onChange={(e) => setRec(e.target.value)}>
                {RECS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Follow-up Date</label>
              <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <button className="btn outline" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="btn" disabled={sub.isPending} onClick={() => sub.mutate()}>
                {sub.isPending ? 'Saving…' : 'Save Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
