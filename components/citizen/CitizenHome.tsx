"use client";

import { fmtDateLong, todayStr } from "@/lib/format";
import { useCitizen } from "./ctx";
import PushButton from "@/components/PushButton";

const MENU: { screen: "book" | "today" | "village" | "my"; icon: string; bg: string; label: string; sub: string }[] = [
  { screen: "book", icon: "🚗", bg: "var(--primary-light)", label: "탑승 신청하기", sub: "날짜·출발지·도착지·시간·인원 선택" },
  { screen: "today", icon: "📅", bg: "var(--green-light)", label: "오늘 운행", sub: "오늘 운행 일정 확인" },
  { screen: "village", icon: "🏘️", bg: "var(--blue-light)", label: "마을 현황", sub: "이용 현황 보기" },
  { screen: "my", icon: "📋", bg: "var(--purple-light)", label: "내 예약 현황", sub: "나의 예약 내역 보기" },
];

export default function CitizenHome() {
  const { goScreen, residentName, onLogout } = useCitizen();
  return (
    <div className="screen active">
      <div className="top-bar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <div className="app-name">🐿️ 다람쥐 택시</div>
          <button className="home-logout" onClick={onLogout}>
            로그아웃
          </button>
        </div>
        <div className="top-bar-sub">안녕하세요, {residentName} 님!</div>
        <div className="top-bar-date">{fmtDateLong(todayStr())}</div>
        <div className="home-notice">
          <div style={{ fontSize: 22 }}>📢</div>
          <div className="home-notice-text">오전 9시 ~ 오후 6시 정상 운행</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <PushButton />
        </div>
      </div>
      <div className="scroll-content">
        <div className="home-grid">
          {MENU.map((m) => (
            <button key={m.screen} className="home-btn-card" onClick={() => goScreen(m.screen)}>
              <div className="home-btn-icon" style={{ background: m.bg }}>
                {m.icon}
              </div>
              <div>
                <div className="home-btn-label">{m.label}</div>
                <div className="home-btn-sub">{m.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
