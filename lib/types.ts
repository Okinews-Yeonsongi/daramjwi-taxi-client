// lib/types.ts
// 다람쥐 택시 도메인 타입 — Supabase 스키마와 1:1로 대응됩니다.

/* ───────── Enums (PRD "주요 상태값") ───────── */
export type UserRole =
  | "admin" // 행정 담당자: 전체 마을
  | "village_manager" // 이장님: 본인 마을
  | "resident_family" // 주민 가족: 대리 신청
  | "resident"; // 주민 본인(수혜자, 앱 사용 선택)

export type ReservationStatus =
  | "pending" // 대기중 (접수, 매칭 전)
  | "confirmed" // 확정 (매칭/배차 완료)
  | "completed" // 완료 (운행 종료)
  | "canceled"; // 취소

export type BookedBy = "resident" | "family" | "village_manager";

export type RideDirection =
  | "village_to_town" // 청산면 → 읍내
  | "town_to_village"; // 읍내 → 청산면

export type CancelStatus = "none" | "cancel_requested" | "canceled";

export type NotificationStatus = "not_sent" | "sent" | "failed";
export type NotificationChannel = "sms" | "kakao";

/* ───────── Tables ───────── */
export interface Village {
  id: string;
  name: string; // "청산면 백운리"
  town_name: string; // 반대편 권역 표시명 "읍내"
  monthly_limit: number; // 월 최대 운행 횟수 (112)
  daily_limit: number; // 1일 최대 운행 횟수 (4)
  created_at: string;
}

export interface AppUser {
  id: string; // = auth.users.id
  role: UserRole;
  village_id: string | null;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface Resident {
  id: string;
  village_id: string;
  full_name: string;
  phone: string;
  address: string | null;
  registered_by: string | null; // app_user.id (최초 등록 이장님/가족)
  is_active: boolean;
  created_at: string;
}

/** 운행 단위(= 1회). (날짜 + 시간 + 방향) 버킷. 최대 4인 동승. */
export interface RideSlot {
  id: string;
  village_id: string;
  slot_date: string; // YYYY-MM-DD
  slot_time: string; // HH:mm
  direction: RideDirection;
  capacity: number; // 4 (인원)
  booked_count: number; // 현재 신청 인원 합계
  is_consumed: boolean; // 확정 시 true → 운행 횟수 1 차감
}

export interface Reservation {
  id: string;
  village_id: string;
  resident_id: string;
  slot_id: string | null; // 매칭 전 null
  reservation_date: string; // YYYY-MM-DD
  reservation_time: string; // HH:mm
  direction: RideDirection;
  depart_label: string; // "우리집", "옥천성모병원"
  arrive_label: string;
  passenger_count: number; // 1~4
  status: ReservationStatus;
  cancel_status: CancelStatus;
  booked_by: BookedBy;
  created_by: string | null; // app_user.id (대리 입력 주체)
  is_phone_intake: boolean; // 전화 접수 여부
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  canceled_at: string | null;
}

/** 동승 동반자 (대표 신청자 외 추가 탑승자). */
export interface ReservationPassenger {
  id: string;
  reservation_id: string;
  name: string;
  phone: string | null;
}

/** 마을·월 단위 운행 횟수 집계 (월 112회 한도 관리). */
export interface OperationLimit {
  id: string;
  village_id: string;
  period_month: string; // YYYY-MM-01
  monthly_limit: number;
  used_count: number; // 확정·완료된 운행(슬롯) 수
}

export interface NotificationLog {
  id: string;
  reservation_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient_phone: string;
  payload: string;
  sent_at: string | null;
  created_at: string;
}

/* ───────── View / 합성 타입 (UI 편의) ───────── */

/** 주민 + 당월 누적 이용 횟수 (전화접수+직접예약 통합 카운팅). */
export interface ResidentWithUsage extends Resident {
  monthly_usage: number;
}

/** 예약 + 주민 정보 조인 (목록/대시보드 표시용). */
export interface ReservationView extends Reservation {
  resident_name: string;
  resident_phone: string;
}

/** 대시보드 요약 카드 데이터. */
export interface DashboardSummary {
  today_remaining: number; // 오늘 잔여 (회)
  daily_limit: number; // 4
  month_remaining: number; // 이번달 잔여 (회)
  monthly_limit: number; // 112
  pending_count: number; // 오늘 대기 (조율 필요)
}
