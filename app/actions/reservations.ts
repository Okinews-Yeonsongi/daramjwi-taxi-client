// app/actions/reservations.ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/dal";
import type { CreateReservationInput, RegisterResidentInput } from "@/lib/dal";

export async function createReservationAction(input: CreateReservationInput) {
  const remaining = await db.getSlotRemaining(
    input.village_id,
    input.reservation_date,
    input.reservation_time,
    input.direction,
  );
  if (remaining < input.passenger_count) {
    return { ok: false as const, error: "해당 시간대 잔여 좌석이 부족합니다." };
  }
  const r = await db.createReservation(input);
  revalidatePath("/admin");
  revalidatePath("/admin/list");
  revalidatePath("/resident/reservations");
  return { ok: true as const, reservation: r };
}

export async function confirmReservationAction(id: string) {
  const r = await db.confirmReservation(id); // 슬롯 차감 + 알림 발송(placeholder)
  revalidatePath("/admin");
  revalidatePath("/admin/list");
  return { ok: true as const, reservation: r };
}

export async function cancelReservationAction(id: string, requestOnly = false) {
  const r = await db.cancelReservation(id, requestOnly); // 잔여 횟수 복구
  revalidatePath("/admin");
  revalidatePath("/admin/list");
  revalidatePath("/resident/reservations");
  return { ok: true as const, reservation: r };
}

export async function registerResidentAction(input: RegisterResidentInput) {
  const r = await db.registerResident(input);
  revalidatePath("/admin/residents");
  revalidatePath("/admin/intake");
  return { ok: true as const, resident: r };
}
