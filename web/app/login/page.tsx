'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setToken } from '@/lib/auth';
import { signInWithEmail, signInWithProvider } from '@/lib/firebase-auth';
import { useAppStore } from '@/store';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuccess = (res: { token: string; user_id: string; user_profile?: { user_id: string; email: string; name: string; role: string } }) => {
    setToken(res.token);
    const profile = res.user_profile ?? { user_id: res.user_id, email, name: email, role: 'patient' as const };
    setUser(profile, res.token);
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signInWithEmail(email, password);
      handleSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await signInWithProvider('google');
      handleSuccess(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
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

        {/* Google Sign-in */}
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
          {googleLoading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <div className="divider-or">or</div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
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

          <button type="submit" className="btn full" disabled={loading || googleLoading} style={{ marginTop: '8px' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--ink-soft)', marginTop: '20px' }}>
          No account?{' '}
          <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
