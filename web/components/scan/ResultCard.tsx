'use client';

import { useState } from 'react';
import { generateReport } from '@/lib/api';
import { formatConfidence } from '@/lib/utils';
import type { ScanResult, Language, Centre } from '@/types';

const RISK_CONFIG = {
  LOW_RISK:  { emoji: '✅', label: 'LOW RISK',  bg: 'var(--brand-soft)', color: 'var(--brand-dark)', barColor: 'var(--brand)' },
  HIGH_RISK: { emoji: '⚠️', label: 'HIGH RISK', bg: 'var(--danger-soft)', color: 'var(--danger)',     barColor: 'var(--danger)' },
  INVALID:   { emoji: '❓', label: 'INVALID',   bg: 'var(--warn-soft)',   color: '#8a6b00',           barColor: 'var(--warn)' },
};

interface ResultCardProps {
  result: ScanResult;
  language: Language;
  centres: Centre[];
  onNewScan: () => void;
}

export default function ResultCard({ result, language, centres, onNewScan }: ResultCardProps) {
  const [downloading, setDownloading] = useState(false);

  const cfg = RISK_CONFIG[result.risk_level as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.INVALID;

  const getExplanation = () => {
    const exp = result.explanation;
    if (language === 'hi' && exp.hi) return exp.hi;
    if (language === 'ta' && exp.ta) return exp.ta;
    if (language === 'te' && exp.te) return exp.te;
    return exp.en;
  };

  const disclaimer = typeof result.disclaimer === 'object' && result.disclaimer !== null
    ? (result.disclaimer as Record<string, string>)[language] ?? (result.disclaimer as Record<string, string>).en
    : result.disclaimer ?? 'This is an AI-assisted screening tool. Results must be confirmed by a qualified healthcare professional.';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const report = await generateReport({
        risk_level: result.risk_level,
        confidence: result.confidence,
        explanation: getExplanation(),
        scan_type: result.scan_type,
      });
      const a = document.createElement('a');
      a.href = report.download_url;
      a.download = report.filename || 'JanArogya_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Silently fail — toast not available without context
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="result-card">
      <div className={`result-head ${result.risk_level === 'HIGH_RISK' ? 'warn' : 'safe'}`}>
        <div className="big-ico">
          <span style={{ fontSize: '52px' }}>{cfg.emoji}</span>
        </div>
        <h1>{cfg.label}</h1>
        <p className="sub">
          {result.scan_type ? `${result.scan_type} screening` : 'Cancer screening'} · {formatConfidence(result.confidence)} confidence
        </p>
      </div>

      {/* Confidence bar */}
      <div className="confidence">
        <div style={{ fontSize: '13px', color: 'var(--ink-soft)', fontWeight: 700, flexShrink: 0 }}>AI Confidence</div>
        <div className="conf-bar">
          <div style={{ width: `${result.confidence * 100}%`, background: cfg.barColor, transition: 'width 1s ease' }} />
        </div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: cfg.barColor, flexShrink: 0 }}>{formatConfidence(result.confidence)}</div>
      </div>

      <div className="result-body">
        <h3>What this means</h3>
        <div className="plain-box">{getExplanation()}</div>

        {/* Disclaimer */}
        <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: '12px', padding: '12px 16px', marginTop: '16px', fontSize: '13px', color: '#6b5f52' }}>
          ℹ {disclaimer}
        </div>

        {/* Actions */}
        <div className="result-actions" style={{ marginTop: '20px' }}>
          <button className="btn outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? '⏳ Generating…' : '📄 Download PDF Report'}
          </button>
          <button className="btn ghost" onClick={onNewScan} style={{ border: '2px solid var(--line)' }}>
            🔄 New Scan
          </button>
        </div>

        {/* Nearby centres */}
        {centres.length > 0 && (
          <div style={{ marginTop: '20px', border: '1px solid var(--line)', borderRadius: '16px', padding: '16px' }}>
            <h3 style={{ marginBottom: '12px' }}>🗺️ Nearest Screening Centres</h3>
            {centres.slice(0, 3).map((c) => (
              <div key={c.centre_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px' }}>{c.name}</p>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '12px' }}>{c.city}, {c.state}</p>
                </div>
                <a href={`tel:${c.phone}`} style={{ color: 'var(--brand)', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                  {c.phone}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
