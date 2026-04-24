'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

const navItems = [
  { label: 'Overview',   emoji: '📊', tab: 'overview' },
  { label: 'Analytics',  emoji: '📈', tab: 'analytics' },
  { label: 'Reports',    emoji: '📄', tab: 'reports' },
];

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Sidebar({ activeTab = 'overview', onTabChange }: SidebarProps) {
  const { user, logout } = useAppStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className="dash-side">
      {/* Brand */}
      <div style={{ padding: '8px 14px 16px', borderBottom: '1px solid var(--line)', marginBottom: '8px' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '16px' }}>J</span>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--ink)' }}>JanArogya</span>
        </Link>
      </div>

      {navItems.map((item) => (
        <button key={item.tab}
          className={item.tab === activeTab ? 'on' : ''}
          onClick={() => onTabChange?.(item.tab)}>
          <span>{item.emoji}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <Link href="/scan" style={{ textDecoration: 'none' }}>
        <button>
          <span>📷</span>
          <span>New Scan</span>
        </button>
      </Link>

      {user?.role === 'admin' && (
        <Link href="/admin" style={{ textDecoration: 'none' }}>
          <button>
            <span>🛡️</span>
            <span>Admin Panel</span>
          </button>
        </Link>
      )}
      {user?.role === 'doctor' && (
        <Link href="/doctor" style={{ textDecoration: 'none' }}>
          <button>
            <span>🩺</span>
            <span>Doctor Portal</span>
          </button>
        </Link>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px', marginTop: '8px' }}>
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'User'}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'capitalize' }}>{user?.role ?? 'patient'}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ color: 'var(--danger)', background: 'none', border: 'none', boxShadow: 'none', width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', borderRadius: '10px' }}>
          <span>→</span> Sign out
        </button>
      </div>
    </div>
  );
}
