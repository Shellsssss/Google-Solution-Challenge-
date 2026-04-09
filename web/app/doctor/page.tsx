'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/dashboard/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
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

export default function DoctorPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const [tab, setTab] = useState<'queue' | 'reviewed'>('queue');
  const [reviewing, setReviewing] = useState<DoctorQueueItem | null>(null);
  const [notes, setNotes] = useState('');
  const [rec, setRec] = useState(RECS[0]);
  const [followUp, setFollowUp] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  const { data: queue, isLoading: ql } = useQuery({
    queryKey: ['doctor-queue'],
    queryFn: getDoctorQueue,
  });

  const { data: reviewed, isLoading: rl } = useQuery({
    queryKey: ['doctor-reviewed'],
    queryFn: getDoctorReviewed,
  });

  const sub = useMutation({
    mutationFn: () =>
      submitDoctorReview(reviewing!.id, {
        notes,
        recommendation: rec,
        follow_up_date: followUp,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-queue'] });
      setReviewing(null);
      setNotes('');
    },
  });

  const sideW = collapsed ? 'ml-16' : 'ml-60';

  return (
    <div className="flex h-screen bg-background-primary overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${sideW}`}>
        <h1 className="text-2xl font-bold text-white mb-1">Doctor Portal</h1>
        <p className="text-muted mb-6">Review AI screening results — {user?.name}</p>

        <div className="flex gap-1 bg-background-card rounded-xl p-1 border border-border mb-6 w-fit">
          {(['queue', 'reviewed'] as const).map((t) => {
            const label = t === 'queue'
              ? ('Review Queue' + (queue ? ' (' + queue.length + ')' : ''))
              : 'Reviewed Cases';
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === 'queue' && (
          ql ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="space-y-3">
              {(queue ?? []).length === 0 && (
                <div className="text-center py-16 text-muted">No pending reviews. All caught up!</div>
              )}
              {(queue ?? []).map((item) => {
                const borderCls = item.risk_level === 'HIGH_RISK' ? 'border-danger/40' : 'border-border';
                const dotCls = item.risk_level === 'HIGH_RISK' ? 'bg-danger'
                  : item.risk_level === 'LOW_RISK' ? 'bg-success' : 'bg-warning';
                return (
                  <div key={item.id} className={`bg-background-card rounded-2xl border p-5 flex items-center justify-between ${borderCls}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-1 self-stretch rounded-full ${dotCls}`} />
                      <div>
                        <p className="text-white font-medium">Patient-{item.id.slice(-4).toUpperCase()}</p>
                        <p className="text-muted text-sm">{formatDate(item.created_at)} · {item.scan_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge risk={item.risk_level} />
                      <span className="text-muted text-sm">{(item.confidence * 100).toFixed(0)}%</span>
                      <Button size="sm" onClick={() => setReviewing(item)}>Review</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'reviewed' && (
          rl ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : (
            <div className="bg-background-card rounded-2xl border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {['Patient', 'Date', 'Risk', 'Recommendation'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-muted uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(reviewed ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-background-secondary/50">
                      <td className="px-4 py-3 text-white">Patient-{item.id.slice(-4).toUpperCase()}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-3"><Badge risk={item.risk_level} /></td>
                      <td className="px-4 py-3 text-muted text-xs">{item.doctor_recommendation ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>

      {reviewing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-background-card rounded-2xl border border-border w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-white mb-3">Review Scan</h2>
            <Badge risk={reviewing.risk_level} />
            <div className="space-y-4 mt-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Doctor notes..."
                className="w-full bg-background-secondary border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent resize-none"
              />
              <select
                value={rec}
                onChange={(e) => setRec(e.target.value)}
                className="w-full bg-background-secondary border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
              >
                {RECS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <input
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="w-full bg-background-secondary border border-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="ghost" className="flex-1" onClick={() => setReviewing(null)}>Cancel</Button>
              <Button className="flex-1" isLoading={sub.isPending} onClick={() => sub.mutate()}>Save Review</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
