"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { CitizenCtx, type CitizenScreen } from "./ctx";
import CitizenHome from "./CitizenHome";
import CitizenBooking from "./CitizenBooking";
import CitizenToday from "./CitizenToday";
import CitizenVillage from "./CitizenVillage";
import CitizenMyReservations from "./CitizenMyReservations";

/** 로그인 이후 주민(시민) 화면 전체. 실시간으로 예약 변경을 반영합니다. */
export default function CitizenShell({
  token,
  residentName,
  onLogout,
}: {
  token: string;
  residentName: string;
  onLogout: () => void;
}) {
  const [screen, setScreen] = useState<CitizenScreen>("home");
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function bump() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTick((t) => t + 1), 150);
  }

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.realtime.setAuth(token);
    const channel = sb
      .channel("citizen-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => bump())
      .subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      sb.removeChannel(channel);
    };
  }, [token]);

  return (
    <CitizenCtx.Provider value={{ goScreen: setScreen, tick, bump, residentName, onLogout }}>
      {screen === "home" && <CitizenHome />}
      {screen === "book" && <CitizenBooking />}
      {screen === "today" && <CitizenToday />}
      {screen === "village" && <CitizenVillage />}
      {screen === "my" && <CitizenMyReservations />}
    </CitizenCtx.Provider>
  );
}
