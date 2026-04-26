'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { getCommunityData, getAllTasks, getAllVolunteers } from '@/lib/api';
import type { CommunityZone } from '@/types';

const RISK_COLOR: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

const RISK_BG: Record<string, string> = {
  HIGH: '#fef2f2',
  MEDIUM: '#fffbeb',
  LOW: '#f0fdf4',
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type GoogleMaps = any;

export default function CommunityPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<CommunityZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [activeZone, setActiveZone] = useState<CommunityZone | null>(null);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [taskMap, setTaskMap] = useState<Record<string, { status: string; assigned_name: string }>>({});

  useEffect(() => {
    Promise.all([getCommunityData(), getAllTasks().catch(() => []), getAllVolunteers().catch(() => [])])
      .then(([z, tasks, vols]) => {
        setZones(z);
        setVolunteerCount(vols.length);
        const tm: Record<string, { status: string; assigned_name: string }> = {};
        for (const t of tasks) tm[t.city] = { status: t.status, assigned_name: t.assigned_name };
        setTaskMap(tm);
      })
      .catch(() => setZones([]))
      .finally(() => setLoading(false));
  }, []);

  // Load Google Maps JS API once — use onload, never remove the script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_MAPS_KEY;
    if (!apiKey) return;

    // Already loaded
    if ((window as any).google?.maps) { setMapReady(true); return; }

    // Script already injected (strict-mode double-run guard)
    if (document.querySelector('script[data-gm]')) return;

    const script = document.createElement('script');
    script.setAttribute('data-gm', '1');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapReady(true);
    script.onerror = () => console.error('[Maps] Failed to load Google Maps JS API — check key + billing');
    document.head.appendChild(script);
  }, []);

  // Draw / redraw map whenever data or API readiness changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || zones.length === 0) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    // Clear previous map instance
    mapRef.current.innerHTML = '';

    const map = new g.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
      ],
    });

    const openInfoRef: { current: any } = { current: null };

    zones.forEach((zone) => {
      if (!zone.lat || !zone.lng) return;
      const radius = Math.max(25000, Math.min(90000, zone.total * 4000));
      const color = RISK_COLOR[zone.risk_zone] ?? '#94a3b8';

      const circle = new g.maps.Circle({
        map,
        center: { lat: zone.lat, lng: zone.lng },
        radius,
        fillColor: color,
        fillOpacity: 0.32,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: 2,
        clickable: true,
      });

      const taskInfo = taskMap[zone.city];
      const infoWindow = new g.maps.InfoWindow({
        content: `
          <div style="font-family:sans-serif;padding:4px 0;min-width:170px;max-width:220px">
            <b style="font-size:15px">${zone.city}</b>
            <p style="color:#64748b;font-size:12px;margin:2px 0 0">${zone.state}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:8px 0"/>
            <p style="font-size:13px;margin:3px 0">Total scans: <b>${zone.total}</b></p>
            <p style="font-size:13px;margin:3px 0">High risk: <b style="color:${color}">${zone.high_risk_pct.toFixed(1)}%</b></p>
            ${zone.needs_screening_camp && !zone.handled ? '<p style="font-size:12px;color:#ef4444;margin-top:8px;font-weight:700">⚠ Screening camp recommended</p>' : ''}
            ${taskInfo?.assigned_name ? `<p style="font-size:12px;color:#3b82f6;margin-top:4px">👤 ${taskInfo.assigned_name}</p>` : ''}
            ${zone.handled ? `<p style="font-size:12px;color:#22c55e;margin-top:4px;font-weight:600">✓ Handled by ${zone.handled_by || 'volunteer'}</p>` : ''}
          </div>`,
      });

      circle.addListener('click', () => {
        if (openInfoRef.current) openInfoRef.current.close();
        infoWindow.setPosition({ lat: zone.lat, lng: zone.lng });
        infoWindow.open(map);
        openInfoRef.current = infoWindow;
        setActiveZone(zone);
      });
    });
  }, [mapReady, zones, taskMap]);

  const totalScans = zones.reduce((s, z) => s + z.total, 0);
  const highRiskZones = zones.filter((z) => z.risk_zone === 'HIGH').length;
  const campZones = zones.filter((z) => z.needs_screening_camp && !z.handled).length;

  return (
    <div>
      <Navbar />

      <div className="page-head">
        <div className="page-head-inner">
          <div>
            <p className="crumb">Community Health</p>
            <h1>Risk Heatmap & Insights</h1>
            <p style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>
              Real-time aggregated screening data across India — identifying areas that need attention most.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Screenings', val: totalScans, color: 'var(--brand)' },
            { label: 'High-Risk Areas', val: highRiskZones, color: '#ef4444' },
            { label: 'Camps Needed', val: campZones, color: '#f59e0b' },
            { label: 'Active Volunteers', val: volunteerCount, color: '#3b82f6' },
          ].map((k) => (
            <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', padding: '20px 24px' }}>
              <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginBottom: '6px' }}>{k.label}</p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: k.color }}>{loading ? '…' : k.val}</p>
            </div>
          ))}
        </div>

        {/* Map */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '20px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>🗺 Risk Heatmap</h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 600 }}>
              {[['HIGH', '🔴 High'], ['MEDIUM', '🟡 Medium'], ['LOW', '🟢 Low']].map(([k, label]) => (
                <span key={k}>{label}</span>
              ))}
            </div>
          </div>
          <div ref={mapRef} style={{ height: '420px', width: '100%' }}>
            {!mapReady && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)', fontSize: '14px' }}>
                Loading map…
              </div>
            )}
          </div>
        </div>

        {/* Zone table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '20px', overflow: 'hidden', marginBottom: '28px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Area-level Statistics</h3>
            <Link href="/volunteer">
              <button style={{ background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '999px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Volunteer View →
              </button>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ink-soft)' }}>Loading…</div>
          ) : zones.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ink-soft)' }}>No community data yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)' }}>
                    {['Area', 'State', 'Total Scans', 'High Risk %', 'Risk Zone', 'Action'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '12px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--line)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone, i) => (
                    <tr key={zone.city} style={{ borderBottom: '1px solid var(--line)', background: activeZone?.city === zone.city ? 'var(--brand-soft)' : 'transparent' }}
                      onClick={() => setActiveZone(zone)}>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{zone.city}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>{zone.state}</td>
                      <td style={{ padding: '12px 16px' }}>{zone.total}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--line)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${zone.high_risk_pct}%`, height: '100%', background: RISK_COLOR[zone.risk_zone], borderRadius: '999px' }} />
                          </div>
                          <span style={{ fontWeight: 700, color: RISK_COLOR[zone.risk_zone], minWidth: '40px' }}>{zone.high_risk_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: RISK_BG[zone.risk_zone], color: RISK_COLOR[zone.risk_zone], borderRadius: '999px', padding: '3px 10px', fontSize: '12px', fontWeight: 700 }}>
                          {zone.risk_zone === 'HIGH' ? '🔴' : zone.risk_zone === 'MEDIUM' ? '🟡' : '🟢'} {zone.risk_zone}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {zone.needs_screening_camp && !zone.handled ? (
                          <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>⚠ Camp needed</span>
                        ) : zone.handled ? (
                          <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>✓ Handled</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Monitoring</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resource suggestion callout */}
        {zones.some((z) => z.needs_screening_camp && !z.handled) && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>⚠</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '4px', color: '#dc2626' }}>Screening Camps Recommended</p>
              <p style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>
                {zones.filter((z) => z.needs_screening_camp && !z.handled).map((z) => z.city).join(', ')} — these areas have over 40% high-risk detections with significant scan volume. An on-ground screening camp would have high impact here.
              </p>
              <Link href="/volunteer">
                <button style={{ marginTop: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '999px', padding: '8px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  Volunteer / NGO Action →
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
