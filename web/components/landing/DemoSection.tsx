'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle, CheckCircle, XCircle, Smartphone } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { analyzeBase64 } from '@/lib/api';
import { fileToBase64, formatConfidence } from '@/lib/utils';
import type { AnalysisResult, Language } from '@/types';

// Lazy-load the heavy phone modal
const PhoneDemoModal = dynamic(() => import('./PhoneDemoModal'), { ssr: false });

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
];

export default function DemoSection() {
  const [phoneOpen, setPhoneOpen]   = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string | null>(null);
  const [lang, setLang]             = useState<Language>('en');
  const [result, setResult]         = useState<AnalysisResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setPreview(URL.createObjectURL(accepted[0]));
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10_000_000,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await analyzeBase64(base64, 'oral');
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(
        msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')
          ? 'Backend not running — start with: cd backend && uvicorn main:app --reload'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const getExplanation = (r: AnalysisResult) => {
    const exp = r.explanation;
    if (lang === 'hi' && exp.hi) return exp.hi;
    if (lang === 'ta' && exp.ta) return exp.ta;
    if (lang === 'te' && exp.te) return exp.te;
    return exp.en;
  };

  return (
    <>
      {phoneOpen && <PhoneDemoModal onClose={() => setPhoneOpen(false)} />}

      <section id="demo" className="py-20 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Try Live Demo
            </h2>
            <p className="text-muted text-lg mb-8">
              Upload a real image and see the AI analyze it in seconds
            </p>

            {/* ── Phone Demo CTA ── */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-background-card border border-border rounded-2xl p-6 mb-2">
              {/* Mini phone preview */}
              <div className="flex-shrink-0 w-16 h-28 rounded-2xl bg-background-primary border-2 border-border-light relative overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-border rounded-full" />
                <div className="absolute inset-x-2 top-6 bottom-2 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <span className="text-lg">🦷</span>
                </div>
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-white text-lg mb-1">Interactive Phone Demo</p>
                <p className="text-muted text-sm mb-3">
                  Run the full JanArogya app — scan, results, maps — inside a live phone frame. No install needed.
                </p>
                <button
                  onClick={() => setPhoneOpen(true)}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 text-sm"
                >
                  <Smartphone className="h-4 w-4" />
                  Launch Phone Demo
                </button>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4 max-w-5xl mx-auto mb-10">
            <div className="flex-1 h-px bg-border" />
            <p className="text-muted text-sm font-medium">or use quick web demo below</p>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Web demo ── */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Left: Upload panel */}
            <div className="flex flex-col gap-4">
              <div
                {...getRootProps()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragActive
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-border-light hover:bg-background-card'
                  }
                `}
              >
                <input {...getInputProps()} />
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                ) : (
                  <div className="py-4">
                    <Upload className="h-10 w-10 text-muted mx-auto mb-3" />
                    <p className="text-white font-medium">Drop image here or click to browse</p>
                    <p className="text-muted text-sm mt-1">JPG, PNG, WEBP up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Language selector */}
              <div>
                <label className="text-sm text-muted mb-2 block">Result Language</label>
                <div className="flex gap-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        lang === l.code
                          ? 'bg-accent text-white'
                          : 'bg-background-card text-muted hover:text-white border border-border'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleAnalyze} disabled={!file || loading}
                isLoading={loading} size="lg" className="w-full">
                {loading ? 'Analyzing with AI...' : 'Analyze Image'}
              </Button>

              {error && (
                <div className="rounded-xl bg-danger/10 border border-danger/30 p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-danger font-medium">Analysis failed</p>
                    <p className="text-xs text-muted mt-1 font-mono">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Result panel */}
            <div className="flex items-center justify-center">
              {!result && !loading && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-background-card border border-border flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-muted" />
                  </div>
                  <p className="text-muted">Upload an image and click Analyze to see results</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-16">
                  <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto mb-4" />
                  <p className="text-white font-medium">Analyzing with AI...</p>
                  <p className="text-muted text-sm mt-1">Gemini Vision + TFLite</p>
                </div>
              )}

              {result && (
                <div className="w-full bg-background-card rounded-2xl border border-border p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <Badge risk={result.risk_level} className="text-sm px-4 py-1.5" />
                    <span className="text-muted text-sm">{formatConfidence(result.confidence)} confidence</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>Model confidence</span>
                      <span>{formatConfidence(result.confidence)}</span>
                    </div>
                    <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          result.risk_level === 'HIGH_RISK' ? 'bg-danger' :
                          result.risk_level === 'LOW_RISK'  ? 'bg-success' : 'bg-warning'
                        }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-background-secondary rounded-xl p-4">
                    <p className="text-sm text-white leading-relaxed">{getExplanation(result)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {result.risk_level === 'LOW_RISK'  && <CheckCircle className="h-4 w-4 text-success" />}
                    {result.risk_level === 'HIGH_RISK' && <AlertCircle className="h-4 w-4 text-danger" />}
                    {result.risk_level === 'INVALID'   && <XCircle     className="h-4 w-4 text-warning" />}
                    <p className="text-xs text-muted">
                      {result.disclaimer ?? 'This is an AI-assisted screening. Consult a doctor for diagnosis.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
