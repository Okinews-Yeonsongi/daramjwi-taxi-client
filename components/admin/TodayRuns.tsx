"use client";

import { useEffect, useState } from "react";
import { getReservations, ApiCallError } from "@/lib/api";
import type { AdminReservation, ReservationStatus } from "@/lib/types";
import { fmtTime, todayStr } from "@/lib/format";
import { useAdmin } from "./ctx";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  waiting: "대기중",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
};
const STATUS_CLASS: Record<ReservationStatus, string> = {
  waiting: "bw",
  confirmed: "bc",
  completed: "bd2cls",
  cancelled: "bx",
};

function timeLabelOf(r: AdminReservation) {
  return r.time_label ?? fmtTime(r.hour, r.departure_minute);
}

export default function TodayRuns() {
  const { goPage, tick } = useAdmin();
  const [list, setList] = useState<AdminReservation[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setList(null);
    getReservations({ date: todayStr() })
      .then((r) => {
        if (!alive) return;
        // 취소 건은 숨김. 시간 → 상태 순으로 정렬.
        const rows = r.reservations
          .filter((x) => x.effective_status !== "cancelled")
          .sort((a, b) => a.hour - b.hour || a.departure_minute - b.departure_minute);
        setList(rows);
        setErr("");
      })
      .catch((e) => {
        if (!alive) return;
        setList([]);
        setErr(e instanceof ApiCallError ? e.message : "불러오기 실패");
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  return (
    <div className="pg">
      <div className="sub-ph-plain">
        <div className="sub-ph-title">📅 오늘 운행</div>
      </div>
      <div className="scroller">
        <div style={{ padding: "4px 0 16px" }}>
          {err && (
            <div className="login-err" style={{ margin: "10px 14px" }}>
              {err}
            </div>
          )}
          {list === null ? (
            <div className="center-fill" style={{ minHeight: 200 }}>
              <div className="spinner" />
            </div>
          ) : list.length === 0 ? (
            <div className="empty">오늘 신청이 없어요</div>
          ) : (
            list.map((r) => {
              const st = r.effective_status;
              return (
                <div className="today-card" key={r.id}>
                  <div className="today-card-inner">
                    <div className="tc-date-badge">오늘 · {timeLabelOf(r)}</div>
                    <div className="tc-top">
                      <span className="tc-name-wrap">
                        <span className="tc-name">{r.resident.name ?? "이름 미상"} 님</span>
                        {r.resident.is_guest && <span className="tc-src-badge">📞 전화</span>}
                        <span className="tc-usage-badge">이달 {r.monthly_confirmed}회</span>
                      </span>
                      <span className={`badge ${STATUS_CLASS[st]}`}>{STATUS_LABEL[st]}</span>
                    </div>
                    <div className="tc-route">
                      📍 {r.departure?.name ?? "?"} → {r.arrival?.name ?? "?"}
                      <br />
                      👥 {r.persons}명
                      {r.vehicle_code ? ` · ${r.vehicle_code}호차` : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
