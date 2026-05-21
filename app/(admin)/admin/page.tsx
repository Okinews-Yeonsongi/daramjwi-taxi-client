import Link from "next/link";
import { Phone, Squirrel } from "lucide-react";
import { db } from "@/lib/dal";
import { DEMO_TODAY, DEMO_VILLAGE_ID } from "@/lib/mock/seed";
import { formatDateKo } from "@/lib/constants";
import { DashboardTimeline } from "@/components/admin/dashboard-timeline";

export default async function AdminDashboard() {
  const village = await db.getVillage(DEMO_VILLAGE_ID);
  const summary = await db.getDashboardSummary(DEMO_VILLAGE_ID, DEMO_TODAY);
  const today = await db.listTodayReservations(DEMO_VILLAGE_ID, DEMO_TODAY);

  return (
    <div className="pb-6">
      {/* 상단 헤더 */}
      <header className="bg-primary px-5 pb-5 pt-9">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Squirrel className="text-white" size={28} />
            <div>
              <div className="text-xl font-black text-white">다람쥐 택시</div>
              <div className="text-sm font-bold text-white/85">{village?.name} 이장님 관리</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-white/75">{formatDateKo(DEMO_TODAY)}</div>
            <div className="mt-1 inline-block rounded-full bg-white/25 px-3 py-1 text-xs font-extrabold text-white">
              오늘 잔여 {summary.today_remaining}회
            </div>
          </div>
        </div>

        {/* 원터치 전화 접수 CTA */}
        <Link
          href="/admin/intake"
          className="mt-4 flex items-center justify-between rounded-[14px] bg-white px-4 py-3.5 shadow-sm active:scale-[0.98]"
        >
          <span>
            <span className="block text-sm text-ink-muted">전화 신청 받으셨나요?</span>
            <span className="text-lg font-black text-primary-dark">+ 신청 바로 접수하기</span>
          </span>
          <Phone className="text-primary" size={26} />
        </Link>
      </header>

      {/* 업무 부하 인디케이터 */}
      <div className="grid grid-cols-3 gap-2.5 px-5 py-4">
        <Stat label="오늘 잔여" value={summary.today_remaining} sub={`최대 ${summary.daily_limit}회`} tone="ink" />
        <Stat label="이번달 잔여" value={summary.month_remaining} sub={`총 ${summary.monthly_limit}회 중`} tone="good" />
        <Stat label="오늘 대기" value={summary.pending_count} sub="확인 필요" tone="bad" />
      </div>

      {/* 실시간 당일 타임라인 */}
      <section className="px-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-lg font-extrabold text-ink">
          📅 오늘 운행 신청
        </h2>
        <DashboardTimeline items={today} />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "ink" | "good" | "bad";
}) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-[16px] border border-black/10 bg-card p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
      <div className="text-xs font-semibold text-ink-muted">{label}</div>
      <div className={`mt-1 text-3xl font-black leading-none ${color}`}>{value}</div>
      <div className="mt-1.5 text-[11px] text-ink-hint">{sub}</div>
    </div>
  );
}
