import { db } from "@/lib/dal";
import { DEMO_TODAY, DEMO_VILLAGE_ID } from "@/lib/mock/seed";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateKo, formatTimeKo } from "@/lib/constants";

export default async function TodayRunPage() {
  const today = (await db.listTodayReservations(DEMO_VILLAGE_ID, DEMO_TODAY)).filter(
    (r) => r.status !== "canceled",
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 bg-white px-[18px] pb-3 pt-9">
        <h1 className="text-2xl font-black text-ink">오늘 운행 현황</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{formatDateKo(DEMO_TODAY)}</p>
      </header>

      <div className="px-[18px] py-5">
        {today.length === 0 ? (
          <Card className="text-center text-ink-muted">오늘 운행 예정이 없어요.</Card>
        ) : (
          <Card className="divide-y divide-black/10 p-0">
            {today.map((r) => {
              const am = r.reservation_time < "12:00";
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-4">
                  <div className="w-16 shrink-0">
                    <div className="text-lg font-extrabold text-ink">
                      {formatTimeKo(r.reservation_time).replace(/(오전|오후) /, "")}
                    </div>
                    <div className="text-xs text-ink-hint">{am ? "오전" : "오후"}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-ink">{r.resident_name}</div>
                    <div className="truncate text-sm text-ink-muted">
                      {r.depart_label} → {r.arrive_label}
                      <span className="ml-1 text-ink-hint">· {r.passenger_count}명</span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
