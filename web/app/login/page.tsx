'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
      setUser(res.user_profile, res.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
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
          <h2 className="text-3xl font-bold text-white mb-3">Health for every person in rural India</h2>
          <p className="text-muted mb-8">AI-powered cancer screening via WhatsApp and Android. Free. Offline. Multilingual.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {[['95%', 'Model accuracy'], ['4', 'Languages'], ['₹0.08', 'Per screening']].map(([val, label]) => (
              <div key={label} className="bg-background-card rounded-xl p-4 border border-border text-center">
                <div className="text-2xl font-bold text-accent">{val}</div>
                <div className="text-xs text-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background-primary">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-muted mt-1">Sign in to your JanArogya account</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-danger/10 border border-danger/30 rounded-xl p-3 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background-card border border-border rounded-xl px-4 py-2.5 text-white placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-background-card border border-border rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" isLoading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted">
            <p className="mb-3 text-xs bg-background-card rounded-lg p-3 border border-border font-mono">
              Demo: admin@janarogya.health / admin123
            </p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-accent hover:underline">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
