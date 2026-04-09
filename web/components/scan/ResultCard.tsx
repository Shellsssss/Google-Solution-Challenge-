'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Download, RotateCcw, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { generateReport } from '@/lib/api';
import { formatConfidence } from '@/lib/utils';
import type { ScanResult, Language, Centre } from '@/types';

interface ResultCardProps {
  result: ScanResult;
  language: Language;
  centres: Centre[];
  onNewScan: () => void;
}

export default function ResultCard({ result, language, centres, onNewScan }: ResultCardProps) {
  const [downloading, setDownloading] = useState(false);

  const getExplanation = () => {
    const exp = result.explanation;
    if (language === 'hi' && exp.hi) return exp.hi;
    if (language === 'ta' && exp.ta) return exp.ta;
    if (language === 'te' && exp.te) return exp.te;
    return exp.en;
  };

  const riskIcon = () => {
    if (result.risk_level === 'LOW_RISK') return <CheckCircle className="h-6 w-6 text-success" />;
    if (result.risk_level === 'HIGH_RISK') return <AlertCircle className="h-6 w-6 text-danger" />;
    return <XCircle className="h-6 w-6 text-warning" />;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const report = await generateReport({
        risk_level: result.risk_level,
        confidence: result.confidence,
        explanation: getExplanation(),
        scan_type: result.scan_type,
      });

      // Trigger real file download
      const a = document.createElement('a');
      a.href = report.download_url;
      a.download = report.filename || 'JanArogya_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Report downloaded!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate report';
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main result card */}
      <div className="bg-background-card rounded-2xl border border-border p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {riskIcon()}
            <div>
              <Badge risk={result.risk_level} className="text-sm px-3 py-1" />
              <p className="text-xs text-muted mt-1">
                {result.scan_type ? `${result.scan_type} screening` : 'Cancer screening'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{formatConfidence(result.confidence)}</div>
            <div className="text-xs text-muted">confidence</div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mb-4">
          <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                result.risk_level === 'HIGH_RISK'
                  ? 'bg-danger'
                  : result.risk_level === 'LOW_RISK'
                  ? 'bg-success'
                  : 'bg-warning'
              }`}
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-background-secondary rounded-xl p-4 mb-4">
          <p className="text-sm text-white leading-relaxed">{getExplanation()}</p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-warning/5 border border-warning/20 p-3">
          <p className="text-xs text-warning/80">
            {typeof result.disclaimer === 'object' && result.disclaimer !== null
              ? (result.disclaimer as Record<string, string>)[language] ??
                (result.disclaimer as Record<string, string>).en ??
                'This is an AI-assisted screening tool. Results must be confirmed by a qualified healthcare professional.'
              : result.disclaimer ??
                'This is an AI-assisted screening tool. Results must be confirmed by a qualified healthcare professional.'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          variant="secondary"
          className="flex-1"
        >
          {downloading ? (
            <><Spinner size="sm" /> Generating...</>
          ) : (
            <><Download className="h-4 w-4" /> Download PDF Report</>
          )}
        </Button>
        <Button onClick={onNewScan} variant="ghost" className="flex-1">
          <RotateCcw className="h-4 w-4" />
          New Scan
        </Button>
      </div>

      {/* Nearby centres */}
      {centres.length > 0 && (
        <div className="bg-background-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-white">Nearest Screening Centres</h3>
          </div>
          <div className="space-y-2">
            {centres.slice(0, 3).map((c) => (
              <div key={c.centre_id} className="flex items-start justify-between text-sm">
                <div>
                  <p className="text-white font-medium">{c.name}</p>
                  <p className="text-muted text-xs">{c.city}, {c.state}</p>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="text-accent text-xs hover:underline shrink-0"
                >
                  {c.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
