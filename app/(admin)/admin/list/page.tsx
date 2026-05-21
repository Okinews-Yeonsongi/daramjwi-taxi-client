import { db } from "@/lib/dal";
import { DEMO_VILLAGE_ID } from "@/lib/mock/seed";
import { ListClient } from "@/components/admin/list-client";

export default async function AdminListPage() {
  const reservations = await db.listReservations(DEMO_VILLAGE_ID, "all");
  return (
    <div className="pb-6">
      <header className="bg-white px-5 pb-3 pt-9">
        <h1 className="flex items-center gap-1.5 text-2xl font-black text-ink">📋 전체 신청 목록</h1>
      </header>
      <ListClient reservations={reservations} />
    </div>
  );
}
