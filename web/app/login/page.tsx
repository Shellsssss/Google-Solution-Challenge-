'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useAppStore } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      setToken(res.token);
      const profile = res.user_profile ?? { user_id: res.user_id, email, name: email, role: 'patient' as const };
      setUser(profile, res.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" className="brand" style={{ justifyContent: 'center', marginBottom: '16px', display: 'inline-flex' }}>
            <span className="brand-mark">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C10 2 4 5 4 10.5C4 14.09 6.69 17 10 17C13.31 17 16 14.09 16 10.5C16 5 10 2 10 2Z" fill="white"/>
                <path d="M10 8V13M7.5 10.5H12.5" stroke="#1f7a5a" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </span>
            <span style={{ marginLeft: '8px', fontSize: '20px', fontFamily: 'var(--font-head)', fontWeight: 800 }}>JanArogya</span>
          </Link>
          <h1>Welcome back</h1>
          <p className="auth-sub">Sign in to your account</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', color: 'var(--danger)', fontSize: '14px', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: '13px' }}>
                {showPwd ? 'hide' : 'show'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn full" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="divider-or">or</div>

        <p style={{ fontSize: '12px', background: 'var(--bg)', borderRadius: '10px', padding: '12px', border: '1px solid var(--line)', fontFamily: 'monospace', color: 'var(--ink-soft)', marginBottom: '16px' }}>
          Demo: admin@janarogya.health / admin123
        </p>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--ink-soft)' }}>
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
