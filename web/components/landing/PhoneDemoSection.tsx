'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const PhoneDemoModal = dynamic(() => import('./PhoneDemoModal'), { ssr: false });

export default function PhoneDemoSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <PhoneDemoModal onClose={() => setOpen(false)} />}

      <section className="phone-demo-band">
        <div className="phone-demo-inner">
          {/* Left text */}
          <div className="phone-demo-text">
            <p className="kicker" style={{ textAlign: 'left' }}>Interactive demo</p>
            <h2>Run the full app<br />in your browser</h2>
            <p>
              No install needed. Tap through the entire JanArogya experience — scan, get results, find nearby clinics, view history — inside a live phone frame.
            </p>
            <button className="btn big" onClick={() => setOpen(true)}>
              📱 Launch Phone Demo
            </button>
            <div style={{ marginTop: '18px', display: 'flex', gap: '18px', color: 'var(--ink-soft)', fontSize: '14px', fontWeight: 600, flexWrap: 'wrap' }}>
              <span>✅ Real AI analysis</span>
              <span>🗺️ Live clinic map</span>
              <span>📜 Scan history</span>
            </div>
          </div>

          {/* Right: static phone preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="phone-shell" style={{ cursor: 'pointer' }} onClick={() => setOpen(true)}>
              <div className="phone-notch" />
              <div className="phone-screen">
                {/* Mini app preview */}
                <div style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'var(--brand)', borderRadius: '12px', padding: '12px', color: '#fff' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '16px' }}>JanArogya</div>
                    <div style={{ fontSize: '12px', opacity: 0.85 }}>जनआरोग्य · Free cancer screening</div>
                  </div>

                  <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '12px', border: '1px solid var(--line)', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>📷</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>Take a photo</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>Oral or skin scan</div>
                  </div>

                  <div style={{ background: 'var(--brand-soft)', borderRadius: '12px', padding: '12px', border: '1px solid var(--line)' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--brand-dark)', marginBottom: '4px' }}>✅ LOW RISK</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Confidence: 91% · Oral scan</div>
                    <div style={{ height: '5px', background: 'var(--line)', borderRadius: '3px', marginTop: '6px' }}>
                      <div style={{ width: '91%', height: '100%', background: 'var(--brand)', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
                    {['🏠', '📷', '🗺️', '📜'].map((ico, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '6px', background: i === 1 ? 'var(--brand-soft)' : 'transparent', borderRadius: '8px' }}>
                        <div style={{ fontSize: '18px' }}>{ico}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
