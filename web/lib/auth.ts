import type { User } from '@/types';

const TOKEN_KEY = 'ja_token';
const REFRESH_KEY = 'ja_refresh_token';
const USER_KEY = 'ja_user';

// ─── Token helpers (localStorage) ───────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── User helpers ────────────────────────────────────────
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── Auth state check ────────────────────────────────────
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function hasRole(requiredRole: 'doctor' | 'admin'): boolean {
  const user = getStoredUser();
  if (!user) return false;
  if (requiredRole === 'admin') return user.role === 'admin';
  if (requiredRole === 'doctor') return user.role === 'doctor' || user.role === 'admin';
  return true;
}

// ─── Auth header ─────────────────────────────────────────
export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
