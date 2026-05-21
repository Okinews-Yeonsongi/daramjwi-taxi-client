// lib/mock/seed.ts
// 데모용 시드 데이터. "오늘"은 프로토타입과 동일하게 2026-05-18(월)로 고정합니다.
import type {
  Village,
  AppUser,
  Resident,
  Reservation,
  OperationLimit,
} from "@/lib/types";

export const DEMO_TODAY = "2026-05-18"; // 데모 기준일 (월요일)
export const DEMO_VILLAGE_ID = "vil_cheongsan_baegun";
// 주민/가족 데모 세션이 "본인"으로 보는 주민. 실제 앱에서는 auth 세션으로 대체.
export const DEMO_RESIDENT_ID = "res_hong"; // 홍길동

export const seedVillages: Village[] = [
  {
    id: DEMO_VILLAGE_ID,
    name: "청산면 백운리",
    town_name: "읍내",
    monthly_limit: 112,
    daily_limit: 4,
    created_at: "2026-01-01T00:00:00Z",
  },
];

export const seedUsers: AppUser[] = [
  {
    id: "user_manager",
    role: "village_manager",
    village_id: DEMO_VILLAGE_ID,
    full_name: "백운리 이장",
    phone: "010-1111-2222",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "user_admin",
    role: "admin",
    village_id: null,
    full_name: "옥천군 교통과",
    phone: "043-730-3539",
    created_at: "2026-01-01T00:00:00Z",
  },
];

// PDF 주민 명단 + 당월 이용 횟수(배지)
export const seedResidents: Resident[] = [
  r("res_kim", "김순례", "010-1234-5678", "청산면 백운리 12"),
  r("res_park", "박영철", "010-2345-6789", "청산면 백운리 30"),
  r("res_lee", "이정자", "010-3456-7890", "청산면 백운리 7"),
  r("res_choi", "최봉수", "010-4567-8901", "청산면 백운리 41"),
  r("res_jung", "정말순", "010-5678-9012", "청산면 백운리 19"),
  r("res_hong", "홍길동", "010-6789-0123", "청산면 백운리 23"),
  r("res_yoon", "윤복순", "010-7890-1234", "청산면 백운리 5"),
  r("res_kang", "강태풍", "010-8901-2345", "청산면 백운리 88"),
];

function r(id: string, name: string, phone: string, address: string): Resident {
  return {
    id,
    village_id: DEMO_VILLAGE_ID,
    full_name: name,
    phone,
    address,
    registered_by: "user_manager",
    is_active: true,
    created_at: "2026-02-01T00:00:00Z",
  };
}

// PDF 대시보드 "오늘 운행 신청" 타임라인 + 미래 예약 일부
export const seedReservations: Reservation[] = [
  res("rsv_1", "res_kim", DEMO_TODAY, "09:00", "village_to_town", "우리집", "옥천성모병원", 1, "completed", "village_manager", false),
  res("rsv_2", "res_lee", DEMO_TODAY, "11:00", "town_to_village", "시장", "우리집", 2, "confirmed", "village_manager", false),
  res("rsv_3", "res_park", DEMO_TODAY, "14:00", "village_to_town", "마을회관", "옥천군청", 1, "pending", "family", false),
  res("rsv_4", "res_choi", DEMO_TODAY, "16:00", "town_to_village", "청산면사무소", "우리집", 1, "pending", "village_manager", true),
  // 예약 윈도우(4~7일 후) 미래 건
  res("rsv_5", "res_jung", "2026-05-22", "10:00", "village_to_town", "우리집", "옥천성모병원", 1, "pending", "resident", false),
  res("rsv_6", "res_yoon", "2026-05-23", "14:00", "town_to_village", "옥천군청", "마을회관", 2, "confirmed", "family", false),
];

function res(
  id: string,
  resident_id: string,
  date: string,
  time: string,
  direction: Reservation["direction"],
  depart: string,
  arrive: string,
  persons: number,
  status: Reservation["status"],
  bookedBy: Reservation["booked_by"],
  phone: boolean,
): Reservation {
  return {
    id,
    village_id: DEMO_VILLAGE_ID,
    resident_id,
    slot_id: status === "confirmed" || status === "completed" ? `slot_${id}` : null,
    reservation_date: date,
    reservation_time: time,
    direction,
    depart_label: depart,
    arrive_label: arrive,
    passenger_count: persons,
    status,
    cancel_status: "none",
    booked_by: bookedBy,
    created_by: bookedBy === "resident" ? null : "user_manager",
    is_phone_intake: phone,
    notes: null,
    created_at: "2026-05-15T09:00:00Z",
    confirmed_at: status === "confirmed" || status === "completed" ? "2026-05-15T10:00:00Z" : null,
    canceled_at: null,
  };
}

export const seedOperationLimits: OperationLimit[] = [
  {
    id: "ol_2026_05",
    village_id: DEMO_VILLAGE_ID,
    period_month: "2026-05-01",
    monthly_limit: 112,
    used_count: 13, // 이번달 잔여 99 ⇒ 사용 13
  },
];
