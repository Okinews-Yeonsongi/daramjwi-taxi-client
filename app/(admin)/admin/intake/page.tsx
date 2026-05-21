import { db } from "@/lib/dal";
import { DEMO_TODAY, DEMO_VILLAGE_ID } from "@/lib/mock/seed";
import { adminIntakeDates, buildUsageMap } from "@/lib/booking";
import { IntakeFlow } from "@/components/admin/intake-flow";

export default async function AdminIntakePage() {
  const residents = await db.listResidents(DEMO_VILLAGE_ID);
  const reservations = await db.listReservations(DEMO_VILLAGE_ID, "all");
  const usageMap = buildUsageMap(reservations);
  const dates = adminIntakeDates(DEMO_TODAY);

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-white px-5 pb-2 pt-9">
        <h1 className="text-2xl font-black text-ink">전화 접수 / 대리 예약</h1>
      </header>
      <IntakeFlow villageId={DEMO_VILLAGE_ID} residents={residents} dates={dates} usageMap={usageMap} />
    </div>
  );
}
