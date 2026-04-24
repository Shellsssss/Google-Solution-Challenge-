'use client';

import Link from 'next/link';
import { useAppStore } from '@/store';
import { useT } from '@/lib/i18n';
import type { Language } from '@/types';

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'HI' },
  { code: 'ta', label: 'TA' },
  { code: 'te', label: 'TE' },
];

export default function Navbar() {
  const { language, setLanguage } = useAppStore();
  const T = useT();

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        {/* Brand */}
        <Link href="/" className="brand">
          <span className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C10 2 4 5 4 10.5C4 14.09 6.69 17 10 17C13.31 17 16 14.09 16 10.5C16 5 10 2 10 2Z" fill="white"/>
              <path d="M10 8V13M7.5 10.5H12.5" stroke="#1f7a5a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="brand-name">
            Jan<span className="c">Arogya</span>
          </span>
        </Link>

        <div className="top-spacer" />

        {/* Nav links — desktop */}
        <div className="top-links" style={{ display: 'none' }} id="desk-nav">
          <Link href="/#how-it-works" className="top-link">{T.nav_how}</Link>
          <Link href="/scan" className="top-link">{T.nav_scan}</Link>
          <Link href="/about" className="top-link">{T.nav_about}</Link>
        </div>

        {/* Language switcher — connected to global store */}
        <div className="lang-switch">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={language === l.code ? 'on' : ''}
              onClick={() => setLanguage(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Sign in */}
        <Link href="/login">
          <button className="btn ghost" style={{ padding: '8px 16px', fontSize: '14px' }}>
            {T.nav_signin}
          </button>
        </Link>
      </div>

      {/* Inline desktop nav styles */}
      <style>{`
        @media (min-width: 640px) {
          #desk-nav { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
