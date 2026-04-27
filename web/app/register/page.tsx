'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setToken } from '@/lib/auth';
import { registerWithEmail, signInWithProvider } from '@/lib/firebase-auth';
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = (res: { token: string; user_id: string; user_profile?: { user_id: string; email: string; name: string; role: string } }, fallbackName = name, fallbackEmail = email) => {
    setToken(res.token);
    const profile = res.user_profile ?? { user_id: res.user_id, email: fallbackEmail, name: fallbackName, role: role as string };
    setUser(profile, res.token);
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPwd) { setError('Passwords do not match'); return; }
    if (!agreed) { setError('Please accept the terms'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await registerWithEmail(name, email, password);
      handleSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await signInWithProvider('google');
      handleSuccess(res, res.user_profile?.name ?? '', res.user_profile?.email ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
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

        {/* Google Sign-up */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '13px', border: '1.5px solid var(--line)', borderRadius: '12px',
            background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '20px',
            transition: 'border-color 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Signing up…' : 'Continue with Google'}
        </button>

        <div className="divider-or">or</div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
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

          <button type="submit" className="btn full" disabled={loading || googleLoading}>
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
