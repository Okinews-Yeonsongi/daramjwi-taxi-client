// lib/booking.ts — 예약 가능 날짜 / 슬롯 사용량 맵 빌더 (서버에서 호출)
import { toISODate } from "@/lib/utils";
import { BOOKING_MIN_DAYS, BOOKING_MAX_DAYS } from "@/lib/constants";
import type { ReservationView } from "@/lib/types";

/** from(ISO) 기준 count일치 날짜 배열 */
export function upcomingDates(fromISO: string, count: number, startOffset = 0): string[] {
  const base = new Date(fromISO + "T00:00:00");
  const out: string[] = [];
  for (let i = startOffset; i < startOffset + count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(toISODate(d));
  }
  return out;
}

/** 주민 예약 정책: 최소 4일 ~ 최대 7일 전 (PRD 7.1) */
export function residentBookingDates(fromISO: string): string[] {
  return upcomingDates(fromISO, BOOKING_MAX_DAYS - BOOKING_MIN_DAYS + 1, BOOKING_MIN_DAYS);
}

/** 이장님 대리/전화 접수: 조율 권한이 있으므로 더 넓은 범위 허용 */
export function adminIntakeDates(fromISO: string): string[] {
  return upcomingDates(fromISO, 14, 0);
}

/** `${date}|${time}` → 신청 인원 합계 (취소 제외) */
export function buildUsageMap(reservations: ReservationView[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of reservations) {
    if (r.status === "canceled") continue;
    const key = `${r.reservation_date}|${r.reservation_time}`;
    map[key] = (map[key] ?? 0) + r.passenger_count;
  }
  return map;
}
