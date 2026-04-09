// ─── Auth ───────────────────────────────────────────────
export interface User {
  user_id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  created_at?: string;
  scan_count?: number;
}

export interface LoginResponse {
  user_id: string;
  token: string;
  refresh_token: string;
  user_profile?: User;
}

export interface RegisterResponse {
  user_id: string;
  token: string;
  refresh_token: string;
}

// ─── Scans ──────────────────────────────────────────────
export type RiskLevel = 'LOW_RISK' | 'HIGH_RISK' | 'INVALID' | 'MODERATE_RISK';
export type ScanType = 'oral' | 'skin' | 'other';
export type Language = 'en' | 'hi' | 'ta' | 'te';

export interface ScanResult {
  scan_id?: string;
  risk_level: RiskLevel;
  confidence: number;
  explanation: {
    en: string;
    hi?: string;
    ta?: string;
    te?: string;
  };
  disclaimer?: string;
  scan_type?: ScanType;
  language?: Language;
  created_at?: string;
  patient_id?: string;
  image_url?: string;
}

export interface AnalysisResult {
  risk_level: RiskLevel;
  confidence: number;
  explanation: {
    en: string;
    hi?: string;
    ta?: string;
    te?: string;
  };
  disclaimer?: string;
}

export interface RecentScan {
  scan_id: string;
  scan_type: ScanType;
  risk_level: RiskLevel;
  confidence: number;
  language: Language;
  created_at: string;
  patient_id?: string;
  report_url?: string;
}

export interface PaginatedScans {
  scans: RecentScan[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Dashboard ──────────────────────────────────────────
export interface ScansByDay {
  date: string;
  count: number;
  high_risk?: number;
}

export interface DashboardStats {
  total_scans: number;
  high_risk_count: number;
  low_risk_count: number;
  invalid_count: number;
  average_confidence: number;
  scans_by_day: ScansByDay[];
  scans_by_type: {
    oral: number;
    skin: number;
    other: number;
  };
  scans_by_language: {
    en: number;
    hi: number;
    ta: number;
    te: number;
  };
  reports_generated?: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  count: number;
  risk_level: RiskLevel;
}

// ─── Reports ────────────────────────────────────────────
export interface Report {
  report_id: string;
  scan_id?: string;
  scan_type?: ScanType;
  risk_level?: RiskLevel;
  created_at: string;
  download_url: string;
  filename: string;
}

export interface GenerateReportRequest {
  scan_id?: string;
  risk_level?: RiskLevel;
  confidence?: number;
  explanation?: string;
  scan_type?: ScanType;
}

// ─── Centres ────────────────────────────────────────────
export interface Centre {
  centre_id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  type: string;
  lat?: number;
  lng?: number;
  address?: string;
  distance_km?: number;
}

// ─── Doctor ─────────────────────────────────────────────
export type Recommendation = 'immediate_referral' | 'follow_up_2weeks' | 'follow_up_1month' | 'lifestyle_advice' | 'no_action';

export interface DoctorReview {
  review_id?: string;
  scan_id: string;
  notes: string;
  recommendation: Recommendation;
  follow_up_date?: string;
  reviewed_at?: string;
  doctor_id?: string;
}

export interface DoctorQueueItem {
  id: string;           // same as scan_id, normalized
  scan_id: string;
  patient_id: string;
  scan_type: ScanType;
  risk_level: RiskLevel;
  confidence: number;
  created_at: string;
  reviewed?: boolean;
  doctor_recommendation?: string;
  follow_up_date?: string;
  review?: DoctorReview;
}

// ─── Admin ──────────────────────────────────────────────
export interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  scan_count: number;
  created_at: string;
}

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'down';
  latency_ms?: number;
  message?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime_seconds: number;
  services: {
    api: ServiceStatus;
    gemini: ServiceStatus;
    tflite: ServiceStatus;
    firebase?: ServiceStatus;
  };
  timestamp?: string;
}

// ─── Analytics ──────────────────────────────────────────
export interface AnalyticsTrend {
  period: string;
  scans: number;
  high_risk: number;
  accuracy?: number;
}

export interface AnalyticsAccuracy {
  model: string;
  accuracy: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
}

export interface AnalyticsGeography {
  state: string;
  scan_count: number;
  high_risk_count: number;
}

// ─── API Error ──────────────────────────────────────────
export interface ApiError {
  detail?: string;
  message?: string;
  status?: number;
}

// ─── Store ──────────────────────────────────────────────
export interface AppStore {
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  lastScanResult: ScanResult | null;
  setLastScanResult: (result: ScanResult) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}
