'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useAppStore } from '@/store';
import type { UserRole } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPwd) { setError('Passwords do not match'); return; }
    if (!agreed) { setError('Please accept the terms'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await register(name, email, password, role);
      setToken(res.token);
      setUser({ user_id: res.user_id, name, email, role, scan_count: 0, created_at: new Date().toISOString() }, res.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--brand)', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '20px' }}>
            🌿 JanArogya
          </Link>
          <h1 style={{ marginTop: '12px' }}>Create account</h1>
          <p className="auth-sub">Join JanArogya — free cancer screening for all</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', color: 'var(--danger)', fontSize: '14px', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" />
          </div>
          <div className="field">
            <label>Confirm Password</label>
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required placeholder="••••••••" />
          </div>

          <div className="field">
            <label>I am a…</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(['patient', 'doctor'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  style={{
                    border: `2px solid ${role === r ? 'var(--brand)' : 'var(--line)'}`,
                    background: role === r ? 'var(--brand-soft)' : 'var(--surface)',
                    borderRadius: '12px', padding: '12px', cursor: 'pointer',
                    fontWeight: 700, fontSize: '14px', color: role === r ? 'var(--brand-dark)' : 'var(--ink-soft)',
                    fontFamily: 'inherit', transition: 'all 0.12s',
                  }}>
                  {r === 'patient' ? '🙋 Patient' : '🩺 Healthcare Professional'}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '18px', fontSize: '14px', color: 'var(--ink-soft)' }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
            I agree to the terms. This tool is for screening only, not diagnosis.
          </label>

          <button type="submit" className="btn full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--ink-soft)', marginTop: '16px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
