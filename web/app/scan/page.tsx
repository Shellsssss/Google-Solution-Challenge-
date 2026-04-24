'use client';

import { useState, useCallback, useRef } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ResultCard from '@/components/scan/ResultCard';
import SymptomQuestionnaire, { type SymptomData } from '@/components/scan/SymptomQuestionnaire';
import { analyzeBase64 } from '@/lib/api';
import { fileToBase64 } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store';
import type { AnalysisResult, Language, ScanResult, ScanType } from '@/types';

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
];

const SCAN_TYPES: { value: ScanType; label: string; emoji: string; desc: string }[] = [
  { value: 'oral', label: 'Oral Cavity', emoji: '🦷', desc: 'Inside mouth, tongue, gums' },
  { value: 'skin', label: 'Skin Lesion', emoji: '🩹', desc: 'Moles, spots, discoloration' },
  { value: 'other', label: 'General', emoji: '🔍', desc: 'General screening' },
];

const defaultSymptoms: SymptomData = {
  selected_symptoms: [], duration: '', pain_level: 0,
  risk_factors: [], followup_answers: {}, additional_notes: '',
};

export default function ScanPage() {
  const T = useT();
  const { language, setLanguage } = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanType, setScanType] = useState<ScanType>('oral');
  const [symptoms, setSymptoms] = useState<SymptomData>(defaultSymptoms);
  const [showSymptoms, setShowSymptoms] = useState(true);
  const [symptomsComplete, setSymptomsComplete] = useState(false);
  const [showSymptomsWarning, setShowSymptomsWarning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f); setPreview(URL.createObjectURL(f));
    setResult(null); setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  }, []);

  const buildSymptomsPayload = (): Record<string, string> | undefined => {
    const hasData = symptoms.selected_symptoms.length > 0 || symptoms.duration ||
      symptoms.pain_level > 0 || symptoms.risk_factors.length > 0 ||
      Object.values(symptoms.followup_answers).some(Boolean) || symptoms.additional_notes;
    if (!hasData) return undefined;
    const parts: Record<string, string> = {};
    if (symptoms.selected_symptoms.length > 0) parts.symptoms = symptoms.selected_symptoms.join(', ');
    if (symptoms.duration) parts.duration = symptoms.duration;
    if (symptoms.pain_level > 0) parts.pain_level = `${symptoms.pain_level}/10`;
    if (symptoms.risk_factors.length > 0) parts.risk_factors = symptoms.risk_factors.join(', ');
    Object.entries(symptoms.followup_answers).forEach(([k, v]) => { if (v) parts[`followup_${k}`] = v; });
    if (symptoms.additional_notes) parts.additional_notes = symptoms.additional_notes;
    return parts;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!symptomsComplete) {
      setShowSymptoms(true);
      setShowSymptomsWarning(true);
      return;
    }
    setShowSymptomsWarning(false);
    setLoading(true); setError(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await analyzeBase64(base64, scanType, buildSymptomsPayload(), language);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg.includes('fetch') || msg.includes('Failed')
        ? T.error_backend
        : msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError(null);
    setSymptoms(defaultSymptoms); setShowSymptoms(true);
    setSymptomsComplete(false); setShowSymptomsWarning(false);
  };

  const symptomsCount = symptoms.selected_symptoms.length + symptoms.risk_factors.length +
    Object.values(symptoms.followup_answers).filter(Boolean).length;

  return (
    <div>
      <Navbar />

      <div className="page-head">
        <div className="page-head-inner">
          <div>
            <p className="crumb">{T.scan_crumb}</p>
            <h1>{T.scan_title}</h1>
          </div>
        </div>
      </div>

      <div className="scan-wrap">
        <div className="scan-card">
          {/* Step bar */}
          <div className="scan-stepbar">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`dot ${(file ? 1 : 0) + (symptomsComplete ? 1 : 0) + (result ? 1 : 0) > i ? 'on' : ''}`} />
            ))}
          </div>

          {/* Step 1: Scan type */}
          <p className="scan-label">1. {T.scan_step1.replace('1. ', '')}</p>
          <div className="pick-two" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {SCAN_TYPES.map((t) => (
              <div key={t.value} className={`pick ${scanType === t.value ? 'on' : ''}`} onClick={() => setScanType(t.value)}>
                <div className="ico"><span style={{ fontSize: '32px' }}>{t.emoji}</span></div>
                <h4>{t.label}</h4>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Step 2: Upload */}
          <p className="scan-label" style={{ marginTop: '24px' }}>2. {T.scan_step2.replace('2. ', '')}</p>
          <label
            className={`uploader ${preview ? 'has' : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '14px' }} />
            ) : (
              <>
                <div className="ico"><span style={{ fontSize: '36px' }}>📷</span></div>
                <h4>{T.scan_upload_hint}</h4>
                <p>{T.scan_upload_sub}</p>
              </>
            )}
          </label>

          {preview && (
            <button type="button" onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--ink-soft)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
              {T.scan_remove}
            </button>
          )}

          <div className="help-tips">
            <b>{T.scan_tips}</b>
            {T.scan_tips_body}
          </div>

          {/* Step 3: Symptom questionnaire (mandatory) */}
          <div style={{ marginTop: '24px', border: `1.5px solid ${symptomsComplete ? 'var(--brand)' : showSymptomsWarning ? 'var(--danger)' : 'var(--line)'}`, borderRadius: '18px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            <button
              type="button"
              onClick={() => setShowSymptoms(!showSymptoms)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', background: showSymptoms ? 'var(--brand-soft)' : 'var(--surface)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  3. {T.scan_step3.replace('3. ', '')}
                  {symptomsCount > 0 && (
                    <span style={{ marginLeft: '8px', background: 'var(--brand)', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '11px' }}>
                      {symptomsCount}
                    </span>
                  )}
                  {symptomsComplete && (
                    <span style={{ marginLeft: '8px', background: 'var(--brand)', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '11px' }}>
                      ✓
                    </span>
                  )}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  {T.scan_step3_sub}
                </p>
                {showSymptomsWarning && !symptomsComplete && (
                  <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', fontWeight: 600 }}>
                    {T.scan_required_msg}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '18px', color: symptomsComplete ? 'var(--brand)' : 'var(--brand)', fontWeight: 700 }}>{showSymptoms ? '▲' : '▼'}</span>
            </button>

            {showSymptoms && (
              <div style={{ padding: '20px', borderTop: '1px solid var(--line)', background: 'var(--bg)' }}>
                <SymptomQuestionnaire
                  scanType={scanType === 'other' ? 'oral' : scanType}
                  onChange={setSymptoms}
                  onComplete={setSymptomsComplete}
                />
              </div>
            )}
          </div>

          {/* Step 4: Language */}
          <p className="scan-label" style={{ marginTop: '24px' }}>4. {T.scan_step4.replace('4. ', '')}</p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {LANGS.map((l) => (
              <button key={l.code} onClick={() => setLanguage(l.code)}
                style={{
                  border: `2px solid ${language === l.code ? 'var(--brand)' : 'var(--line)'}`,
                  background: language === l.code ? 'var(--brand)' : 'var(--surface)',
                  color: language === l.code ? '#fff' : 'var(--ink-soft)',
                  borderRadius: '999px', padding: '6px 18px', fontWeight: 700, fontSize: '14px',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                }}>
                {l.label}
              </button>
            ))}
          </div>

          {/* Analyze */}
          {!result && (
            <button
              className={`btn full ${!file || loading || !symptomsComplete ? 'disabled' : ''}`}
              onClick={handleAnalyze}
              disabled={!file || loading}
              style={{ opacity: !file || !symptomsComplete ? 0.65 : 1 }}
            >
              {loading ? T.scan_analysing : T.scan_analyse}
            </button>
          )}

          {!symptomsComplete && file && !loading && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ink-soft)', marginTop: '8px' }}>
              ↑ Complete symptom assessment to enable analysis
            </p>
          )}

          {loading && (
            <div className="progress-box">
              <div className="progress-ring">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="var(--line)" strokeWidth="8" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="var(--brand)" strokeWidth="8"
                    strokeDasharray="251" strokeDashoffset="63" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 48 48" to="360 48 48" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <div className="pct">AI</div>
              </div>
              <p style={{ fontWeight: 700, marginBottom: '4px' }}>{T.scan_ai_label}</p>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14px' }}>{T.scan_ai_sub}</p>
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: '14px', padding: '16px', marginTop: '16px', color: 'var(--danger)', fontSize: '14px', fontFamily: 'monospace' }}>
              ⚠ {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: '24px' }}>
              <ResultCard result={result as unknown as ScanResult} language={language} centres={[]} onNewScan={reset} />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
