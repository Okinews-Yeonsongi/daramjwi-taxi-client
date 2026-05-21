// lib/dal/index.ts
// Data Access Layer 인터페이스. UI/서버액션은 이 인터페이스에만 의존합니다.
// 구현체를 mock → supabase 로 교체해도 호출부는 바뀌지 않습니다.
import type {
  Village,
  ResidentWithUsage,
  Resident,
  ReservationView,
  Reservation,
  DashboardSummary,
  ReservationStatus,
  NotificationChannel,
  NotificationLog,
} from "@/lib/types";

export interface CreateReservationInput {
  village_id: string;
  resident_id: string;
  reservation_date: string;
  reservation_time: string;
  direction: Reservation["direction"];
  depart_label: string;
  arrive_label: string;
  passenger_count: number;
  booked_by: Reservation["booked_by"];
  created_by?: string | null;
  is_phone_intake?: boolean;
  notes?: string | null;
}

export interface RegisterResidentInput {
  village_id: string;
  full_name: string;
  phone: string;
  address?: string | null;
  registered_by?: string | null;
}

export interface DataAccess {
  getVillage(villageId: string): Promise<Village | null>;
  getDashboardSummary(villageId: string, date: string): Promise<DashboardSummary>;

  listResidents(villageId: string): Promise<ResidentWithUsage[]>;
  registerResident(input: RegisterResidentInput): Promise<Resident>;

  listReservations(
    villageId: string,
    status?: ReservationStatus | "all",
  ): Promise<ReservationView[]>;
  listTodayReservations(villageId: string, date: string): Promise<ReservationView[]>;
  listReservationsByResident(residentId: string): Promise<ReservationView[]>;

  /** 슬롯 잔여 인원: capacity - 동일(date,time,direction) 신청 합계 */
  getSlotRemaining(
    villageId: string,
    date: string,
    time: string,
    direction: Reservation["direction"],
  ): Promise<number>;

  createReservation(input: CreateReservationInput): Promise<Reservation>;
  /** 확정: 슬롯 운행 횟수 차감 + 알림 발송(placeholder) */
  confirmReservation(id: string): Promise<Reservation>;
  /** 취소: 매칭 전이면 즉시, 후면 잔여 횟수 복구 */
  cancelReservation(id: string, requestOnly?: boolean): Promise<Reservation>;

  // 알림 (MVP: placeholder)
  sendNotification(
    reservationId: string,
    channel: NotificationChannel,
  ): Promise<NotificationLog>;
}

// ───────── 활성 구현체 ─────────
// 이 프런트엔드는 mock(인메모리) 구현으로 동작합니다.
// 백엔드 연동 시 위 DataAccess 인터페이스를 구현한 모듈(예: ./supabase)을 만들어
// 아래 db 만 교체하면 화면/서버액션 코드는 그대로 재사용됩니다.
import { mockDataAccess } from "./mock";

export const db: DataAccess = mockDataAccess;
