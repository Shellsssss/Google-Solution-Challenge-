'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Activity, AlertCircle, User, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  const [showPwd, setShowPwd] = useState(false);
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
      setUser({ id: res.user_id, name, email, role, scan_count: 0, created_at: new Date().toISOString() }, res.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-background-primary via-background-secondary to-background-card flex-col items-center justify-center p-12 border-r border-border">
        <div className="max-w-sm text-center">
          <div className="flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white">JanArogya</div>
              <div className="text-sm text-muted">जनआरोग्य</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Join the healthcare revolution</h2>
          <p className="text-muted">Help bring AI-powered cancer screening to 600 million rural Indians.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background-primary">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-muted mt-1">Join JanArogya today</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted block mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full bg-background-card border border-border rounded-xl px-4 py-2.5 text-white placeholder:text-muted focus:outline-none focus:border-accent"
                placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full bg-background-card border border-border rounded-xl px-4 py-2.5 text-white placeholder:text-muted focus:outline-none focus:border-accent"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-background-card border border-border rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-muted focus:outline-none focus:border-accent"
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required
                className="w-full bg-background-card border border-border rounded-xl px-4 py-2.5 text-white placeholder:text-muted focus:outline-none focus:border-accent"
                placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm text-muted block mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {([['patient', 'Patient', User], ['doctor', 'Healthcare Professional', Stethoscope]] as const).map(([val, label, Icon]) => (
                  <button key={val} type="button" onClick={() => setRole(val as UserRole)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${role === val ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-background-card text-muted hover:border-border-light'}`}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="rounded" />
              <span className="text-sm text-muted">I agree to the terms. This tool is for screening only, not diagnosis.</span>
            </label>
            <Button type="submit" isLoading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
