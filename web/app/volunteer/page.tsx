'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import {
  registerVolunteer,
  getVolunteerTasks,
  getAllTasks,
  getAllVolunteers,
  getSmartMatches,
  acceptTask,
  declineTask,
  completeTask,
} from '@/lib/api';
import type { VolunteerProfile, VolunteerTask } from '@/types';

const SKILLS = ['Medical / Nursing', 'Logistics', 'Data Entry', 'Awareness / Education', 'Field Work'];
const SKILL_VALS = ['medical', 'logistics', 'data_entry', 'awareness', 'field'];

const URGENCY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b' };
const URGENCY_BG    = { HIGH: '#fef2f2', MEDIUM: '#fffbeb' };
const STATUS_COLOR  = { open: '#22c55e', assigned: '#3b82f6', completed: '#94a3b8' };

const TASK_LABEL: Record<string, string> = {
  screening_camp: '🏕 Screening Camp',
  patient_followup: '🔁 Patient Followup',
  awareness_drive: '📢 Awareness Drive',
};

const STORAGE_KEY = 'janarogya_volunteer_id';

function getStoredVid(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export default function VolunteerPage() {
  const [view, setView] = useState<'register' | 'dashboard' | 'ngo'>('register');
  const [vid, setVid] = useState<string | null>(null);
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);

  // Registration form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regSkills, setRegSkills] = useState<string[]>([]);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Tasks
  const [available, setAvailable] = useState<VolunteerTask[]>([]);
  const [accepted, setAccepted] = useState<VolunteerTask[]>([]);
  const [completed, setCompleted] = useState<VolunteerTask[]>([]);

  // NGO view
  const [allTasks, setAllTasks] = useState<VolunteerTask[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<VolunteerProfile[]>([]);
  const [matchResult, setMatchResult] = useState<{ city: string; volunteers: (VolunteerProfile & { distance_km: number })[] } | null>(null);
  const [ngoLoading, setNgoLoading] = useState(false);

  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  useEffect(() => {
    const storedVid = getStoredVid();
    if (storedVid) { setVid(storedVid); setView('dashboard'); }
  }, []);

  const loadTasks = useCallback(async (volunteerVid: string) => {
    const data = await getVolunteerTasks(volunteerVid).catch(() => null);
    if (data) { setAvailable(data.available); setAccepted(data.accepted); setCompleted(data.completed); }
  }, []);

  useEffect(() => {
    if (vid && view === 'dashboard') loadTasks(vid);
  }, [vid, view, loadTasks]);

  useEffect(() => {
    if (view === 'ngo') {
      setNgoLoading(true);
      Promise.all([getAllTasks(), getAllVolunteers()])
        .then(([tasks, vols]) => { setAllTasks(tasks); setAllVolunteers(vols); })
        .finally(() => setNgoLoading(false));
    }
  }, [view]);

  const captureGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setGpsCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsLoading(false); },
      () => setGpsLoading(false),
      { timeout: 8000 }
    );
  };

  const handleRegister = async () => {
    if (!regName.trim()) { setRegError('Please enter your name.'); return; }
    setRegLoading(true); setRegError('');
    try {
      const p = await registerVolunteer({
        name: regName,
        phone: regPhone,
        org: regOrg || 'Individual',
        lat: gpsCoords?.lat,
        lng: gpsCoords?.lng,
        skills: regSkills,
      });
      setProfile(p);
      setVid(p.volunteer_id);
      localStorage.setItem(STORAGE_KEY, p.volunteer_id);
      setView('dashboard');
      showToast(`Welcome, ${p.name}! You are now registered as a volunteer.`);
    } catch {
      setRegError('Registration failed. Is the backend running?');
    } finally {
      setRegLoading(false);
    }
  };

  const handleAccept = async (tid: string) => {
    if (!vid) return;
    setActionLoading(tid);
    await acceptTask(vid, tid).catch(() => null);
    await loadTasks(vid);
    showToast('Task accepted! Check your "Accepted Tasks" section.');
    setActionLoading('');
  };

  const handleDecline = async (tid: string) => {
    if (!vid) { showToast('Register first to skip tasks.'); return; }
    setActionLoading(tid);
    await declineTask(vid, tid).catch(() => null);
    await loadTasks(vid);
    setActionLoading('');
  };

  const handleComplete = async (tid: string) => {
    if (!vid) return;
    setActionLoading(tid);
    await completeTask(vid, tid, '').catch(() => null);
    await loadTasks(vid);
    showToast('Task marked complete! Thank you for your contribution.');
    setActionLoading('');
  };

  const handleSmartMatch = async (city: string) => {
    const data = await getSmartMatches(city).catch(() => null);
    if (data) setMatchResult({ city: data.city, volunteers: data.nearest_volunteers });
    else showToast(`No volunteers with location data near ${city} yet.`);
  };

  return (
    <div>
      <Navbar />

      <div className="page-head">
        <div className="page-head-inner">
          <div style={{ flex: 1 }}>
            <p className="crumb">Community Health · Volunteer Coordination</p>
            <h1>Data-Driven Volunteer Matching</h1>
            <p style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>
              AI-identified high-risk areas matched with the nearest available volunteers — automatically.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['register', 'dashboard', 'ngo'].map((v) => (
              <button key={v} onClick={() => setView(v as 'register' | 'dashboard' | 'ngo')}
                style={{
                  border: `2px solid ${view === v ? 'var(--brand)' : 'var(--line)'}`,
                  background: view === v ? 'var(--brand)' : 'var(--surface)',
                  color: view === v ? '#fff' : 'var(--ink-soft)',
                  borderRadius: '999px', padding: '7px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}>
                {v === 'register' ? '+ Register' : v === 'dashboard' ? 'My Tasks' : 'NGO View'}
              </button>
            ))}
            <Link href="/community">
              <button style={{ border: '1.5px solid var(--line)', background: 'none', borderRadius: '999px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer', color: 'var(--ink-soft)' }}>
                ← Map
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Toast */}
        {toast && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', color: '#15803d', fontWeight: 600, fontSize: '14px' }}>
            {toast}
          </div>
        )}

        {/* ── Register ── */}
        {view === 'register' && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '20px', padding: '32px' }}>
              <h2 style={{ marginBottom: '8px' }}>Register as Volunteer</h2>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                Join our network of volunteers. We'll automatically match you to high-risk areas near your location.
              </p>

              {regError && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '12px' }}>{regError}</p>}

              {[
                { label: 'Full Name *', val: regName, set: setRegName, placeholder: 'Dr. Priya Sharma' },
                { label: 'Phone', val: regPhone, set: setRegPhone, placeholder: '+91 98765 43210' },
                { label: 'Organisation', val: regOrg, set: setRegOrg, placeholder: 'HealthForAll NGO (or leave blank)' },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--line)', fontSize: '14px', fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', boxSizing: 'border-box' }} />
                </div>
              ))}

              {/* Skills */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {SKILLS.map((s, i) => {
                    const val = SKILL_VALS[i];
                    const on = regSkills.includes(val);
                    return (
                      <button key={val} type="button"
                        onClick={() => setRegSkills(on ? regSkills.filter((x) => x !== val) : [...regSkills, val])}
                        style={{ border: `1.5px solid ${on ? 'var(--brand)' : 'var(--line)'}`, background: on ? 'var(--brand)' : 'var(--surface)', color: on ? '#fff' : 'var(--ink-soft)', borderRadius: '999px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GPS */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-soft)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Location (for smart matching)</label>
                <button type="button" onClick={captureGPS} disabled={gpsLoading}
                  style={{ border: `1.5px solid ${gpsCoords ? 'var(--brand)' : 'var(--line)'}`, background: gpsCoords ? 'var(--brand-soft)' : 'var(--bg)', color: gpsCoords ? 'var(--brand)' : 'var(--ink-soft)', borderRadius: '999px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {gpsLoading ? '⏳ Detecting…' : gpsCoords ? `📍 ${gpsCoords.lat.toFixed(3)}, ${gpsCoords.lng.toFixed(3)}` : '📍 Detect My Location'}
                </button>
              </div>

              <button onClick={handleRegister} disabled={regLoading}
                style={{ width: '100%', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>
                {regLoading ? 'Registering…' : 'Register & Start Helping →'}
              </button>

              {vid && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-soft)', marginTop: '12px' }}>
                  Already registered? <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 700, cursor: 'pointer' }}>Go to My Tasks</button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Volunteer Dashboard ── */}
        {view === 'dashboard' && (
          <div>
            {!vid ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-soft)' }}>
                <p>Please <button onClick={() => setView('register')} style={{ background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>register first</button> to see your matched tasks.</p>
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--brand-soft)', border: '1px solid var(--brand)', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--brand)' }}>Volunteer ID: {vid.slice(0, 8)}…</span>
                  <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setVid(null); setView('register'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '12px', cursor: 'pointer' }}>
                    Switch account
                  </button>
                </div>

                {/* Matched tasks */}
                <SectionHeader title="Tasks Matched Near You" count={available.length} color="var(--brand)" />
                {available.length === 0 ? (
                  <EmptyState msg="No open tasks near you yet. Tasks appear automatically as screenings are completed in high-risk areas." />
                ) : (
                  <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
                    {available.map((t) => (
                      <TaskCard key={t.task_id} task={t} actions={
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <ActionBtn label="Accept" color="var(--brand)" loading={actionLoading === t.task_id} onClick={() => handleAccept(t.task_id)} />
                          <ActionBtn label="Skip" color="var(--ink-soft)" outline loading={false} onClick={() => handleDecline(t.task_id)} />
                        </div>
                      } />
                    ))}
                  </div>
                )}

                {/* Accepted tasks */}
                <SectionHeader title="Accepted Tasks" count={accepted.length} color="#3b82f6" />
                {accepted.length === 0 ? (
                  <EmptyState msg="Tasks you accept will appear here." />
                ) : (
                  <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
                    {accepted.map((t) => (
                      <TaskCard key={t.task_id} task={t} actions={
                        <ActionBtn label="Mark Complete ✓" color="#16a34a" loading={actionLoading === t.task_id} onClick={() => handleComplete(t.task_id)} />
                      } />
                    ))}
                  </div>
                )}

                {/* Completed */}
                {completed.length > 0 && (
                  <>
                    <SectionHeader title="Completed" count={completed.length} color="#94a3b8" />
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {completed.map((t) => <TaskCard key={t.task_id} task={t} dim />)}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── NGO View ── */}
        {view === 'ngo' && (
          <div>
            {ngoLoading ? (
              <div style={{ textAlign: 'center', padding: '80px', color: 'var(--ink-soft)' }}>Loading…</div>
            ) : (
              <>
                {/* KPI */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Tasks', val: allTasks.length, color: 'var(--brand)' },
                    { label: 'Open', val: allTasks.filter((t) => t.status === 'open').length, color: '#ef4444' },
                    { label: 'Volunteers', val: allVolunteers.length, color: '#3b82f6' },
                  ].map((k) => (
                    <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '14px', padding: '18px 20px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '4px' }}>{k.label}</p>
                      <p style={{ fontSize: '28px', fontWeight: 800, color: k.color }}>{k.val}</p>
                    </div>
                  ))}
                </div>

                {/* All tasks table */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                    <h3 style={{ margin: 0 }}>All Tasks</h3>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg)' }}>
                          {['City', 'Type', 'Urgency', 'Status', 'Assigned To', 'High Risk %', 'Smart Match'].map((h) => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allTasks.map((t) => (
                          <tr key={t.task_id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '10px 14px', fontWeight: 700 }}>{t.city}<br/><span style={{ fontWeight: 400, color: 'var(--ink-soft)', fontSize: '11px' }}>{t.state}</span></td>
                            <td style={{ padding: '10px 14px' }}>{TASK_LABEL[t.task_type] ?? t.task_type}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ background: URGENCY_BG[t.urgency] ?? '#f1f5f9', color: URGENCY_COLOR[t.urgency] ?? '#64748b', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>{t.urgency}</span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ color: STATUS_COLOR[t.status] ?? '#64748b', fontWeight: 700, textTransform: 'capitalize' }}>{t.status}</span>
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--ink-soft)' }}>{t.assigned_name || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: 700 }}>{t.high_risk_pct}%</td>
                            <td style={{ padding: '10px 14px' }}>
                              {t.status === 'open' && (
                                <button onClick={() => handleSmartMatch(t.city)}
                                  style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '999px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                  Match
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allTasks.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-soft)' }}>No tasks yet. Tasks generate automatically when community data reaches thresholds.</div>}
                  </div>
                </div>

                {/* Smart match result */}
                {matchResult && (
                  <div style={{ background: 'var(--surface)', border: '1.5px solid var(--brand)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px' }}>🎯 Nearest Volunteers for {matchResult.city}</h3>
                    {matchResult.volunteers.length === 0 ? (
                      <p style={{ color: 'var(--ink-soft)' }}>No volunteers with location data within range yet.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {matchResult.volunteers.map((v) => (
                          <div key={v.volunteer_id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'var(--bg)', borderRadius: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>
                              {v.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 700, marginBottom: '2px' }}>{v.name}</p>
                              <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{v.org} · {v.skills.join(', ') || 'General'}</p>
                            </div>
                            <span style={{ background: 'var(--brand-soft)', color: 'var(--brand)', borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: 700 }}>
                              {v.distance_km} km
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setMatchResult(null)} style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '13px', cursor: 'pointer' }}>Close</button>
                  </div>
                )}

                {/* Volunteer roster */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                    <h3 style={{ margin: 0 }}>Volunteer Roster ({allVolunteers.length})</h3>
                  </div>
                  {allVolunteers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-soft)' }}>No volunteers registered yet.</div>
                  ) : (
                    <div style={{ padding: '12px' }}>
                      {allVolunteers.map((v) => (
                        <div key={v.volunteer_id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--brand)', fontSize: '15px', flexShrink: 0 }}>
                            {v.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '14px' }}>{v.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{v.org} · {v.skills.join(', ') || 'No skills listed'}</p>
                          </div>
                          <span style={{ fontSize: '12px', color: v.available ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>{v.available ? 'Available' : 'Busy'}</span>
                          <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{v.accepted_task_ids.length} tasks accepted</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <h2 style={{ fontSize: '17px', margin: 0 }}>{title}</h2>
      <span style={{ background: color, color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>{count}</span>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px dashed var(--line)', borderRadius: '14px', padding: '32px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.5 }}>
      {msg}
    </div>
  );
}

function TaskCard({ task: t, actions, dim }: { task: VolunteerTask; actions?: React.ReactNode; dim?: boolean }) {
  return (
    <div style={{
      background: dim ? 'var(--bg)' : 'var(--surface)',
      border: `1px solid ${t.urgency === 'HIGH' && !dim ? '#fecaca' : 'var(--line)'}`,
      borderRadius: '16px', padding: '18px 20px',
      opacity: dim ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '16px' }}>{t.city}</span>
            <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{t.state}</span>
            <span style={{ background: URGENCY_BG[t.urgency] ?? '#f1f5f9', color: URGENCY_COLOR[t.urgency] ?? '#64748b', borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}>{t.urgency}</span>
            <span style={{ background: 'var(--brand-soft)', color: 'var(--brand)', borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 }}>{TASK_LABEL[t.task_type] ?? t.task_type}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--ink-soft)' }}>
            <span>{t.total_scans} scans</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>{t.high_risk_pct}% high risk</span>
            {t.distance_km !== undefined && <span>📍 {t.distance_km} km away</span>}
            {t.assigned_name && <span>👤 {t.assigned_name}</span>}
          </div>
          {t.completed_at && <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>✓ Completed {new Date(t.completed_at).toLocaleDateString()}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}

function ActionBtn({ label, color, outline, loading, onClick }: { label: string; color: string; outline?: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{
        background: outline ? 'none' : color,
        color: outline ? color : '#fff',
        border: `1.5px solid ${color}`,
        borderRadius: '999px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
      {loading ? '…' : label}
    </button>
  );
}
