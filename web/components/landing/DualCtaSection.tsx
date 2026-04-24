'use client';

import Link from 'next/link';

export default function DualCtaSection() {
  return (
    <section className="dual-cta">
      <div className="dual-cta-grid">
        {/* Oral */}
        <Link href="/scan?type=oral" style={{ textDecoration: 'none' }}>
          <div className="cta-card">
            <div className="bigicon">
              <span style={{ fontSize: '44px' }}>🦷</span>
            </div>
            <div>
              <h3>Check my mouth</h3>
              <p>
                Oral cancer is the most common cancer in India. Take a clear photo of the inside of your mouth — our AI checks for early warning signs in seconds.
              </p>
            </div>
            <button className="btn full">Start oral check →</button>
          </div>
        </Link>

        {/* Skin */}
        <Link href="/scan?type=skin" style={{ textDecoration: 'none' }}>
          <div className="cta-card second">
            <div className="bigicon">
              <span style={{ fontSize: '44px' }}>🩹</span>
            </div>
            <div>
              <h3>Check a skin mark</h3>
              <p>
                Noticed a new mole or changing spot? Photograph it and let our AI assess whether it needs medical attention.
              </p>
            </div>
            <button className="btn accent-btn full">Start skin check →</button>
          </div>
        </Link>
      </div>
    </section>
  );
}
