import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const stats = [
  { value: '77,000', label: 'New oral cancer cases/year in India', source: 'GLOBOCAN 2021' },
  { value: '74.9%', label: 'Cases from rural areas', source: 'ICMR NCRP' },
  { value: '80%', label: 'Diagnosed at Stage 3 or 4', source: 'ICMR NCRP' },
  { value: '30%', label: 'Share of all cancers in India', source: 'ICMR NCRP' },
];

const team = [
  { role: 'Team Lead / ML Engineer', desc: 'EfficientNetB3 model training, TFLite export, project architecture' },
  { role: 'Flutter Developer', desc: 'Android app, on-device inference, multilingual UI' },
  { role: 'Backend Developer', desc: 'FastAPI, Gemini integration, WhatsApp webhook' },
  { role: 'Research & Outreach', desc: 'ASHA worker research, dataset curation, impact validation' },
];

const tech = [
  { name: 'Gemini 2.5 Flash', emoji: '✨', desc: '4-language AI analysis and report generation' },
  { name: 'TFLite / EfficientNetB3', emoji: '🧠', desc: 'On-device cancer risk classification' },
  { name: 'Firebase', emoji: '🔥', desc: 'Firestore database and Cloud Storage' },
  { name: 'Google Maps', emoji: '🗺️', desc: 'Nearest cancer screening centre lookup' },
  { name: 'Flutter', emoji: '📱', desc: 'Cross-platform Android app with offline support' },
  { name: 'Cloud Run', emoji: '☁️', desc: 'Scalable serverless backend deployment' },
  { name: 'WhatsApp Cloud API', emoji: '💬', desc: 'Zero-friction screening for basic phone users' },
];

export default function AboutPage() {
  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero" style={{ textAlign: 'center', padding: '80px 24px 56px' }}>
        <div className="center-col">
          <span className="eyebrow">🌿 Free · Open · For Everyone</span>
          <h1 style={{ marginTop: '12px' }}>
            Building Healthcare Equity<br />
            <span className="c">for Rural India</span>
          </h1>
          <p className="sub" style={{ margin: '16px auto 0', textAlign: 'center' }}>
            JanArogya (जनआरोग्य) &mdash; &ldquo;People&apos;s Health&rdquo; &mdash; is a free AI-powered cancer screening platform designed for the 600 million rural Indians who lack access to specialist care.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="reassure" style={{ padding: '48px 24px' }}>
        <div className="container">
          <p className="kicker">The Problem</p>
          <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>The Scale of the Crisis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {stats.map(({ value, label, source }) => (
              <div key={value} style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--line)', padding: '24px', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: '36px', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px' }}>{value}</div>
                <p style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--ink)' }}>{label}</p>
                <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{source}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: '14px', marginTop: '20px' }}>
            Late-stage diagnosis has a <strong>5-year survival rate of &lt;30%</strong>, vs. <strong>&gt;80%</strong> if caught at Stage 1.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="section">
        <div className="container">
          <p className="kicker">Our Solution</p>
          <h2>How JanArogya Helps</h2>
          <div className="steps">
            {[
              { emoji: '💬', title: 'WhatsApp Bot', desc: 'Send a photo on WhatsApp. Get risk assessment in Hindi in 10 seconds. No app download needed.' },
              { emoji: '📱', title: 'Android App', desc: 'Full screening with PDF reports, clinic finder, multilingual TTS, and offline AI on-device.' },
              { emoji: '🧠', title: 'AI Engine', desc: 'EfficientNetB3 TFLite (95%+ accuracy) + Gemini Vision for personalised 4-language plain-language analysis.' },
            ].map((s, i) => (
              <div className="step" key={i}>
                <div className="step-num">{i + 1}</div>
                <div className="ico"><span style={{ fontSize: '40px' }}>{s.emoji}</span></div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="reassure">
        <div className="container">
          <p className="kicker">The Team</p>
          <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>👥 Who Built This</h2>
          <div className="reassure-grid">
            {team.map(({ role, desc }) => (
              <div className="reassure-item" key={role}>
                <div className="ico"><span style={{ fontSize: '28px' }}>👤</span></div>
                <h4>{role}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="section">
        <div className="container">
          <p className="kicker">Technology</p>
          <h2>Built on Google Technologies</h2>
          <p className="subtitle">7 Google products powering every screening</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '32px' }}>
            {tech.map(({ name, emoji, desc }) => (
              <div key={name} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{emoji}</div>
                <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{name}</p>
                <p style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Helpline */}
      <section style={{ padding: '48px 24px' }}>
        <div className="center-col" style={{ textAlign: 'center' }}>
          <div style={{ background: 'var(--danger-soft)', border: '2px solid var(--danger)', borderRadius: '24px', padding: '36px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📞</div>
            <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Cancer Helpline</h3>
            <p style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--danger)', marginBottom: '8px' }}>1800-11-2345</p>
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>Toll-Free · 24/7 · National Cancer Grid India</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
