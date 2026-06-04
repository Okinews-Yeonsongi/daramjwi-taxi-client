"use client";

import { useEffect, useState } from "react";
import { getVillageStats, ApiCallError } from "@/lib/api";
import type { VillageStats } from "@/lib/types";
import { fmtDateLong, todayStr } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { useCitizen } from "./ctx";

function Stat({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="vstat-card">
      <div style={{ fontSize: "clamp(15px,4vw,18px)", fontWeight: 700, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: "clamp(34px,9vw,44px)", fontWeight: 900, color, lineHeight: 1 }}>
        {value} <span style={{ fontSize: "clamp(16px,4vw,20px)" }}>{unit}</span>
      </div>
    </div>
  );
}

export default function CitizenVillage() {
  const { goScreen, tick } = useCitizen();
  const toast = useToast();
  const [stats, setStats] = useState<VillageStats | null>(null);

  useEffect(() => {
    let on = true;
    setStats(null);
    getVillageStats()
      .then((s) => on && setStats(s))
      .catch((e) => on && toast(e instanceof ApiCallError ? e.message : "마을 현황을 불러오지 못했어요"));
    return () => {
      on = false;
    };
  }, [tick, toast]);

  return (
    <div className="screen active">
      <div className="screen-top-bar">
        <div className="screen-top-title">마을 현황</div>
        <div className="screen-top-sub">{fmtDateLong(todayStr())}</div>
      </div>
      <div className="scroll-content">
        <div style={{ padding: "20px clamp(14px,4vw,18px) 110px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: "clamp(16px,4.5vw,19px)", fontWeight: 800, color: "var(--text)" }}>
            ✅ 이번 달 운행 현황이에요
          </div>
          {stats === null ? (
            <div className="center-fill" style={{ minHeight: 220 }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              <Stat label="이번 달 잔여" value={stats.monthly.remaining} unit="회" color="var(--primary)" />
              <Stat label="이번 달 탑승자" value={stats.monthly.passengers} unit="명" color="var(--primary)" />
              <Stat label="오늘 운행" value={stats.daily.used} unit="회" color="var(--green)" />
              <Stat label="일평균 탑승자" value={stats.monthly.avg_passengers_per_run} unit="명" color="var(--green)" />
            </>
          )}
        </div>
      </div>
      <div className="action-bar-single">
        <button className="btn-home-yellow" onClick={() => goScreen("home")}>
          ← 홈으로
        </button>
      </div>
    </div>
  );
}
