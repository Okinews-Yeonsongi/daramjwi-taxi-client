"use client";

import { useEffect, useState } from "react";
import { getMyReservations, cancelMyReservation, ApiCallError } from "@/lib/api";
import type { MyReservation, ReservationStatus } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { useCitizen } from "./ctx";

const LABEL: Record<ReservationStatus, string> = {
  waiting: "대기중",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
};

export default function CitizenMyReservations() {
  const { goScreen, tick, bump } = useCitizen();
  const toast = useToast();
  const [list, setList] = useState<MyReservation[] | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyReservation | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let on = true;
    setList(null);
    getMyReservations()
      .then((r) => on && setList(r.reservations))
      .catch((e) => {
        if (!on) return;
        setList([]);
        toast(e instanceof ApiCallError ? e.message : "예약을 불러오지 못했어요");
      });
    return () => {
      on = false;
    };
  }, [tick, toast]);

  async function doCancel() {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await cancelMyReservation(cancelTarget.id);
      toast("예약을 취소했어요");
      setCancelTarget(null);
      bump();
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "취소에 실패했어요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen active">
      <div className="screen-top-bar">
        <div className="screen-top-title">내 예약 현황</div>
      </div>
      <div className="scroll-content">
        <div className="content-pad">
          {list === null ? (
            <div className="center-fill" style={{ minHeight: 200 }}>
              <div className="spinner" />
            </div>
          ) : list.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
              <div style={{ fontSize: "clamp(16px,4.5vw,20px)", fontWeight: 700, color: "var(--text-muted)" }}>
                예약 내역이 없어요
              </div>
            </div>
          ) : (
            list.map((r) => {
              const st = r.effective_status;
              const cancellable = st === "waiting" || st === "confirmed";
              return (
                <div className="res-card" key={r.id}>
                  <div className="res-card-top">
                    <span
                      className={`res-badge ${st === "confirmed" ? "badge-confirmed" : st === "waiting" ? "badge-waiting" : ""}`}
                      style={st === "completed" ? { background: "#EEE", color: "#777" } : undefined}
                    >
                      {LABEL[st]}
                    </span>
                    {cancellable && (
                      <button className="res-cancel-btn" onClick={() => setCancelTarget(r)}>
                        취소하기
                      </button>
                    )}
                  </div>
                  <div className="res-route">
                    {r.departure?.name ?? "?"} → {r.arrival?.name ?? "?"}
                  </div>
                  <div className="res-detail">
                    📅 {fmtDate(r.reservation_date)} {r.time_label ?? fmtTime(r.hour, r.departure_minute)}
                    <br />
                    👥 {r.persons}명{r.vehicle_code ? ` · ${r.vehicle_code}호차` : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="action-bar-single">
        <button className="btn-home-yellow" onClick={() => goScreen("home")}>
          ← 홈으로
        </button>
      </div>

      {cancelTarget && (
        <div className="modal-bg" onClick={() => !busy && setCancelTarget(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontSize: "clamp(19px,5vw,23px)", fontWeight: 900, textAlign: "center", margin: "4px 0 8px", color: "var(--text)" }}>
              예약을 취소할까요?
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ fontSize: "clamp(14px,3.8vw,16px)", fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                {cancelTarget.departure?.name} → {cancelTarget.arrival?.name}
              </div>
              <div style={{ fontSize: "clamp(12px,3vw,14px)", color: "var(--text-muted)" }}>
                📅 {fmtDate(cancelTarget.reservation_date)}{" "}
                {cancelTarget.time_label ?? fmtTime(cancelTarget.hour, cancelTarget.departure_minute)} · 👥{" "}
                {cancelTarget.persons}명
              </div>
            </div>
            <div className="confirm-btns">
              <button className="btn-outline" onClick={() => setCancelTarget(null)} disabled={busy}>
                돌아가기
              </button>
              <button className="btn-primary" style={{ background: "var(--red)" }} onClick={doCancel} disabled={busy}>
                {busy ? "취소 중…" : "취소하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
