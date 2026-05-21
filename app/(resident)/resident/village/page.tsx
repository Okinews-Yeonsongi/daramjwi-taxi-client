import { db } from "@/lib/dal";
import { DEMO_TODAY, DEMO_VILLAGE_ID } from "@/lib/mock/seed";

export default async function VillageStatusPage() {
  const village = await db.getVillage(DEMO_VILLAGE_ID);
  const summary = await db.getDashboardSummary(DEMO_VILLAGE_ID, DEMO_TODAY);
  const monthUsed = summary.monthly_limit - summary.month_remaining;
  const pct = Math.min(100, Math.round((monthUsed / summary.monthly_limit) * 100));

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 bg-white px-[18px] pb-3 pt-9">
        <h1 className="text-2xl font-black text-ink">마을 현황</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{village?.name}</p>
      </header>

      <div className="flex flex-col gap-3.5 px-[18px] py-5">
        <div className="grid grid-cols-2 gap-3.5">
          <Stat label="오늘 남은 운행" value={summary.today_remaining} unit="회" sub={`최대 ${summary.daily_limit}회`} tone="ink" />
          <Stat label="이번달 남은 운행" value={summary.month_remaining} unit="회" sub={`총 ${summary.monthly_limit}회`} tone="good" />
        </div>

        {/* 월 사용량 진행바 — 쿠폰제 효과 자동화 (PRD 2.3) */}
        <div className="rounded-[18px] border border-black/10 bg-card p-5 shadow-sm">
          <div className="flex items-end justify-between">
            <span className="font-bold text-ink">이번달 사용량</span>
            <span className="text-sm font-bold text-ink-muted">
              {monthUsed} / {summary.monthly_limit}회
            </span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <p className="px-1 text-sm leading-relaxed text-ink-hint">
          잔여 운행 횟수는 마을 전체 기준입니다. 예약은 최소 4일 ~ 최대 7일 전까지 가능하며, 당일
          이용은 이장님께 전화로 문의해 주세요.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  sub: string;
  tone: "ink" | "good";
}) {
  return (
    <div className="rounded-[18px] border border-black/10 bg-card p-5 shadow-sm">
      <div className="text-sm font-semibold text-ink-muted">{label}</div>
      <div className={`mt-1 text-4xl font-black leading-none ${tone === "good" ? "text-good" : "text-ink"}`}>
        {value}
        <span className="ml-0.5 text-lg">{unit}</span>
      </div>
      <div className="mt-2 text-xs text-ink-hint">{sub}</div>
    </div>
  );
}
