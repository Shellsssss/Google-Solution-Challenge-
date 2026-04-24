'use client';

import { useState, useEffect, useCallback } from 'react';
import { useT } from '@/lib/i18n';

export interface SymptomData {
  selected_symptoms: string[];
  duration: string;
  pain_level: number;
  risk_factors: string[];
  followup_answers: Record<string, string>;
  additional_notes: string;
}

interface Props {
  scanType: 'oral' | 'skin' | 'other';
  onChange: (data: SymptomData) => void;
  onComplete: (complete: boolean) => void;
}

const ORAL_SYMPTOMS = [
  'White patches', 'Red patches', 'Non-healing mouth sore',
  'Lump or thickening', 'Difficulty swallowing', 'Jaw or tongue pain',
  'Bleeding gums', 'Ear pain', 'Loose teeth', 'Voice changes',
  'Numbness in mouth', 'Persistent bad breath',
];
const SKIN_SYMPTOMS = [
  'New mole or growth', 'Existing mole changing', 'Irregular border',
  'Multiple colours in lesion', 'Spontaneous bleeding', 'Itching or burning',
  'Lesion larger than 6mm', 'Non-healing sore', 'Shiny or pearly bump',
  'Scaly or crusty patch', 'Dark streak under nail', 'Raised red patch',
];
const DURATIONS = [
  { value: '< 1 week', sub: 'Just started' },
  { value: '1–4 weeks', sub: 'A few weeks' },
  { value: '1–3 months', sub: 'Several months' },
  { value: '> 3 months', sub: 'Long-standing' },
];
const ORAL_RISKS = ['Tobacco / cigarettes', 'Alcohol use', 'Betel nut / paan', 'Poor dental hygiene', 'HPV history', 'Family history of cancer'];
const SKIN_RISKS = ['Heavy sun exposure', 'History of severe sunburns', 'Fair / light skin', 'Family history of skin cancer', 'Previous skin cancer', 'Immunosuppression'];

const chip = (active: boolean, danger = false): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 600,
  border: `2px solid ${active ? (danger ? 'var(--warn)' : 'var(--brand)') : 'var(--line)'}`,
  background: active ? (danger ? 'var(--warn-soft)' : 'var(--brand-soft)') : 'var(--surface)',
  color: active ? (danger ? '#8a6b00' : 'var(--brand-dark)') : 'var(--ink-soft)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.12s',
});

export default function SymptomQuestionnaire({ scanType, onChange, onComplete }: Props) {
  const T = useT();
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [painLevel, setPainLevel] = useState(0);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([]);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loadingFollowup, setLoadingFollowup] = useState(false);
  const [followupError, setFollowupError] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const symptoms = scanType === 'skin' ? SKIN_SYMPTOMS : ORAL_SYMPTOMS;
  const risks = scanType === 'skin' ? SKIN_RISKS : ORAL_RISKS;

  const toggle = <T2,>(arr: T2[], val: T2): T2[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const notifyParent = useCallback(() => {
    onChange({ selected_symptoms: selectedSymptoms, duration, pain_level: painLevel, risk_factors: riskFactors, followup_answers: followupAnswers, additional_notes: additionalNotes });
  }, [selectedSymptoms, duration, painLevel, riskFactors, followupAnswers, additionalNotes, onChange]);

  useEffect(() => { notifyParent(); }, [notifyParent]);

  // Check completeness: step 3 reached + all followup questions answered
  useEffect(() => {
    if (step < 3 || followupQuestions.length === 0) {
      onComplete(false);
      return;
    }
    const allAnswered = followupQuestions.every((_, i) => (followupAnswers[`q${i}`] ?? '').trim() !== '');
    onComplete(allAnswered);
  }, [step, followupQuestions, followupAnswers, onComplete]);

  const fetchFollowup = async () => {
    setLoadingFollowup(true);
    setFollowupError(false);
    try {
      const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';
      const res = await fetch(`${BACKEND_URL}/symptoms/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_type: scanType, selected_symptoms: selectedSymptoms, duration, pain_level: painLevel, risk_factors: riskFactors }),
      });
      const data = await res.json();
      setFollowupQuestions(data.questions ?? []);
    } catch {
      setFollowupError(true);
      setFollowupQuestions([
        'Have you seen a doctor about these symptoms before?',
        'Are these symptoms getting worse, better, or staying the same?',
        'Do you have a family history of cancer?',
      ]);
    } finally {
      setLoadingFollowup(false);
    }
  };

  const goStep3 = async () => {
    setStep(3);
    if (followupQuestions.length === 0) await fetchFollowup();
  };

  const allFollowupAnswered = followupQuestions.length > 0 &&
    followupQuestions.every((_, i) => (followupAnswers[`q${i}`] ?? '').trim() !== '');

  const stepStyle = (s: number): React.CSSProperties => ({
    flex: 1, height: '6px', borderRadius: '3px',
    background: step >= s ? 'var(--brand)' : 'var(--line)',
    transition: 'background 0.3s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Step bar */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div style={stepStyle(1)} />
        <div style={stepStyle(2)} />
        <div style={stepStyle(3)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 700 }}>
        <span style={{ color: step === 1 ? 'var(--brand)' : undefined }}>{T.sym_step_symptoms}</span>
        <span style={{ color: step === 2 ? 'var(--brand)' : undefined }}>{T.sym_step_details}</span>
        <span style={{ color: step === 3 ? 'var(--brand)' : undefined }}>{T.sym_step_ai}</span>
      </div>

      {/* Step 1: Symptom chips */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontWeight: 700, marginBottom: '2px' }}>{T.sym_which}</p>
          <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '-8px' }}>{T.sym_which_sub}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {symptoms.map((s) => (
              <button key={s} type="button" style={chip(selectedSymptoms.includes(s))}
                onClick={() => setSelectedSymptoms(toggle(selectedSymptoms, s))}>
                {selectedSymptoms.includes(s) && '✓ '}{s}
              </button>
            ))}
          </div>
          {selectedSymptoms.length > 0 && (
            <div style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: 700 }}>
              {T.sym_selected(selectedSymptoms.length)}
            </div>
          )}
          <button type="button" className="btn outline" onClick={() => setStep(2)}>
            {selectedSymptoms.length === 0 ? T.sym_skip : T.sym_next}
          </button>
        </div>
      )}

      {/* Step 2: Duration, Pain, Risk */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <p style={{ fontWeight: 700, marginBottom: '10px' }}>{T.sym_how_long}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {DURATIONS.map((d) => (
                <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                  style={{ border: `2px solid ${duration === d.value ? 'var(--brand)' : 'var(--line)'}`, background: duration === d.value ? 'var(--brand-soft)' : 'var(--surface)', borderRadius: '14px', padding: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: duration === d.value ? 'var(--brand-dark)' : 'var(--ink)' }}>{d.value}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{d.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ fontWeight: 700 }}>{T.sym_pain}</p>
              <span style={{ fontWeight: 800, color: painLevel >= 7 ? 'var(--danger)' : painLevel >= 4 ? 'var(--warn)' : 'var(--brand)' }}>
                {painLevel}/10
              </span>
            </div>
            <input type="range" min={0} max={10} value={painLevel} onChange={(e) => setPainLevel(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--brand)', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              <span>None</span><span>Moderate</span><span>Severe</span>
            </div>
          </div>

          <div>
            <p style={{ fontWeight: 700, marginBottom: '8px' }}>{T.sym_risks}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {risks.map((r) => (
                <button key={r} type="button" style={chip(riskFactors.includes(r), true)}
                  onClick={() => setRiskFactors(toggle(riskFactors, r))}>
                  {riskFactors.includes(r) && '✓ '}{r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn ghost" style={{ border: '2px solid var(--line)' }} onClick={() => setStep(1)}>{T.sym_back}</button>
            <button type="button" className="btn accent-btn" style={{ flex: 1 }} onClick={goStep3}>
              {T.sym_get_ai}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Gemini follow-up (mandatory) */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--accent-soft)', borderRadius: '14px', padding: '12px 16px' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>{T.sym_ai_title}</p>
              <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{T.sym_ai_sub}</p>
            </div>
            {allFollowupAnswered && (
              <span style={{ marginLeft: 'auto', background: 'var(--brand)', color: '#fff', borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>
                {T.sym_complete_badge}
              </span>
            )}
          </div>

          {followupError && (
            <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#8a6b00' }}>
              {T.sym_offline_warn}
            </div>
          )}

          {loadingFollowup ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-soft)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
              <p style={{ fontWeight: 600 }}>{T.sym_ai_loading}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {followupQuestions.map((q, i) => {
                const answered = (followupAnswers[`q${i}`] ?? '').trim() !== '';
                return (
                  <div key={i} style={{ background: 'var(--bg)', borderRadius: '14px', padding: '14px', border: `1.5px solid ${showValidation && !answered ? 'var(--danger)' : answered ? 'var(--brand)' : 'var(--line)'}` }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      Q{i + 1}: {q}
                      {answered && <span style={{ color: 'var(--brand)', fontSize: '14px' }}>✓</span>}
                      {showValidation && !answered && <span style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 600 }}>Required</span>}
                    </label>
                    <input
                      value={followupAnswers[`q${i}`] ?? ''}
                      placeholder={T.sym_answer_placeholder}
                      onChange={(e) => {
                        setFollowupAnswers((prev) => ({ ...prev, [`q${i}`]: e.target.value }));
                        setShowValidation(false);
                      }}
                      style={{ width: '100%', border: `1.5px solid ${showValidation && !answered ? 'var(--danger)' : 'var(--line)'}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                );
              })}

              <div style={{ background: 'var(--bg)', borderRadius: '14px', padding: '14px', border: '1px solid var(--line)' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-soft)', display: 'block', marginBottom: '8px' }}>
                  {T.sym_extra}
                </label>
                <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={2} placeholder={T.sym_extra_placeholder}
                  style={{ width: '100%', border: '1.5px solid var(--line)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--ink)', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Mandatory notice */}
              {!allFollowupAnswered && (
                <div style={{ background: 'var(--warn-soft)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#8a6b00', border: '1px solid var(--warn)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠</span>
                  <span>{T.sym_complete_required}</span>
                </div>
              )}
            </div>
          )}

          {/* Summary chips */}
          {selectedSymptoms.length + riskFactors.length > 0 && (
            <div style={{ background: 'var(--brand-soft)', borderRadius: '14px', padding: '12px 14px', border: '1px solid var(--line)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{T.sym_profile}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedSymptoms.map((s) => <span key={s} style={chip(true) as React.CSSProperties}>{s}</span>)}
                {duration && <span style={chip(true) as React.CSSProperties}>{duration}</span>}
                {painLevel > 0 && <span style={chip(true, painLevel >= 7) as React.CSSProperties}>Pain {painLevel}/10</span>}
                {riskFactors.map((r) => <span key={r} style={chip(true, true) as React.CSSProperties}>{r}</span>)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn ghost" style={{ border: '2px solid var(--line)' }} onClick={() => setStep(2)}>
              {T.sym_back}
            </button>
            {!allFollowupAnswered && (
              <button
                type="button"
                className="btn outline"
                style={{ flex: 1, fontSize: '13px' }}
                onClick={() => setShowValidation(true)}
              >
                Check answers ↑
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
