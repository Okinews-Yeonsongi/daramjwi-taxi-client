"use client";

import { useEffect, useState } from "react";
import { getDashboard, ApiCallError } from "@/lib/api";
import type { AdminDashboard } from "@/lib/types";
import { fmtDateLong, todayStr } from "@/lib/format";
import { useAdmin } from "./ctx";
import PushButton from "@/components/PushButton";

export default function Home() {
  const { goPage, tick, adminName, onLogout } = useAdmin();
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    getDashboard()
      .then((d) => {
        if (alive) {
          setDash(d);
          setErr("");
        }
      })
      .catch((e) => {
        if (alive) setErr(e instanceof ApiCallError ? e.message : "불러오기 실패");
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const remain = dash?.limits.daily.remaining ?? "—";
  const wait = dash?.pending_total ?? "—";
  const confirmedToday = dash?.today.confirmed ?? 0;

  return (
    <div className="pg">
      <div className="home-header">
        <div className="home-header-top">
          <div className="home-logo-box">
            <img src="/character.png" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span className="home-app-name">다람쥐택시</span>
          <button className="home-logout" onClick={onLogout}>
            로그아웃
          </button>
        </div>
        <div className="home-greeting">안녕하세요, {adminName} 님!</div>
        <div className="home-date">{fmtDateLong(todayStr())}</div>
      </div>

      <div className="scroller">
        <div className="home-body">
          <button className="cta" onClick={() => goPage("manual")}>
            📞 전화 신청 바로가기 ➔
          </button>

          <div style={{ marginBottom: 14 }}>
            <PushButton />
          </div>

          {err && <div className="login-err" style={{ marginBottom: 12 }}>{err}</div>}

          <div className="home-boxes">
            <div className="home-box home-box-g">
              <div className="home-box-label">오늘 잔여 운행</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <div className="home-box-val">{remain}</div>
                <div className="home-box-unit">회</div>
              </div>
            </div>
            <div className="home-box home-box-r">
              <div className="home-box-label">대기 신청</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <div className="home-box-val">{wait}</div>
                <div className="home-box-unit">건</div>
              </div>
            </div>
          </div>

          <div className="menu-grid">
            <button className="menu-btn" onClick={() => goPage("waiting")}>
              <div className="menu-icon menu-icon-r">⏳</div>
              <div className="menu-text">
                <div className="menu-title">대기 신청 현황</div>
                <div className="menu-sub">확정·취소 처리</div>
              </div>
              <div className="menu-cnt">{wait}</div>
              <div className="menu-arr">›</div>
            </button>

            <button className="menu-btn" onClick={() => goPage("today")}>
              <div className="menu-icon menu-icon-b">📅</div>
              <div className="menu-text">
                <div className="menu-title">오늘 운행</div>
                <div className="menu-sub">오늘 확정 {confirmedToday}건</div>
              </div>
              <div className="menu-arr">›</div>
            </button>

            <button className="menu-btn" onClick={() => goPage("monthly")}>
              <div className="menu-icon menu-icon-g">🗓</div>
              <div className="menu-text">
                <div className="menu-title">월별 운행 현황</div>
                <div className="menu-sub">주간 캘린더로 현황 보기</div>
              </div>
              <div className="menu-arr">›</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
