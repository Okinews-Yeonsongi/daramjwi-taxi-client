import { db } from "@/lib/dal";
import { DEMO_VILLAGE_ID } from "@/lib/mock/seed";
import { Card } from "@/components/ui/card";

export default async function ResidentsPage() {
  const residents = await db.listResidents(DEMO_VILLAGE_ID);

  return (
    <div className="pb-6">
      <header className="bg-white px-5 pb-3 pt-9">
        <h1 className="flex items-center gap-1.5 text-2xl font-black text-ink">👥 주민 명단</h1>
        <p className="mt-1 text-sm text-ink-muted">
          당월 이용 횟수 = 전화 접수 + 직접 예약 통합 카운팅
        </p>
      </header>
      <div className="flex flex-col gap-2.5 px-5">
        {residents.map((r) => (
          <Card key={r.id} className="flex items-center gap-3 py-4">
            <span className="flex size-11 items-center justify-center rounded-full bg-bg text-ink-muted">👤</span>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-ink">{r.full_name}</div>
              <div className="text-sm text-ink-muted">{r.phone}</div>
              {r.address && <div className="truncate text-xs text-ink-hint">{r.address}</div>}
            </div>
            <span className="rounded-full bg-primary-light px-3.5 py-1.5 text-sm font-extrabold text-primary-darker">
              {r.monthly_usage}회
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
