"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { AdminCtx, type AdminPage } from "./ctx";
import Home from "./Home";
import WaitingList from "./WaitingList";
import TodayRuns from "./TodayRuns";
import Monthly from "./Monthly";
import PhoneIntake from "./PhoneIntake";

/**
 * 로그인 이후의 기사님 화면 전체를 담당합니다.
 * - 현재 페이지 상태 관리 (홈/대기/오늘/월별/전화신청)
 * - 실시간 동기화: reservations 테이블 변경 → tick 증가 → 각 화면 자동 갱신
 * - AdminCtx 제공
 */
export default function AdminShell({
  token,
  adminName,
  onLogout,
}: {
  token: string;
  adminName: string;
  onLogout: () => void;
}) {
  const [page, setPage] = useState<AdminPage>("home");
  const [tick, setTick] = useState(0);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 데이터 변경 신호. 짧게 디바운스해 연속 이벤트를 한 번으로 묶음.
  function bump() {
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
    bumpTimer.current = setTimeout(() => setTick((t) => t + 1), 150);
  }

  /* 실시간 구독 */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    // 로그인 시 setAuth 했지만, 토큰 갱신/재마운트 대비해 한 번 더 보장.
    sb.realtime.setAuth(token);

    const channel = sb
      .channel("admin-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => bump(),
      )
      .subscribe();

    return () => {
      if (bumpTimer.current) clearTimeout(bumpTimer.current);
      sb.removeChannel(channel);
    };
  }, [token]);

  const goPage = (p: AdminPage) => setPage(p);

  return (
    <AdminCtx.Provider value={{ goPage, tick, bump, adminName, onLogout }}>
      {page === "home" && <Home />}
      {page === "waiting" && <WaitingList />}
      {page === "today" && <TodayRuns />}
      {page === "monthly" && <Monthly />}
      {page === "manual" && <PhoneIntake />}
    </AdminCtx.Provider>
  );
}
