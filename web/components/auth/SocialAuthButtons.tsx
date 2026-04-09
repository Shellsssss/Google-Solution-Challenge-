'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setToken } from '@/lib/auth';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import type { UserRole } from '@/types';

interface Props {
  redirectTo?: string;
}

export default function SocialAuthButtons({ redirectTo = '/dashboard' }: Props) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const setUser = useAppStore((s) => s.setUser);
  const router = useRouter();

  const handleGoogle = async () => {
    setLoadingProvider('google');
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();

      // Exchange for JanArogya JWT
      let token = '';
      let profile = {
        user_id: cred.user.uid,
        email: cred.user.email ?? '',
        name: cred.user.displayName ?? 'User',
        role: 'patient' as UserRole,
        scan_count: 0,
        created_at: new Date().toISOString(),
      };

      try {
        const res = await fetch(`${API_BASE}/auth/firebase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
        });
        if (res.ok) {
          const data = await res.json();
          token = data.token;
          if (data.user_profile) {
            profile = { ...profile, ...data.user_profile, scan_count: 0, created_at: new Date().toISOString() };
          }
        }
      } catch {
        // Backend offline — use Firebase UID as token fallback
        token = idToken;
      }

      if (token) setToken(token);
      setUser(profile, token);
      router.push(redirectTo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed') || msg.includes('cancelled') || msg.includes('popup-blocked')) {
        setError('Popup was blocked — please allow popups for localhost in your browser settings');
      } else {
        setError(msg.replace('Firebase: ', '').split(' (auth/')[0]);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loadingProvider === 'google'}
        className="w-full flex items-center justify-center gap-3 bg-background-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-white hover:bg-background-secondary hover:border-border-light transition-all disabled:opacity-60 cursor-pointer"
      >
        {loadingProvider === 'google' ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Continue with Google
      </button>

      {error && (
        <p className="text-xs text-danger text-center bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
