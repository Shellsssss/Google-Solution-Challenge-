'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/shared/Navbar';
import ImageUploader from '@/components/scan/ImageUploader';
import ScanTypeSelector from '@/components/scan/ScanTypeSelector';
import LanguageSelector from '@/components/scan/LanguageSelector';
import ResultCard from '@/components/scan/ResultCard';
import AnalysisProgress from '@/components/scan/AnalysisProgress';
import SymptomQuestionnaire, { type SymptomData } from '@/components/scan/SymptomQuestionnaire';
import { Button } from '@/components/ui/Button';
import { analyzeBase64 } from '@/lib/api';
import { fileToBase64 } from '@/lib/utils';
import type { AnalysisResult, Language, ScanResult, ScanType } from '@/types';

const defaultSymptoms: SymptomData = {
  selected_symptoms: [],
  duration: '',
  pain_level: 0,
  risk_factors: [],
  followup_answers: {},
  additional_notes: '',
};

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scanType, setScanType] = useState<ScanType>('oral');
  const [language, setLanguage] = useState<Language>('en');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomData>(defaultSymptoms);
  const [showSymptoms, setShowSymptoms] = useState(false);

  const handleSymptomsChange = useCallback((data: SymptomData) => {
    setSymptoms(data);
  }, []);

  const buildSymptomsPayload = (): Record<string, string> | undefined => {
    const hasData =
      symptoms.selected_symptoms.length > 0 ||
      symptoms.duration ||
      symptoms.pain_level > 0 ||
      symptoms.risk_factors.length > 0 ||
      Object.values(symptoms.followup_answers).some(Boolean) ||
      symptoms.additional_notes;

    if (!hasData) return undefined;

    const parts: Record<string, string> = {};
    if (symptoms.selected_symptoms.length > 0)
      parts.symptoms = symptoms.selected_symptoms.join(', ');
    if (symptoms.duration)
      parts.duration = symptoms.duration;
    if (symptoms.pain_level > 0)
      parts.pain_level = `${symptoms.pain_level}/10`;
    if (symptoms.risk_factors.length > 0)
      parts.risk_factors = symptoms.risk_factors.join(', ');
    Object.entries(symptoms.followup_answers).forEach(([k, v]) => {
      if (v) parts[`followup_${k}`] = v;
    });
    if (symptoms.additional_notes)
      parts.additional_notes = symptoms.additional_notes;
    return parts;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await analyzeBase64(base64, scanType, buildSymptomsPayload());
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(
        msg.includes('fetch') || msg.includes('Failed')
          ? 'Backend offline. Run: cd backend && uvicorn main:app --reload'
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">AI Cancer Screening</h1>
          <p className="text-muted mt-1">Upload an image for instant AI-powered risk assessment</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Upload panel */}
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <h2 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest">1. Upload Image</h2>
              <ImageUploader onImageReady={setFile} onClear={() => setFile(null)} imageFile={file} />
            </div>

            {/* Step 2 */}
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <h2 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest">2. Select Scan Type</h2>
              <ScanTypeSelector value={scanType} onChange={setScanType} />
            </div>

            {/* Step 3 */}
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <h2 className="text-xs font-semibold text-white mb-4 uppercase tracking-widest">3. Result Language</h2>
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>

            {/* Step 4: Symptom Questionnaire */}
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <button
                type="button"
                onClick={() => setShowSymptoms(!showSymptoms)}
                className="flex items-center justify-between w-full text-left"
              >
                <div>
                  <h2 className="text-xs font-semibold text-white uppercase tracking-widest">4. Symptom Assessment</h2>
                  <p className="text-xs text-muted mt-0.5">Optional — helps Gemini give a more accurate diagnosis</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {symptoms.selected_symptoms.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
                      {symptoms.selected_symptoms.length} selected
                    </span>
                  )}
                  <span className="text-muted text-sm">{showSymptoms ? '▲' : '▼'}</span>
                </div>
              </button>

              {showSymptoms && (
                <div className="mt-5 border-t border-border pt-5">
                  <SymptomQuestionnaire
                    scanType={scanType === 'other' ? 'oral' : scanType}
                    onChange={handleSymptomsChange}
                  />
                </div>
              )}
            </div>

            {/* Analyze button */}
            <Button
              onClick={handleAnalyze}
              disabled={!file || loading}
              isLoading={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Analysing...' : 'Analyze Image'}
            </Button>

            {error && (
              <div className="rounded-xl bg-danger/10 border border-danger/30 p-4 text-sm text-danger font-mono">
                {error}
              </div>
            )}
          </div>

          {/* Right: Result panel */}
          <div>
            {!result && !loading && (
              <div className="bg-background-card rounded-2xl border border-border p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-background-secondary border border-border flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-2">Your results will appear here</p>
                <p className="text-muted text-sm">Upload an image and click Analyze to begin</p>
                <div className="flex gap-2 mt-6 flex-wrap justify-center">
                  {['TFLite Model', 'Gemini AI', 'Multilingual', '4 Languages'].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {loading && <AnalysisProgress />}
            {result && (
              <ResultCard
                result={result as unknown as ScanResult}
                language={language}
                centres={[]}
                onNewScan={() => { setResult(null); setFile(null); setSymptoms(defaultSymptoms); }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
