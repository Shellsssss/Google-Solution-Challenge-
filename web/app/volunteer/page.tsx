'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCommunityData, markZoneHandled } from '@/lib/api';
import type { CommunityZone } from '@/types';

const RISK_COLOR: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

export default function VolunteerPage() {
  const [zones, setZones] = useState<CommunityZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [volunteerId, setVolunteerId] = useState('');
  const [pendingCity, setPendingCity] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setLoading(true);
    getCommunityData()
      .then(setZones)
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  };

  const handleMark = async (city: string) => {
    if (!volunteerId.trim()) {
      setToast('Please enter your name or volunteer ID first.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    setMarking(true);
    try {
      await markZoneHandled(city, volunteerId);
      setToast(`✓ ${city} marked as handled by ${volunteerId}`);
      setTimeout(() => setToast(''), 4000);
      load();
    } catch {
      setToast('Could not update zone. Try again.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setMarking(false);
      setPendingCity(null);
    }
  };

  const urgentZones = zones.filter((z) => z.needs_screening_camp && !z.handled);
  const handledZones = zones.filter((z) => z.handled);
  const monitorZones = zones.filter((z) => !z.needs_screening_camp && !z.handled);

  return (
    <div>
      <Navbar />

      <div className="page-head">
        <div className="page-head-inner">
          <div>
            <p className="crumb">Community Health · Volunteer</p>
            <h1>Volunteer / NGO Dashboard</h1>
            <p style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>
              See high-risk areas, coordinate screening camps, and mark zones as handled.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Volunteer ID */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '24px' }}>👤</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, marginBottom: '6px' }}>Your Volunteer Identity</p>
            <input
              type="text"
              placeholder="Enter your name or organisation ID…"
              value={volunteerId}
              onChange={(e) => setVolunteerId(e.target.value)}
              style={{ width: '100%', maxWidth: '360px', padding: '9px 14px', borderRadius: '10px', border: '1.5px solid var(--line)', fontSize: '14px', fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)' }}
            />
          </div>
          <Link href="/community">
            <button style={{ background: 'none', border: '1.5px solid var(--line)', borderRadius: '999px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--ink-soft)' }}>
              ← Back to Map
            </button>
          </Link>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', color: '#15803d', fontWeight: 600, fontSize: '14px' }}>
            {toast}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-soft)' }}>Loading zones…</div>
        ) : (
          <>
            {/* Urgent zones */}
            {urgentZones.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '8px', padding: '4px 10px', fontSize: '14px' }}>⚠ ACTION NEEDED</span>
                  High-Risk Zones ({urgentZones.length})
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {urgentZones.map((zone) => (
                    <ZoneCard
                      key={zone.city}
                      zone={zone}
                      onMark={() => setPendingCity(zone.city)}
                      marking={marking && pendingCity === zone.city}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Monitoring zones */}
            {monitorZones.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--ink-soft)' }}>
                  Monitoring ({monitorZones.length})
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {monitorZones.map((zone) => (
                    <ZoneCard
                      key={zone.city}
                      zone={zone}
                      onMark={() => setPendingCity(zone.city)}
                      marking={marking && pendingCity === zone.city}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Handled zones */}
            {handledZones.length > 0 && (
              <section>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#22c55e' }}>
                  ✓ Handled ({handledZones.length})
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {handledZones.map((zone) => (
                    <ZoneCard key={zone.city} zone={zone} handled />
                  ))}
                </div>
              </section>
            )}

            {zones.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-soft)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌿</div>
                <p>No community data yet. Data appears as users run screenings with location enabled.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm modal */}
      {pendingCity && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Mark {pendingCity} as Handled?</p>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '24px', lineHeight: 1.5 }}>
              This records that a screening camp or team has been assigned to {pendingCity} by <b>{volunteerId || 'you'}</b>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleMark(pendingCity)}
                disabled={marking}
                style={{ flex: 1, background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '999px', padding: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
                {marking ? 'Saving…' : 'Confirm ✓'}
              </button>
              <button
                onClick={() => setPendingCity(null)}
                style={{ flex: 1, background: 'var(--bg)', border: '1.5px solid var(--line)', borderRadius: '999px', padding: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', color: 'var(--ink-soft)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function ZoneCard({
  zone,
  onMark,
  marking,
  handled,
}: {
  zone: CommunityZone;
  onMark?: () => void;
  marking?: boolean;
  handled?: boolean;
}) {
  return (
    <div style={{
      background: handled ? '#f0fdf4' : zone.needs_screening_camp ? '#fef2f2' : 'var(--surface)',
      border: `1px solid ${handled ? '#bbf7d0' : zone.needs_screening_camp ? '#fecaca' : 'var(--line)'}`,
      borderRadius: '16px',
      padding: '18px 22px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      {/* Risk badge */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: zone.risk_zone === 'HIGH' ? '#fef2f2' : zone.risk_zone === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '22px',
      }}>
        {zone.risk_zone === 'HIGH' ? '🔴' : zone.risk_zone === 'MEDIUM' ? '🟡' : '🟢'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        <p style={{ fontWeight: 800, fontSize: '16px', marginBottom: '2px' }}>{zone.city}</p>
        <p style={{ color: 'var(--ink-soft)', fontSize: '13px', marginBottom: '6px' }}>{zone.state}</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
          <span><b>{zone.total}</b> scans</span>
          <span style={{ color: RISK_COLOR[zone.risk_zone] }}><b>{zone.high_risk_pct}%</b> high risk</span>
          <span>Oral: {zone.oral} · Skin: {zone.skin}</span>
        </div>
        {zone.needs_screening_camp && !handled && (
          <p style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>⚠ Screening camp recommended</p>
        )}
        {handled && (
          <p style={{ marginTop: '6px', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
            ✓ Handled by {zone.handled_by || 'volunteer'}{zone.handled_at ? ` · ${new Date(zone.handled_at).toLocaleDateString()}` : ''}
          </p>
        )}
      </div>

      {/* Action */}
      {!handled && onMark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <button
            onClick={onMark}
            disabled={marking}
            style={{
              background: zone.needs_screening_camp ? '#dc2626' : 'var(--brand)',
              color: '#fff', border: 'none', borderRadius: '999px',
              padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            {marking ? 'Saving…' : zone.needs_screening_camp ? 'Mark Handled' : 'Assign Team'}
          </button>
        </div>
      )}
    </div>
  );
}
