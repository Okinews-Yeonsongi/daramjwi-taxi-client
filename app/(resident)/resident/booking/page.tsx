import { db } from "@/lib/dal";
import { DEMO_TODAY, DEMO_VILLAGE_ID, DEMO_RESIDENT_ID } from "@/lib/mock/seed";
import { residentBookingDates, buildUsageMap } from "@/lib/booking";
import { BookingClient } from "@/components/resident/booking-client";

export default async function ResidentBookingPage() {
  const dates = residentBookingDates(DEMO_TODAY); // 최소 4일 ~ 최대 7일 전 (PRD 7.1)
  const reservations = await db.listReservations(DEMO_VILLAGE_ID, "all");
  const usageMap = buildUsageMap(reservations);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 bg-white px-[18px] pb-3 pt-9">
        <h1 className="text-2xl font-black text-ink">탑승 신청</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          당일 예약은 이장님께 전화로 부탁드려요.
        </p>
      </header>
      <BookingClient
        villageId={DEMO_VILLAGE_ID}
        residentId={DEMO_RESIDENT_ID}
        dates={dates}
        usageMap={usageMap}
      />
    </div>
  );
}
