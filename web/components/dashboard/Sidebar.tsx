'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ScanLine,
  FileText,
  BarChart3,
  Map,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Activity,
  Stethoscope,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, tab: 'overview' },
  { label: 'Scan Now', href: '/scan', icon: ScanLine, external: true },
  { label: 'Reports', href: '/dashboard?tab=reports', icon: FileText, tab: 'reports' },
  { label: 'Analytics', href: '/dashboard?tab=analytics', icon: BarChart3, tab: 'analytics' },
  { label: 'Map', href: '/dashboard?tab=map', icon: Map, tab: 'map' },
  { label: 'Settings', href: '/dashboard?tab=settings', icon: Settings, tab: 'settings' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout, sidebarCollapsed, toggleSidebar } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-background-secondary border-r border-border transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border', sidebarCollapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Activity className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className="text-sm font-bold text-white">JanArogya</div>
            <div className="text-xs text-muted">जनआरोग्य</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.external
            ? pathname === item.href
            : activeTab === (item.tab ?? '');

          return (
            <button
              key={item.href}
              onClick={() => {
                if (item.external) {
                  router.push(item.href);
                } else if (item.tab) {
                  onTabChange(item.tab);
                }
              }}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-background-card hover:text-white',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Role-based extras */}
        {user?.role === 'doctor' && (
          <Link href="/doctor">
            <button
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-sm font-medium transition-all duration-200 text-muted hover:bg-background-card hover:text-white',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? 'Doctor Portal' : undefined}
            >
              <Stethoscope className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>Doctor Portal</span>}
            </button>
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link href="/admin">
            <button
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-sm font-medium transition-all duration-200 text-muted hover:bg-background-card hover:text-white',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? 'Admin Panel' : undefined}
            >
              <Shield className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>Admin Panel</span>}
            </button>
          </Link>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className={cn('flex items-center gap-3 mb-2', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</div>
              <div className="text-xs text-muted capitalize">{user?.role ?? 'patient'}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs text-muted hover:text-danger hover:bg-danger/5 transition-all',
            sidebarCollapsed && 'justify-center'
          )}
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background-card border border-border flex items-center justify-center text-muted hover:text-white transition-colors z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
