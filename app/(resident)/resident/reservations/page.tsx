import { db } from "@/lib/dal";
import { DEMO_RESIDENT_ID } from "@/lib/mock/seed";
import { ReservationsClient } from "@/components/resident/reservations-client";

export default async function MyReservationsPage() {
  const list = await db.listReservationsByResident(DEMO_RESIDENT_ID);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 bg-white px-[18px] pb-3 pt-9">
        <h1 className="text-2xl font-black text-ink">내 예약 현황</h1>
      </header>
      <ReservationsClient initial={list} />
    </div>
  );
}
