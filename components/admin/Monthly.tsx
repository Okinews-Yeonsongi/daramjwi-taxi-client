"use client";

import { useEffect, useState, useCallback } from "react";
import { getStats, getReservations, ApiCallError } from "@/lib/api";
import type { AdminStats, AdminReservation, ReservationStatus } from "@/lib/types";
import { DAYS, kstDate, ymd, todayStr, weekStartOf, weekOfMonth, fmtTime } from "@/lib/format";
import { useAdmin } from "./ctx";

const MONTHLY_LIMIT = 112;
const STATUS_LABEL: Partial<Record<ReservationStatus, string>> = {
  waiting: "대기",
  confirmed: "확정",
  completed: "완료",
};
const STATUS_CLASS: Record<ReservationStatus, string> = {
  waiting: "bw",
  confirmed: "bc",
  completed: "bd2cls",
  cancelled: "bx",
};

export default function Monthly() {
  const { goPage, tick } = useAdmin();
  const [weekBase, setWeekBase] = useState<Date>(() => weekStartOf(kstDate()));
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selDay, setSelDay] = useState<string | null>(null);

  // 월 통계 (이번 달 기준 — weekBase 의 월)
  const monthKey = `${weekBase.getUTCFullYear()}-${String(weekBase.getUTCMonth() + 1).padStart(2, "0")}`;
  useEffect(() => {
    let alive = true;
    getStats(monthKey)
      .then((s) => alive && setStats(s))
      .catch(() => alive && setStats(null));
    return () => {
      alive = false;
    };
  }, [monthKey, tick]);

  const runsByDay = new Map<string, number>();
  stats?.by_day.forEach((d) => runsByDay.set(d.date, d.runs));

  const weekNum = weekOfMonth(new Date(weekBase.getTime() + 3 * 86400000));
  const monthLabel = `${new Date(weekBase.getTime() + 3 * 86400000).getUTCMonth() + 1}월 ${weekNum}주차`;

  const remainingRuns = stats ? MONTHLY_LIMIT - stats.confirmed_runs : null;

  function moveWeek(d: number) {
    setWeekBase((b) => new Date(b.getTime() + d * 7 * 86400000));
    setSelDay(null);
  }

  return (
    <div className="pg">
      <div className="sub-ph-plain">
        <div className="sub-ph-title">🗓 월별 운행 현황</div>
      </div>
      <div className="scroller">
        <div className="week-cal">
          {/* 월 통계 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <StatBox label="이번 달 잔여" value={remainingRuns ?? "—"} unit={`/ ${MONTHLY_LIMIT}회`} />
            <StatBox label="월별 탑승자" value={stats?.confirmed_persons ?? "—"} unit="명" />
          </div>

          <div className="week-nav">
            <button className="week-nav-btn" onClick={() => moveWeek(-1)}>◀</button>
            <div className="week-label">{monthLabel}</div>
            <button className="week-nav-btn" onClick={() => moveWeek(1)}>▶</button>
          </div>

          <div className="week-grid">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(weekBase.getTime() + i * 86400000);
              const s = ymd(d);
              const isTod = s === todayStr();
              const isSel = selDay === s;
              const runs = runsByDay.get(s) ?? 0;
              return (
                <div className="wday-col" key={s}>
                  <div className="wday-h">{DAYS[d.getUTCDay()]}</div>
                  <div
                    className={"wday-cell" + (isTod ? " today" : "") + (isSel ? " sel" : "")}
                    onClick={() => setSelDay(s)}
                  >
                    <div className="wday-num">{d.getUTCDate()}</div>
                    {runs > 0 && <div className="wday-cnt">{runs}건</div>}
                    {runs > 0 && !isSel && (
                      <div className="wday-dots">
                        {Array.from({ length: Math.min(runs, 3) }).map((_, k) => (
                          <div className="dot" key={k} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selDay && <DayDetail date={selDay} tick={tick} />}
        </div>
      </div>
      <div className="bottom-bar">
        <button className="btn-home" onClick={() => goPage("home")}>
          🏠 홈으로
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value, unit }: { label: string; value: number | string; unit: string }) {
  return (
    <div
      style={{
        background: "var(--green-light)",
        border: "1.5px solid rgba(26,122,74,0.3)",
        borderRadius: "var(--radius-sm)",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green-dark)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: "var(--green)" }}>{value}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--green-dark)" }}>{unit}</span>
      </div>
    </div>
  );
}

function DayDetail({ date, tick }: { date: string; tick: number }) {
  const [list, setList] = useState<AdminReservation[] | null>(null);

  const load = useCallback(() => {
    let alive = true;
    setList(null);
    getReservations({ date })
      .then((r) => alive && setList(r.reservations.filter((x) => x.effective_status !== "cancelled")))
      .catch((e) => {
        if (alive) setList([]);
        if (e instanceof ApiCallError) console.warn(e.message);
      });
    return () => {
      alive = false;
    };
  }, [date]);

  useEffect(() => load(), [load, tick]);

  const d = new Date(date + "T00:00:00");
  return (
    <div className="week-detail" style={{ marginTop: 14 }}>
      <div className="week-detail-hd">
        📅 {d.getMonth() + 1}월 {d.getDate()}일 ({DAYS[d.getDay()]}요일)
      </div>
      <div>
        {list === null ? (
          <div className="center-fill" style={{ minHeight: 120 }}>
            <div className="spinner" />
          </div>
        ) : list.length === 0 ? (
          <div className="empty">이날 신청이 없어요</div>
        ) : (
          list.map((x) => (
            <div className="wait-item" key={x.id} style={{ cursor: "default" }}>
              <div className="wi-date-badge">{x.time_label ?? fmtTime(x.hour, x.departure_minute)}</div>
              <div className="wi-top">
                <span className="wi-name" style={{ fontSize: 18 }}>{x.resident.name ?? "—"}</span>
                <span className={"badge " + STATUS_CLASS[x.effective_status]}>
                  {STATUS_LABEL[x.effective_status] ?? ""}
                </span>
              </div>
              <div className="wi-route">
                {x.departure?.name} → {x.arrival?.name} · {x.persons}명
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
