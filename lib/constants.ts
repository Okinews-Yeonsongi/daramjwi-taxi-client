// lib/constants.ts
import type {
  ReservationStatus,
  RideDirection,
  CancelStatus,
} from "@/lib/types";

export const SLOT_CAPACITY = 4; // 한 운행당 최대 인원
export const DAILY_LIMIT = 4; // 1일 최대 운행 횟수
export const MONTHLY_LIMIT = 112; // 월 최대 운행 횟수

/** 예약 가능 윈도우: 최소 4일 ~ 최대 7일 전 (PRD 7.1) */
export const BOOKING_MIN_DAYS = 4;
export const BOOKING_MAX_DAYS = 7;

export const TIMES_AM = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
] as const;
export const TIMES_PM = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
] as const;
export const ALL_TIMES = [...TIMES_AM, ...TIMES_PM];

/** 권역별 거점. cat 0 = 마을(청산면), cat 1 = 읍내 */
export const PLACES: Record<RideDirection extends never ? never : 0 | 1, string[]> = {
  0: ["우리집", "마을회관"],
  1: ["옥천성모병원", "청산면사무소", "옥천군청", "시장"],
};
export const CAT_NAMES = ["청산면", "읍내"] as const;

/** 출발 권역(cat) → 운행 방향 */
export function catToDirection(departCat: 0 | 1): RideDirection {
  return departCat === 0 ? "village_to_town" : "town_to_village";
}

export const DIRECTION_LABEL: Record<RideDirection, string> = {
  village_to_town: "청산면 → 읍내",
  town_to_village: "읍내 → 청산면",
};

/** 상태 → 라벨 + 배지 컬러 토큰 (프로토타입 색상 규칙 계승) */
export const STATUS_META: Record<
  ReservationStatus,
  { label: string; bg: string; fg: string }
> = {
  pending: { label: "대기중", bg: "bg-primary-light", fg: "text-primary-darker" },
  confirmed: { label: "확정", bg: "bg-good-light", fg: "text-good-dark" },
  completed: { label: "완료", bg: "bg-[#F2F2F2]", fg: "text-ink-muted" },
  canceled: { label: "취소", bg: "bg-bad-light", fg: "text-bad" },
};

export const STATUS_FILTERS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기중" },
  { value: "confirmed", label: "확정" },
  { value: "completed", label: "완료" },
  { value: "canceled", label: "취소" },
];

export const CANCEL_LABEL: Record<CancelStatus, string> = {
  none: "",
  cancel_requested: "취소 요청됨",
  canceled: "취소됨",
};

/** "09:00" → "오전 9:00" */
export function formatTimeKo(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(m).padStart(2, "0")}`;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
/** "2026-05-20" → "5월 20일 (수요일)" */
export function formatDateKo(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]}요일)`;
}
