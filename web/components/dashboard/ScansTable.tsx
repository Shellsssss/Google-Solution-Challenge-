'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { deleteScan, generateReport } from '@/lib/api';
import { formatDate, formatConfidence } from '@/lib/utils';
import type { RecentScan } from '@/types';

interface ScansTableProps {
  scans: RecentScan[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const PAGE_SIZE = 10;

export default function ScansTable({
  scans,
  total,
  page,
  onPageChange,
  onRefresh,
  isLoading,
}: ScansTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scan?')) return;
    setDeletingId(id);
    try {
      await deleteScan(id);
      toast.success('Scan deleted');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (scan: RecentScan) => {
    setDownloadingId(scan.scan_id);
    try {
      const report = await generateReport({
        scan_id: scan.scan_id,
        risk_level: scan.risk_level,
        confidence: scan.confidence,
        scan_type: scan.scan_type,
      });
      window.open(report.download_url, '_blank');
      toast.success('Report downloading…');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Report generation failed');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p>No scans found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background-secondary border-b border-border">
              <th className="text-left px-4 py-3 text-muted font-medium">Date</th>
              <th className="text-left px-4 py-3 text-muted font-medium">Type</th>
              <th className="text-left px-4 py-3 text-muted font-medium">Risk</th>
              <th className="text-left px-4 py-3 text-muted font-medium">Confidence</th>
              <th className="text-left px-4 py-3 text-muted font-medium">Language</th>
              <th className="text-right px-4 py-3 text-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, i) => (
              <tr
                key={scan.scan_id}
                className={`border-b border-border last:border-0 hover:bg-background-secondary/50 transition-colors ${
                  i % 2 === 0 ? '' : 'bg-background-secondary/20'
                }`}
              >
                <td className="px-4 py-3 text-muted">{formatDate(scan.created_at)}</td>
                <td className="px-4 py-3 text-white capitalize">{scan.scan_type}</td>
                <td className="px-4 py-3">
                  <Badge risk={scan.risk_level} />
                </td>
                <td className="px-4 py-3 text-white">{formatConfidence(scan.confidence)}</td>
                <td className="px-4 py-3">
                  <span className="uppercase text-xs font-medium text-muted bg-background-secondary px-2 py-0.5 rounded">
                    {scan.language}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Download PDF"
                      isLoading={downloadingId === scan.scan_id}
                      onClick={() => handleDownload(scan)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      isLoading={deletingId === scan.scan_id}
                      onClick={() => handleDelete(scan.scan_id)}
                      className="hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted">
            Page {page + 1} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
