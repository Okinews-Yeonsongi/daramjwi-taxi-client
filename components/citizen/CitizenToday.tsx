"use client";

import { useEffect, useState } from "react";
import { getTodayRuns, getLocations, createMyReservation, ApiCallError } from "@/lib/api";
import type { TodayRun, Location, LocationCategory } from "@/lib/types";
import { kstDate, fmtDateLong, fmtTime, categoryLabel, todayStr } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { useCitizen } from "./ctx";

type RunState = "completed" | "running" | "recruit" | "full";

function runState(hour: number, seatsLeft: number, nowHour: number): RunState {
  if (hour < nowHour) return "completed";
  if (hour === nowHour) return "running";
  return seatsLeft > 0 ? "recruit" : "full";
}

const BADGE: Record<RunState, { text: string; bg: string; color: string; dot: string }> = {
  completed: { text: "완료", bg: "var(--green-light)", color: "var(--green-dark)", dot: "var(--green)" },
  running: { text: "운행중", bg: "#EBEBEB", color: "#888", dot: "#AAA" },
  recruit: { text: "모집중", bg: "var(--primary)", color: "white", dot: "var(--primary)" },
  full: { text: "만석", bg: "#EBEBEB", color: "#888", dot: "#AAA" },
};

export default function CitizenToday() {
  const { goScreen, tick, bump } = useCitizen();
  const toast = useToast();
  const [runs, setRuns] = useState<TodayRun[] | null>(null);
  const [locs, setLocs] = useState<Location[]>([]);
  const nowHour = kstDate().getUTCHours();

  const [join, setJoin] = useState<TodayRun | null>(null);
  const [jDep, setJDep] = useState(0);
  const [jArr, setJArr] = useState(0);
  const [jPersons, setJPersons] = useState(1);
  const [jBusy, setJBusy] = useState(false);

  useEffect(() => {
    let on = true;
    setRuns(null);
    Promise.all([getTodayRuns(), getLocations()])
      .then(([r, l]) => {
        if (!on) return;
        setRuns(r.runs);
        setLocs(l.locations);
      })
      .catch((e) => {
        if (!on) return;
        setRuns([]);
        toast(e instanceof ApiCallError ? e.message : "오늘 운행을 불러오지 못했어요");
      });
    return () => {
      on = false;
    };
  }, [tick, toast]);

  function openJoin(run: TodayRun) {
    setJoin(run);
    setJDep(0);
    setJArr(0);
    setJPersons(1);
  }

  async function submitJoin() {
    if (!join || !jDep || !jArr) return;
    setJBusy(true);
    try {
      await createMyReservation({
        date: todayStr(),
        hour: join.hour,
        departure_id: jDep,
        arrival_id: jArr,
        persons: jPersons,
      });
      toast("✅ 합승 신청이 접수됐어요");
      setJoin(null);
      bump();
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "합승 신청에 실패했어요");
    } finally {
      setJBusy(false);
    }
  }

  const depOptions = join ? locs.filter((l) => l.category === (join.origin as LocationCategory)) : [];
  const arrOptions = join ? locs.filter((l) => l.category === (join.destination as LocationCategory)) : [];

  return (
    <div className="screen active">
      <div className="screen-top-bar">
        <div className="screen-top-title">오늘 운행</div>
      </div>
      <div className="scroll-content">
        <div className="run-hero">
          <div style={{ fontSize: "clamp(20px,5vw,26px)", fontWeight: 900, color: "white" }}>✅ 정상 운행 중</div>
          <div style={{ fontSize: "clamp(13px,3.5vw,17px)", color: "rgba(255,255,255,0.85)", marginTop: 6, fontWeight: 600 }}>
            {fmtDateLong(todayStr())}
          </div>
        </div>
        <div style={{ padding: "0 clamp(14px,4vw,18px) 110px" }}>
          <div className="card">
            <div className="card-title">오늘 운행 일정</div>
            {runs === null ? (
              <div className="center-fill" style={{ minHeight: 160 }}>
                <div className="spinner" />
              </div>
            ) : runs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontWeight: 700 }}>
                오늘 운행이 없어요
              </div>
            ) : (
              runs.map((run, i) => {
                const s = runState(run.hour, run.seats_left, nowHour);
                const b = BADGE[s];
                return (
                  <div className="run-item" key={i} style={i === runs.length - 1 ? { borderBottom: "none" } : undefined}>
                    <div className="run-dot" style={{ background: b.dot }} />
                    <div className="run-info">
                      <div className="run-time">{run.time_label ?? fmtTime(run.hour)}</div>
                      <div className="run-route">
                        {categoryLabel(run.origin)} → {categoryLabel(run.destination)}
                        {s === "recruit" ? ` · 남은 ${run.seats_left}석` : ""}
                      </div>
                    </div>
                    {s === "recruit" ? (
                      <button className="run-badge recruit" onClick={() => openJoin(run)}>
                        모집중
                      </button>
                    ) : (
                      <div className="run-badge" style={{ background: b.bg, color: b.color }}>
                        {b.text}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className="action-bar-single">
        <button className="btn-home-yellow" onClick={() => goScreen("home")}>
          ← 홈으로
        </button>
      </div>

      {/* 합승 신청 시트 */}
      {join && (
        <div className="modal-bg" onClick={() => !jBusy && setJoin(null)}>
          <div className="modal-sheet" style={{ maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="ride-modal-header">
              <button className="ride-modal-back" onClick={() => !jBusy && setJoin(null)}>
                ←
              </button>
              <div>
                <div className="ride-modal-title">🚐 합승 신청</div>
                <div className="ride-modal-date">
                  {fmtDateLong(todayStr())} · {join.time_label ?? fmtTime(join.hour)}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 16 }}>
              <div className="section-sm" style={{ marginTop: 6 }}>
                🚏 출발지 ({categoryLabel(join.origin)})
              </div>
              <div className="loc-options">
                {depOptions.map((l) => (
                  <button
                    key={l.id}
                    className={`loc-opt-btn${jDep === l.id ? " selected" : ""}`}
                    onClick={() => setJDep(l.id)}
                  >
                    <span className="loc-icon">{l.emoji || "📍"}</span>
                    <span style={{ flex: 1 }}>{l.name}</span>
                    <span className="loc-check">✓</span>
                  </button>
                ))}
              </div>

              <div className="section-sm" style={{ marginTop: 16 }}>
                📍 도착지 ({categoryLabel(join.destination)})
              </div>
              <div className="loc-options">
                {arrOptions.map((l) => (
                  <button
                    key={l.id}
                    className={`loc-opt-btn${jArr === l.id ? " selected" : ""}`}
                    onClick={() => setJArr(l.id)}
                  >
                    <span className="loc-icon">{l.emoji || "📍"}</span>
                    <span style={{ flex: 1 }}>{l.name}</span>
                    <span className="loc-check">✓</span>
                  </button>
                ))}
              </div>

              <div style={{ background: "var(--bg)", borderRadius: 18, marginTop: 18, overflow: "hidden" }}>
                <div className="ride-person-row" style={{ borderTop: "none" }}>
                  <div className="ride-info-label">👥 인원</div>
                  <div className="ride-person-ctrl">
                    <button
                      className="ride-person-btn"
                      onClick={() => setJPersons((p) => Math.max(1, p - 1))}
                      disabled={jPersons <= 1}
                    >
                      −
                    </button>
                    <span className="ride-person-num">{jPersons}</span>
                    <button
                      className="ride-person-btn"
                      onClick={() => setJPersons((p) => Math.min(join.seats_left, p + 1))}
                      disabled={jPersons >= join.seats_left}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 16px",
                    borderTop: "1px solid var(--border)",
                    gap: 8,
                  }}
                >
                  <span className="ride-info-label">🪑 이 운행에 남은 자리</span>
                  <span style={{ fontWeight: 900, color: "var(--green-dark)", fontSize: "clamp(16px,4.5vw,19px)" }}>
                    {join.seats_left}석
                  </span>
                </div>
              </div>

              <button
                className="btn-home-yellow"
                style={{ marginTop: 18 }}
                disabled={!jDep || !jArr || jBusy}
                onClick={submitJoin}
              >
                {jBusy ? "신청 중…" : "합승 신청하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
