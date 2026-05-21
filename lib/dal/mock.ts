// lib/dal/mock.ts
// 인메모리 mock 구현. 외부 의존성 없이 클릭 가능한 프로토타입을 돌립니다.
// ⚠️ 프로세스 메모리에만 저장되므로 서버 재시작/콜드스타트 시 시드로 초기화됩니다.
import type { DataAccess, CreateReservationInput, RegisterResidentInput } from "./index";
import type {
  Reservation,
  ReservationView,
  ResidentWithUsage,
  DashboardSummary,
  NotificationLog,
  NotificationChannel,
  Resident,
} from "@/lib/types";
import { genId } from "@/lib/utils";
import { SLOT_CAPACITY } from "@/lib/constants";
import {
  seedVillages,
  seedResidents,
  seedReservations,
  seedOperationLimits,
} from "@/lib/mock/seed";

// 가변 상태 (시드 복사)
const villages = [...seedVillages];
let residents = [...seedResidents];
let reservations = [...seedReservations];
const limits = [...seedOperationLimits];
const notifications: NotificationLog[] = [];

const monthKey = (date: string) => date.slice(0, 7) + "-01";
const ACTIVE: Reservation["status"][] = ["confirmed", "completed"];

function residentName(id: string) {
  return residents.find((r) => r.id === id)?.full_name ?? "(알 수 없음)";
}
function residentPhone(id: string) {
  return residents.find((r) => r.id === id)?.phone ?? "";
}
function toView(r: Reservation): ReservationView {
  return { ...r, resident_name: residentName(r.resident_id), resident_phone: residentPhone(r.resident_id) };
}

/** 동일 (date,time,direction) 슬롯이 운행 횟수를 점유하는지 = 활성 예약 존재 */
function slotKey(r: Pick<Reservation, "reservation_date" | "reservation_time" | "direction">) {
  return `${r.reservation_date}|${r.reservation_time}|${r.direction}`;
}
function consumedSlotKeys(villageId: string, dateFilter?: (d: string) => boolean): Set<string> {
  const keys = new Set<string>();
  for (const r of reservations) {
    if (r.village_id !== villageId) continue;
    if (!ACTIVE.includes(r.status)) continue;
    if (dateFilter && !dateFilter(r.reservation_date)) continue;
    keys.add(slotKey(r));
  }
  return keys;
}

export const mockDataAccess: DataAccess = {
  async getVillage(villageId) {
    return villages.find((v) => v.id === villageId) ?? null;
  },

  async getDashboardSummary(villageId, date): Promise<DashboardSummary> {
    const village = villages.find((v) => v.id === villageId)!;
    const limit = limits.find((l) => l.village_id === villageId && l.period_month === monthKey(date));

    const todayConsumed = consumedSlotKeys(villageId, (d) => d === date).size;
    const pending = reservations.filter(
      (r) => r.village_id === villageId && r.reservation_date === date && r.status === "pending",
    ).length;

    return {
      today_remaining: Math.max(0, village.daily_limit - todayConsumed),
      daily_limit: village.daily_limit,
      month_remaining: Math.max(0, (limit?.monthly_limit ?? village.monthly_limit) - (limit?.used_count ?? 0)),
      monthly_limit: limit?.monthly_limit ?? village.monthly_limit,
      pending_count: pending,
    };
  },

  async listResidents(villageId): Promise<ResidentWithUsage[]> {
    const thisMonth = monthKey(new Date().toISOString().slice(0, 10));
    return residents
      .filter((r) => r.village_id === villageId && r.is_active)
      .map((r) => ({
        ...r,
        // 전화접수 + 직접예약 통합 카운팅: 당월 활성 예약 건수
        monthly_usage: reservations.filter(
          (rv) =>
            rv.resident_id === r.id &&
            ACTIVE.includes(rv.status) &&
            monthKey(rv.reservation_date) === thisMonth,
        ).length,
      }));
  },

  async registerResident(input: RegisterResidentInput): Promise<Resident> {
    const newRes: Resident = {
      id: genId("res"),
      village_id: input.village_id,
      full_name: input.full_name,
      phone: input.phone,
      address: input.address ?? null,
      registered_by: input.registered_by ?? null,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    residents = [newRes, ...residents];
    return newRes;
  },

  async listReservations(villageId, status = "all"): Promise<ReservationView[]> {
    return reservations
      .filter((r) => r.village_id === villageId && (status === "all" || r.status === status))
      .sort((a, b) => (a.reservation_date + a.reservation_time).localeCompare(b.reservation_date + b.reservation_time))
      .map(toView);
  },

  async listTodayReservations(villageId, date): Promise<ReservationView[]> {
    return reservations
      .filter((r) => r.village_id === villageId && r.reservation_date === date)
      .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
      .map(toView);
  },

  async listReservationsByResident(residentId): Promise<ReservationView[]> {
    return reservations
      .filter((r) => r.resident_id === residentId && r.status !== "canceled")
      .sort((a, b) => (a.reservation_date + a.reservation_time).localeCompare(b.reservation_date + b.reservation_time))
      .map(toView);
  },

  async getSlotRemaining(villageId, date, time /* direction은 MVP에서 미사용 */): Promise<number> {
    // MVP 규칙: 한 (날짜·시간) 타임슬롯 = 차량 1대 = 최대 4인 (프로토타입과 동일).
    const used = reservations
      .filter(
        (r) =>
          r.village_id === villageId &&
          r.reservation_date === date &&
          r.reservation_time === time &&
          r.status !== "canceled",
      )
      .reduce((sum, r) => sum + r.passenger_count, 0);
    return Math.max(0, SLOT_CAPACITY - used);
  },

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    const newRsv: Reservation = {
      id: genId("rsv"),
      village_id: input.village_id,
      resident_id: input.resident_id,
      slot_id: null,
      reservation_date: input.reservation_date,
      reservation_time: input.reservation_time,
      direction: input.direction,
      depart_label: input.depart_label,
      arrive_label: input.arrive_label,
      passenger_count: input.passenger_count,
      status: "pending",
      cancel_status: "none",
      booked_by: input.booked_by,
      created_by: input.created_by ?? null,
      is_phone_intake: input.is_phone_intake ?? false,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
      confirmed_at: null,
      canceled_at: null,
    };
    reservations = [newRsv, ...reservations];
    return newRsv;
  },

  async confirmReservation(id): Promise<Reservation> {
    const r = reservations.find((x) => x.id === id);
    if (!r) throw new Error("reservation not found");
    const wasConsumed = consumedSlotKeys(r.village_id).has(slotKey(r));
    r.status = "confirmed";
    r.confirmed_at = new Date().toISOString();
    r.slot_id = r.slot_id ?? genId("slot");
    // 슬롯이 신규로 점유되면 월 운행 횟수 1 차감
    if (!wasConsumed) {
      const limit = limits.find((l) => l.village_id === r.village_id && l.period_month === monthKey(r.reservation_date));
      if (limit) limit.used_count += 1;
    }
    await this.sendNotification(id, "sms"); // placeholder
    return r;
  },

  async cancelReservation(id, requestOnly = false): Promise<Reservation> {
    const r = reservations.find((x) => x.id === id);
    if (!r) throw new Error("reservation not found");
    if (requestOnly) {
      r.cancel_status = "cancel_requested"; // 주민/가족의 취소 요청 → 이장님 확인 대기
      return r;
    }
    const wasConsumed = ACTIVE.includes(r.status);
    r.status = "canceled";
    r.cancel_status = "canceled";
    r.canceled_at = new Date().toISOString();
    // 다른 활성 예약이 같은 슬롯을 점유하지 않으면 월 횟수 복구
    if (wasConsumed && !consumedSlotKeys(r.village_id).has(slotKey(r))) {
      const limit = limits.find((l) => l.village_id === r.village_id && l.period_month === monthKey(r.reservation_date));
      if (limit) limit.used_count = Math.max(0, limit.used_count - 1);
    }
    return r;
  },

  async sendNotification(reservationId, channel: NotificationChannel): Promise<NotificationLog> {
    const r = reservations.find((x) => x.id === reservationId);
    // === 알림톡/SMS 발송 지점 (실연동 시 이 블록 교체) ===
    // const result = await kakaoAlimtalk.send({ to, templateId, ... })
    const log: NotificationLog = {
      id: genId("noti"),
      reservation_id: reservationId,
      channel,
      status: "sent", // mock: 항상 성공 처리
      recipient_phone: r ? residentPhone(r.resident_id) : "",
      payload: r
        ? `[다람쥐택시] ${r.reservation_date} ${r.reservation_time} ${r.depart_label}→${r.arrive_label} 예약이 확정되었습니다.`
        : "",
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    notifications.push(log);
    console.log("[notification:placeholder]", log.payload);
    return log;
  },
};
