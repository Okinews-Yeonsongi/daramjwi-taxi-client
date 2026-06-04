// lib/api.ts
// daramjwi-taxi-server 호출 클라이언트. 모든 요청에 Bearer 토큰을 첨부합니다.
// 엔드포인트/바디 형태는 백엔드 라우트 핸들러 기준 (검증 완료).

import type {
  AdminDashboard,
  AdminReservation,
  AdminStats,
  AdminTab,
  AuthMe,
  AvailabilityResult,
  DevLoginResult,
  LocationCategory,
  Location,
  MyReservation,
  TimeSlot,
  TodayRun,
  VillageStats,
} from "@/lib/types";

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

/** API 가 친근한 한글 메시지를 담아주는 에러 */
export class ApiCallError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiCallError";
    this.status = status;
    this.code = code;
  }
}

let _token: string | null = null;

/** 로그인 후 토큰을 저장. 이후 모든 요청에 자동 첨부됩니다. */
export function setToken(token: string | null) {
  _token = token;
}
export function getToken(): string | null {
  return _token;
}

async function call<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (_token) headers.Authorization = `Bearer ${_token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiCallError("서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.", 0);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* 본문 없음 */
  }

  if (!res.ok) {
    const err = data as { error?: string; code?: string } | null;
    throw new ApiCallError(err?.error ?? "요청 처리 중 문제가 생겼어요.", res.status, err?.code);
  }
  return data as T;
}

/* ───────── 인증 ───────── */

/** 개발용 로그인 (SMS OTP 연동 전 임시). role="admin" 으로 기사님 토큰 발급. */
export function devLogin(role: "admin" | "resident" = "admin") {
  return call<DevLoginResult>("/api/dev/login", { method: "POST", body: { role } });
}

export function authMe() {
  return call<AuthMe>("/api/auth/me");
}

/* ───────── 마스터 데이터 ───────── */

export function getLocations() {
  return call<{
    locations: Location[];
    byCategory: Record<LocationCategory, Location[]>;
  }>("/api/locations");
}

export function getTimeSlots() {
  return call<{ timeSlots: TimeSlot[] }>("/api/time-slots");
}

/* ───────── 기사님 ───────── */

export function getDashboard() {
  return call<AdminDashboard>("/api/admin/dashboard");
}

export function getReservations(params: { status?: AdminTab; date?: string }) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.date) q.set("date", params.date);
  const qs = q.toString();
  return call<{ reservations: AdminReservation[] }>(
    `/api/admin/reservations${qs ? `?${qs}` : ""}`,
  );
}

export function confirmReservation(id: number) {
  return call<{ reservation: unknown }>(`/api/admin/reservations/${id}/confirm`, {
    method: "PATCH",
  });
}

export function cancelReservation(id: number, reason: string) {
  return call<{ reservation: unknown }>(`/api/admin/reservations/${id}/cancel`, {
    method: "PATCH",
    body: { reason },
  });
}

export function mergeReservations(reservationIds: number[], newHour: number, newMinute: number) {
  return call<{ reservations: unknown[] }>("/api/admin/reservations/merge", {
    method: "POST",
    body: { reservation_ids: reservationIds, new_hour: newHour, new_minute: newMinute },
  });
}

/** 전화 신청 (비회원 대리 접수) */
export function createPhoneReservation(body: {
  name: string;
  phone: string;
  date: string;
  hour: number;
  departure_id: number;
  arrival_id: number;
  persons: number;
}) {
  return call<{ reservation: unknown }>("/api/admin/reservations", {
    method: "POST",
    body,
  });
}

export function getTodayRuns() {
  return call<{ date: string; runs: TodayRun[] }>("/api/runs/today");
}

export function getStats(month: string) {
  return call<AdminStats>(`/api/admin/stats?month=${month}`);
}

/* ───────── 가용성 (전화 신청 흐름) ───────── */

export function getAvailability(date: string, origin: LocationCategory) {
  return call<AvailabilityResult>(`/api/availability?date=${date}&origin=${origin}`);
}

export function getSeats(date: string, hour: number, origin: LocationCategory) {
  return call<{ date: string; hour: number; origin: LocationCategory; remaining: number }>(
    `/api/availability/seats?date=${date}&hour=${hour}&origin=${origin}`,
  );
}

/* ───────── 주민(시민) ───────── */

/** 내 예약 목록 (오늘 이후, 취소 제외) */
export function getMyReservations() {
  return call<{ reservations: MyReservation[] }>("/api/reservations/me");
}

/** 본인 예약 생성 (대기 상태). 로그인 사용자 기준. 차량 자동 배정. */
export function createMyReservation(body: {
  date: string;
  hour: number;
  departure_id: number;
  arrival_id: number;
  persons: number;
}) {
  return call<{ reservation: unknown }>("/api/reservations", {
    method: "POST",
    body,
  });
}

/** 본인 예약 취소 (운행 시작 전까지) */
export function cancelMyReservation(id: number) {
  return call<{ reservation: unknown }>(`/api/reservations/${id}/cancel`, {
    method: "PATCH",
  });
}

/** 마을 현황 (운행 한도/탑승자/평균) */
export function getVillageStats() {
  return call<VillageStats>("/api/stats/village");
}

/* ───────── 카카오 로그인 / 온보딩 ───────── */

/** 카카오 로그인 시작 URL. next 는 콜백 후 토큰을 받을 경로(우리 앱 주소). */
export function kakaoStartUrl(next: string) {
  return `${BASE}/api/auth/kakao/start?next=${encodeURIComponent(next)}`;
}

/** 온보딩 — 최초 카카오 가입자의 이름·전화번호 등록 (POST /api/profile). */
export function onboardProfile(body: { name: string; phone: string }) {
  return call<{ profile: unknown; created: boolean }>("/api/profile", {
    method: "POST",
    body,
  });
}
