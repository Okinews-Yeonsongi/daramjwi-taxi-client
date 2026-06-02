// lib/types.ts
// daramjwi-taxi-server 의 라우트 핸들러 응답 형태를 그대로 반영합니다.
// (docs/FRONTEND_HANDOFF.md + app/api/* 기준)

export type LocationCategory = "cheongsanmyeon" | "eupnae";

/** DB 원본 상태값. 화면에서는 effective_status 를 쓰세요. */
export type ReservationStatus =
  | "waiting" // 신청만 됨, 기사님 확정 대기
  | "confirmed" // 기사님 확정됨
  | "cancelled" // 취소됨
  | "completed"; // 지난 슬롯 (effective_status 로만 계산)

export type VehicleCode = "A" | "B";

export type AdminTab = "waiting" | "confirmed" | "cancelled";

/* ───────── 마스터 데이터 ───────── */

export interface Location {
  id: number;
  category: LocationCategory;
  name: string;
  emoji: string | null;
  display_order: number;
}

export interface TimeSlot {
  hour: number; // 9 ~ 18
  label: string; // "오전 9시"
}

/* ───────── 인증/프로필 ───────── */

export interface AuthMe {
  user: { id: string; phone: string | null };
  profile: {
    id: string;
    name: string;
    phone: string | null;
    role: string; // "admin" | "resident" | ...
    status?: string;
  } | null;
  needsOnboarding: boolean;
}

export interface DevLoginResult {
  access_token: string;
  user: { id: string; role: string; name: string; phone: string };
}

/* ───────── 기사님 대시보드 ───────── */

export interface AdminDashboard {
  date: string; // YYYY-MM-DD (KST 오늘)
  fare: number;
  today: {
    waiting: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    confirmed_persons: number;
  };
  pending_total: number; // 오늘 이후 미처리 대기 총량
  limits: {
    daily: { used: number; limit: number; remaining: number };
    monthly: { used: number; limit: number; remaining: number };
  };
}

/* ───────── 기사님 예약 목록 항목 ───────── */

export interface AdminReservation {
  id: number;
  reservation_date: string; // YYYY-MM-DD
  hour: number;
  departure_minute: number; // 합쳐진 건은 분 단위
  time_label: string | null; // "오전 10시 30분"
  persons: number;
  status: ReservationStatus;
  effective_status: ReservationStatus; // 지난 슬롯 → "completed"
  resident: {
    id: string | null;
    name: string | null;
    phone: string | null;
    is_guest: boolean; // true 면 전화 신청 (📞)
  };
  monthly_confirmed: number; // 이 신청자가 이번 달 확정 탑승한 횟수
  departure: Pick<Location, "id" | "name" | "emoji" | "category"> | null;
  arrival: Pick<Location, "id" | "name" | "emoji" | "category"> | null;
  vehicle_code: VehicleCode | null;
  cancel_reason: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

/* ───────── 오늘 운행 ───────── */

export interface TodayRun {
  hour: number;
  time_label: string;
  origin: LocationCategory;
  destination: LocationCategory;
  persons: number;
  seats_left: number;
}

/* ───────── 월 통계 ───────── */

export interface AdminStats {
  month: string; // YYYY-MM
  totals: { waiting: number; confirmed: number; cancelled: number; completed: number };
  confirmed_persons: number;
  confirmed_runs: number; // 확정 운행 횟수 (합승 1회)
  by_day: { date: string; runs: number }[];
}

/* ───────── 가용성 (전화 신청 시간 선택) ───────── */

export interface AvailabilitySlot {
  hour: number;
  remaining: number; // 0~4
  available: boolean;
  isPast: boolean;
}

export interface AvailabilityResult {
  date: string;
  origin: LocationCategory;
  slots: AvailabilitySlot[];
}

/* ───────── 공통 에러 ───────── */

export interface ApiError {
  error: string;
  code?: string;
}
