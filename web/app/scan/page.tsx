'use client';

import { useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import ImageUploader from '@/components/scan/ImageUploader';
import ScanTypeSelector from '@/components/scan/ScanTypeSelector';
import LanguageSelector from '@/components/scan/LanguageSelector';
import ResultCard from '@/components/scan/ResultCard';
import AnalysisProgress from '@/components/scan/AnalysisProgress';
import { Button } from '@/components/ui/Button';
import { analyzeBase64 } from '@/lib/api';
import { fileToBase64 } from '@/lib/utils';
import type { AnalysisResult, Language, ScanResult, ScanType } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scanType, setScanType] = useState<ScanType>('oral');
  const [language, setLanguage] = useState<Language>('en');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [symptoms, setSymptoms] = useState({ q1: '', q2: '', q3: '' });

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const timer = setInterval(() => {}, 1800);
      const base64 = await fileToBase64(file);
      const symptomsPayload = Object.values(symptoms).filter(Boolean).length > 0
        ? symptoms : undefined;
      const res = await analyzeBase64(base64, scanType, symptomsPayload ? [
        symptoms.q1 && `Symptoms: ${symptoms.q1}`,
        symptoms.q2 && `Duration: ${symptoms.q2}`,
        symptoms.q3 && `Pain: ${symptoms.q3}`,
      ].filter(Boolean) as string[] : []);
      clearInterval(timer);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg.includes('fetch') ? 'Backend offline. Run: cd backend && uvicorn main:app --reload' : msg);
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
          <div className="space-y-5">
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">1. Upload Image</h2>
              <ImageUploader onImageReady={setFile} onClear={() => setFile(null)} imageFile={file} />
            </div>
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">2. Select Type</h2>
              <ScanTypeSelector value={scanType} onChange={setScanType} />
            </div>
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">3. Result Language</h2>
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>
            {/* Optional symptoms */}
            <div className="bg-background-card rounded-2xl border border-border p-6">
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="flex items-center justify-between w-full text-sm font-semibold text-white"
              >
                <span>4. Add Symptoms (Optional)</span>
                {showQuestions ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
              </button>
              {showQuestions && (
                <div className="mt-4 space-y-3">
                  {[
                    { key: 'q1', label: 'What symptoms are you experiencing?' },
                    { key: 'q2', label: 'How long have you had this?' },
                    { key: 'q3', label: 'Any pain or discomfort?' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-muted block mb-1">{label}</label>
                      <input
                        value={symptoms[key as keyof typeof symptoms]}
                        onChange={(e) => setSymptoms((s) => ({ ...s, [key]: e.target.value }))}
                        className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
                        placeholder="Type here..."
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={!file || loading}
              isLoading={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-2">Your results will appear here</p>
                <p className="text-muted text-sm">Upload an image and click Analyze to begin</p>
                <div className="flex gap-2 mt-6">
                  {['Fast', 'Secure', 'Multilingual'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {loading && <AnalysisProgress />}
            {result && <ResultCard result={result as unknown as ScanResult} language={language} centres={[]} onNewScan={() => { setResult(null); setFile(null); }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
