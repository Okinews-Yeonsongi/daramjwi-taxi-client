import Link from "next/link";
import { Squirrel, UserCog, Users } from "lucide-react";

// MVP 데모용 역할 진입 화면. 실제 운영에서는 Supabase Auth 로그인 후
// app_user.role 에 따라 자동 리다이렉트합니다 (개선 제안 참고).
export default function RolePicker() {
  return (
    <main className="phone-shell no-scrollbar overflow-y-auto">
      <div className="bg-primary px-6 pb-9 pt-14 text-center">
        <Squirrel className="mx-auto text-white" size={72} strokeWidth={1.6} />
        <h1 className="mt-3 text-3xl font-black text-white">다람쥐 택시</h1>
        <p className="mt-2 font-semibold text-white/85">청산면 백운리 이동 도우미</p>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm font-bold text-ink-muted">어떤 화면으로 들어갈까요?</p>
        <Link
          href="/admin"
          className="flex items-center gap-4 rounded-[20px] border border-black/10 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.07)] active:scale-[0.98]"
        >
          <span className="flex size-16 items-center justify-center rounded-[18px] bg-primary-light">
            <UserCog className="text-primary-dark" size={32} />
          </span>
          <span>
            <span className="block text-xl font-extrabold text-ink">이장님 · 관리자</span>
            <span className="mt-1 block text-sm text-ink-muted">예약 접수·확정·주민 관리</span>
          </span>
        </Link>
        <Link
          href="/resident"
          className="flex items-center gap-4 rounded-[20px] border border-black/10 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.07)] active:scale-[0.98]"
        >
          <span className="flex size-16 items-center justify-center rounded-[18px] bg-info-light">
            <Users className="text-info" size={32} />
          </span>
          <span>
            <span className="block text-xl font-extrabold text-ink">주민 · 가족</span>
            <span className="mt-1 block text-sm text-ink-muted">탑승 신청·내 예약 확인</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
