import { getToken } from './auth';
import type {
  LoginResponse,
  RegisterResponse,
  DashboardStats,
  PaginatedScans,
  ScanResult,
  AnalysisResult,
  Report,
  GenerateReportRequest,
  Centre,
  DoctorQueueItem,
  DoctorReview,
  AdminUser,
  SystemHealth,
  HeatmapPoint,
  AnalyticsTrend,
  AnalyticsAccuracy,
  AnalyticsGeography,
  Language,
  ScanType,
  User,
} from '@/types';

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';

// ─── Helper ─────────────────────────────────────────────
function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function authHeadersNoContentType(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json() as { detail?: string; message?: string };
      msg = err.detail ?? err.message ?? msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(res);
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: 'patient' | 'doctor' | 'admin'
): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function getCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  return handleResponse<User>(res);
}

export async function logoutApi(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await handleResponse<{ success: boolean }>(res);
}

// ─── Dashboard ──────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`, {
    headers: authHeaders(),
  });
  return handleResponse<DashboardStats>(res);
}

export interface RecentScansParams {
  limit?: number;
  offset?: number;
  risk_level?: string;
  scan_type?: string;
}

export async function getRecentScans(params: RecentScansParams = {}): Promise<PaginatedScans> {
  const qs = new URLSearchParams();
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  if (params.risk_level) qs.set('risk_level', params.risk_level);
  if (params.scan_type) qs.set('scan_type', params.scan_type);
  const res = await fetch(`${API_BASE}/dashboard/recent-scans?${qs.toString()}`, {
    headers: authHeaders(),
  });
  return handleResponse<PaginatedScans>(res);
}

export async function getHeatmap(): Promise<HeatmapPoint[]> {
  const res = await fetch(`${API_BASE}/dashboard/heatmap`, {
    headers: authHeaders(),
  });
  return handleResponse<HeatmapPoint[]>(res);
}

// ─── Scans ──────────────────────────────────────────────
export async function analyzeScan(formData: FormData): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scan/analyze`, {
    method: 'POST',
    headers: authHeadersNoContentType(),
    body: formData,
  });
  return handleResponse<ScanResult>(res);
}

export async function analyzeBase64(
  image_base64: string,
  scan_type: ScanType,
  symptoms?: Record<string, string>,
  language: Language = 'en'
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64, scan_type, symptoms: symptoms ?? null, language }),
  });
  return handleResponse<AnalysisResult>(res);
}

export async function getScan(id: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scan/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse<ScanResult>(res);
}

export async function deleteScan(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/scan/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse<{ success: boolean }>(res);
}

// ─── Reports ────────────────────────────────────────────
export async function generateReport(data: GenerateReportRequest): Promise<{ report_id: string; download_url: string; filename: string }> {
  const body = {
    risk_level: data.risk_level,
    confidence: data.confidence ?? 0,
    scan_type: data.scan_type ?? 'oral',
    explanation_en: data.explanation ?? '',
  };
  const res = await fetch(`${API_BASE}/report/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await handleResponse<{ report_id: string; download_url: string; filename: string }>(res);
  // Make download_url absolute so the browser hits the backend directly
  if (result.download_url && !result.download_url.startsWith('http')) {
    result.download_url = `http://localhost:8000${result.download_url}`;
  }
  return result;
}

export async function downloadReport(id: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/report/download/${id}`, {
    headers: authHeadersNoContentType(),
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.blob();
}

export async function listReports(): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/report/list`, {
    headers: authHeaders(),
  });
  return handleResponse<Report[]>(res);
}

// ─── Centres ────────────────────────────────────────────
export async function getCentresNearby(lat: number, lng: number, radius_km = 50, limit = 10): Promise<Centre[]> {
  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_km: String(radius_km),
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE}/centres/nearby?${qs.toString()}`);
  return handleResponse<Centre[]>(res);
}

export async function getAllCentres(): Promise<Centre[]> {
  const res = await fetch(`${API_BASE}/centres/all`);
  return handleResponse<Centre[]>(res);
}

// ─── Doctor ─────────────────────────────────────────────
export async function getDoctorQueue(): Promise<DoctorQueueItem[]> {
  const res = await fetch(`${API_BASE}/doctor/queue`, {
    headers: authHeaders(),
  });
  return handleResponse<DoctorQueueItem[]>(res);
}

export async function getDoctorReviewed(): Promise<DoctorQueueItem[]> {
  const res = await fetch(`${API_BASE}/doctor/reviewed`, {
    headers: authHeaders(),
  });
  return handleResponse<DoctorQueueItem[]>(res);
}

export async function submitDoctorReview(
  scan_id: string,
  data: Omit<DoctorReview, 'scan_id'>
): Promise<void> {
  const res = await fetch(`${API_BASE}/doctor/review/${scan_id}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  await handleResponse<{ success: boolean }>(res);
}

// ─── Admin ──────────────────────────────────────────────
export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: authHeaders(),
  });
  return handleResponse<AdminUser[]>(res);
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_BASE}/admin/system-health`, {
    headers: authHeaders(),
  });
  return handleResponse<SystemHealth>(res);
}

// ─── Analytics ──────────────────────────────────────────
export async function getAnalyticsTrends(): Promise<AnalyticsTrend[]> {
  const res = await fetch(`${API_BASE}/analytics/trends`, {
    headers: authHeaders(),
  });
  return handleResponse<AnalyticsTrend[]>(res);
}

export async function getAnalyticsAccuracy(): Promise<AnalyticsAccuracy[]> {
  const res = await fetch(`${API_BASE}/analytics/accuracy`, {
    headers: authHeaders(),
  });
  return handleResponse<AnalyticsAccuracy[]>(res);
}

export async function getAnalyticsGeography(): Promise<AnalyticsGeography[]> {
  const res = await fetch(`${API_BASE}/analytics/geography`, {
    headers: authHeaders(),
  });
  return handleResponse<AnalyticsGeography[]>(res);
}

// ─── Chat ────────────────────────────────────────────────
export async function chat(
  message: string,
  history: { role: string; content: string }[],
  language: Language = 'en'
): Promise<{ response: string }> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, language }),
  });
  return handleResponse<{ response: string }>(res);
}

// ─── Health ──────────────────────────────────────────────
export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
  return handleResponse<{ status: string }>(res);
}
