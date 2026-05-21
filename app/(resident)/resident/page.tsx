import Link from "next/link";
import { CalendarPlus, Bus, Map, ClipboardCheck, Squirrel } from "lucide-react";
import { db } from "@/lib/dal";
import { DEMO_TODAY, DEMO_VILLAGE_ID, DEMO_RESIDENT_ID } from "@/lib/mock/seed";
import { formatDateKo } from "@/lib/constants";

export default async function ResidentHome() {
  const village = await db.getVillage(DEMO_VILLAGE_ID);
  const residents = await db.listResidents(DEMO_VILLAGE_ID);
  const me = residents.find((r) => r.id === DEMO_RESIDENT_ID);
  const summary = await db.getDashboardSummary(DEMO_VILLAGE_ID, DEMO_TODAY);

  return (
    <div className="pb-6">
      <header className="bg-primary px-5 pb-6 pt-9 text-white">
        <div className="flex items-center gap-2">
          <Squirrel size={28} />
          <div>
            <div className="text-xl font-black">다람쥐 택시</div>
            <div className="text-sm font-bold text-white/85">{village?.name}</div>
          </div>
        </div>
        <p className="mt-5 text-2xl font-black leading-snug">
          {me?.full_name ?? "주민"} 님,
          <br />
          안녕하세요 👋
        </p>
        <p className="mt-1 text-sm text-white/85">{formatDateKo(DEMO_TODAY)}</p>
      </header>

      {/* 이번달 내 이용 / 마을 잔여 요약 (복잡한 운영정보 대신 핵심만) */}
      <div className="-mt-4 grid grid-cols-2 gap-3 px-5">
        <div className="rounded-[18px] border border-black/10 bg-card p-4 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-semibold text-ink-muted">이번달 내 이용</div>
          <div className="mt-1 text-3xl font-black text-primary-dark">{me?.monthly_usage ?? 0}회</div>
        </div>
        <div className="rounded-[18px] border border-black/10 bg-card p-4 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-semibold text-ink-muted">마을 잔여</div>
          <div className="mt-1 text-3xl font-black text-good">{summary.month_remaining}회</div>
        </div>
      </div>

      {/* 큰 버튼 4개 — 고령자 친화 */}
      <nav className="mt-5 grid grid-cols-2 gap-3.5 px-5">
        <BigButton href="/resident/booking" icon={CalendarPlus} label="탑승 신청" tone="primary" />
        <BigButton href="/resident/today" icon={Bus} label="오늘 운행" tone="info" />
        <BigButton href="/resident/village" icon={Map} label="마을 현황" tone="good" />
        <BigButton href="/resident/reservations" icon={ClipboardCheck} label="내 예약" tone="plain" />
      </nav>
    </div>
  );
}

function BigButton({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  tone: "primary" | "info" | "good" | "plain";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary text-white",
    info: "bg-info-light text-info",
    good: "bg-good-light text-good-dark",
    plain: "bg-card text-ink border border-black/10",
  };
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 rounded-[20px] py-7 text-xl font-black shadow-sm active:scale-[0.98] ${tones[tone]}`}
    >
      <Icon size={40} />
      {label}
    </Link>
  );
}
