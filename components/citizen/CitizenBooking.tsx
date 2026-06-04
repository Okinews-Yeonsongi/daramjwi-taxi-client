"use client";

import { useEffect, useState } from "react";
import {
  getLocations,
  getAvailability,
  getSeats,
  createMyReservation,
  ApiCallError,
} from "@/lib/api";
import type { Location, LocationCategory, AvailabilitySlot } from "@/lib/types";
import { kstDate, ymd, fmtDate, fmtTime, categoryLabel, DAYS } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { useCitizen } from "./ctx";

const STEPS = ["날짜", "출발지", "도착지", "시간", "인원"];
const CAP = 4;

const opposite = (c: LocationCategory): LocationCategory =>
  c === "cheongsanmyeon" ? "eupnae" : "cheongsanmyeon";

export default function CitizenBooking() {
  const { goScreen, bump, residentName } = useCitizen();
  const toast = useToast();

  const [locs, setLocs] = useState<Location[] | null>(null);
  const [step, setStep] = useState(1); // 1~5

  const [date, setDate] = useState("");
  const [departCat, setDepartCat] = useState<LocationCategory | "">("");
  const [departId, setDepartId] = useState(0);
  const [arriveId, setArriveId] = useState(0);
  const [hour, setHour] = useState(0);
  const [persons, setPersons] = useState(0);

  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [seatMax, setSeatMax] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* 지역 목록 */
  useEffect(() => {
    let on = true;
    getLocations()
      .then((r) => on && setLocs(r.locations))
      .catch(() => on && toast("지역 정보를 불러오지 못했어요"));
    return () => {
      on = false;
    };
  }, [toast]);

  /* 시간(4단계) */
  useEffect(() => {
    if (step !== 4 || !date || !departCat) return;
    let on = true;
    setSlots(null);
    getAvailability(date, departCat)
      .then((r) => on && setSlots(r.slots))
      .catch((e) => {
        if (!on) return;
        setSlots([]);
        toast(e instanceof ApiCallError ? e.message : "시간 정보를 불러오지 못했어요");
      });
    return () => {
      on = false;
    };
  }, [step, date, departCat, toast]);

  /* 좌석(5단계) */
  useEffect(() => {
    if (step !== 5 || !date || !hour || !departCat) return;
    let on = true;
    setSeatMax(null);
    getSeats(date, hour, departCat)
      .then((r) => {
        if (!on) return;
        setSeatMax(r.remaining);
        setPersons((p) => (p > r.remaining ? 0 : p));
      })
      .catch((e) => {
        if (!on) return;
        setSeatMax(CAP);
        toast(e instanceof ApiCallError ? e.message : "좌석 정보를 불러오지 못했어요");
      });
    return () => {
      on = false;
    };
  }, [step, date, hour, departCat, toast]);

  const departList = departCat ? (locs ?? []).filter((l) => l.category === departCat) : [];
  const arriveCat = departCat ? opposite(departCat) : "";
  const arriveList = arriveCat ? (locs ?? []).filter((l) => l.category === arriveCat) : [];
  const dep = (locs ?? []).find((l) => l.id === departId) ?? null;
  const arr = (locs ?? []).find((l) => l.id === arriveId) ?? null;

  function resetAll() {
    setStep(1);
    setDate("");
    setDepartCat("");
    setDepartId(0);
    setArriveId(0);
    setHour(0);
    setPersons(0);
    setSlots(null);
    setSeatMax(null);
    setConfirmOpen(false);
  }

  function goHome() {
    setSuccess(false);
    resetAll();
    bump();
    goScreen("home");
  }

  async function submit() {
    if (!date || !hour || !departId || !arriveId || persons < 1) return;
    setSubmitting(true);
    try {
      await createMyReservation({
        date,
        hour,
        departure_id: departId,
        arrival_id: arriveId,
        persons,
      });
      setConfirmOpen(false);
      setSuccess(true);
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "신청에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  }

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = kstDate(i);
    return { iso: ymd(d), d, isToday: i === 0 };
  });

  /* 단계별 다음 버튼 활성 조건 */
  const canNext =
    (step === 1 && !!date) ||
    (step === 2 && !!departId) ||
    (step === 3 && !!arriveId) ||
    (step === 4 && !!hour) ||
    (step === 5 && persons > 0);

  return (
    <div className="screen active">
      <div className="booking-header">
        <button className="home-btn" onClick={() => goScreen("home")}>
          ← 홈
        </button>
        <span className="booking-header-title">탑승 신청</span>
      </div>

      <StepBar current={step - 1} />

      <div className="scroll-content">
        <div className="content-pad">
          {/* 1: 날짜 */}
          {step === 1 && (
            <>
              <div className="mt">언제 탑승하실 건가요?</div>
              <div className="msub">날짜를 선택해주세요</div>
              <div className="selected-date-box">
                <div style={{ fontSize: 22 }}>📅</div>
                <div className="text">
                  {date ? `✅ ${fmtDate(date)} 선택됨` : "아래에서 날짜를 골라주세요"}
                </div>
              </div>
              <div className="date-list">
                {dates.map(({ iso, d, isToday }) => {
                  const dow = d.getUTCDay();
                  const sel = date === iso;
                  const color = sel
                    ? "white"
                    : dow === 0
                      ? "var(--red)"
                      : dow === 6
                        ? "var(--blue)"
                        : "var(--text)";
                  return (
                    <div
                      key={iso}
                      className={`date-card${sel ? " selected" : ""}`}
                      onClick={() => {
                        setDate(iso);
                        setHour(0);
                        setPersons(0);
                      }}
                    >
                      <div className="dc-left">
                        {isToday ? (
                          <div className="dc-today-badge">오늘</div>
                        ) : (
                          <div className="dc-dow" style={{ color }}>
                            {DAYS[dow]}요일
                          </div>
                        )}
                        <div className="dc-num" style={{ color }}>
                          {d.getUTCDate()}
                        </div>
                      </div>
                      <div className="dc-right">
                        <div className="dc-full">
                          {isToday ? "오늘 · " : ""}
                          {d.getUTCMonth() + 1}월 {d.getUTCDate()}일
                        </div>
                      </div>
                      <div className="dc-check">✓</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 2: 출발지 */}
          {step === 2 && (
            <>
              <div className="mt">어느 방향인가요?</div>
              <div className="msub">방향을 먼저 선택해주세요</div>
              <div className="dir-grid-big">
                <button
                  className={`dir-btn-big${departCat === "cheongsanmyeon" ? " on" : ""}`}
                  onClick={() => {
                    setDepartCat("cheongsanmyeon");
                    setDepartId(0);
                    setArriveId(0);
                  }}
                >
                  <div className="dir-em-big">🏡</div>
                  <div className="dir-label-big">청산 → 읍내</div>
                  <div className="dir-sub-big">마을에서 출발</div>
                </button>
                <button
                  className={`dir-btn-big${departCat === "eupnae" ? " on" : ""}`}
                  onClick={() => {
                    setDepartCat("eupnae");
                    setDepartId(0);
                    setArriveId(0);
                  }}
                >
                  <div className="dir-em-big">🏥</div>
                  <div className="dir-label-big">읍내 → 청산</div>
                  <div className="dir-sub-big">읍내에서 출발</div>
                </button>
              </div>

              {departCat && (
                <div style={{ marginTop: 4 }}>
                  <span className="lbl-big">출발지 ({categoryLabel(departCat)}) 선택</span>
                  {locs === null ? (
                    <div className="center-fill" style={{ minHeight: 80 }}>
                      <div className="spinner" />
                    </div>
                  ) : (
                    <div>
                      {departList.map((l) => (
                        <button
                          key={l.id}
                          className={`loc-opt-big${departId === l.id ? " on" : ""}`}
                          onClick={() => setDepartId(l.id)}
                        >
                          <span className="loc-em">{l.emoji || "📍"}</span>
                          <span className="loc-label">{l.name}</span>
                          <span className="loc-check">✓</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 3: 도착지 */}
          {step === 3 && (
            <>
              <div className="mt">도착지를 선택하세요</div>
              <div className="msub">
                {departCat && arriveCat
                  ? `${categoryLabel(departCat)} 출발 → ${categoryLabel(arriveCat)} 도착, 장소를 선택해주세요`
                  : ""}
              </div>
              <div>
                {arriveList.map((l) => (
                  <button
                    key={l.id}
                    className={`loc-opt-big${arriveId === l.id ? " on" : ""}`}
                    onClick={() => setArriveId(l.id)}
                  >
                    <span className="loc-em">{l.emoji || "📍"}</span>
                    <span className="loc-label">{l.name}</span>
                    <span className="loc-check">✓</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 4: 시간 */}
          {step === 4 && (
            <>
              <div className="mt">몇 시에 타실 건가요?</div>
              <div className="msub">운행 시간을 선택해주세요</div>
              {slots === null ? (
                <div className="center-fill" style={{ minHeight: 160 }}>
                  <div className="spinner" />
                </div>
              ) : slots.length === 0 ? (
                <div className="empty">이 날짜에는 가능한 시간이 없어요</div>
              ) : (
                <TimeChooser
                  slots={slots}
                  selected={hour}
                  onPick={(h) => {
                    setHour(h);
                    setPersons(0);
                  }}
                />
              )}
            </>
          )}

          {/* 5: 인원 */}
          {step === 5 && (
            <>
              <div className="mt">몇 명이 타시나요?</div>
              <div className="msub">탑승 인원을 선택해주세요</div>
              {seatMax !== null && seatMax < CAP && (
                <div className="remain-notice" style={{ display: "block" }}>
                  ⚠️ 이 시간대는 {seatMax}명까지만 탑승 신청할 수 있어요.
                </div>
              )}
              {seatMax === null ? (
                <Spinner />
              ) : (
                <div className="person-grid">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      className={`person-pick-btn${persons === n ? " selected" : ""}${n > seatMax ? " disabled" : ""}`}
                      onClick={() => n <= seatMax && setPersons(n)}
                    >
                      <div className="ppb-num">{n}명</div>
                      <div className="ppb-icons">{"🧑".repeat(n)}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 액션바 */}
      {step === 1 ? (
        <div className="action-bar-single">
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            disabled={!canNext}
            onClick={() => setStep(2)}
          >
            다음 →
          </button>
        </div>
      ) : (
        <div className="action-bar">
          <button className="btn-prev" onClick={() => setStep(step - 1)}>
            ← 이전
          </button>
          <button
            className="btn-primary"
            disabled={!canNext}
            onClick={() => (step === 5 ? setConfirmOpen(true) : setStep(step + 1))}
          >
            {step === 5 ? "신청 확인하기 ✓" : "다음 →"}
          </button>
        </div>
      )}

      {/* 확인 모달 */}
      {confirmOpen && dep && arr && (
        <div className="modal-bg" onClick={() => !submitting && setConfirmOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontSize: "clamp(20px,5vw,24px)", fontWeight: 900, textAlign: "center", margin: "4px 0 18px", color: "var(--text)" }}>
              신청 내용을 확인해주세요
            </div>
            {[
              ["📅 탑승 날짜", fmtDate(date)],
              ["🚏 출발지", dep.name],
              ["📍 도착지", arr.name],
              ["🕐 탑승 시간", fmtTime(hour)],
              ["👥 인원", `${persons}명`],
            ].map(([k, v]) => (
              <div className="confirm-row" key={k}>
                <span className="confirm-label">{k}</span>
                <span className="confirm-value">{v}</span>
              </div>
            ))}
            <div className="confirm-btns">
              <button className="btn-outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                돌아가기
              </button>
              <button className="btn-primary" onClick={submit} disabled={submitting}>
                {submitting ? "신청 중…" : "신청하기 ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 완료 화면 */}
      {success && (
        <div className="success-screen show">
          <div className="success-anim">🎉</div>
          <div style={{ fontSize: "clamp(24px,7vw,32px)", fontWeight: 900, color: "var(--text)", margin: "16px 0 8px" }}>
            탑승 신청 완료!
          </div>
          <div style={{ fontSize: "clamp(15px,4vw,19px)", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 26 }}>
            신청이 접수되었어요.
            <br />
            담당자 확인 후 연락드릴게요.
          </div>
          {dep && arr && (
            <div className="success-summary">
              <div className="summary-row">
                <span className="summary-icon">📅</span>
                <span className="summary-text">
                  {fmtDate(date)} {fmtTime(hour)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-icon">🚏</span>
                <span className="summary-text">
                  {dep.name} → {arr.name}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-icon">👥</span>
                <span className="summary-text">{persons}명</span>
              </div>
            </div>
          )}
          <button className="btn-home-yellow" onClick={goHome}>
            홈으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}

function StepBar({ current }: { current: number }) {
  return (
    <div className="step-bar">
      {STEPS.map((label, i) => (
        <span key={label} style={{ display: "contents" }}>
          {i > 0 && <div className={`step-line${i <= current ? " done" : ""}`} />}
          <div className="step-wrap">
            <div className={`step-dot ${i < current ? "done" : i === current ? "current" : ""}`}>
              {i < current ? "✓" : i + 1}
            </div>
            <div className={`step-label ${i < current ? "done" : i === current ? "current" : ""}`}>
              {label}
            </div>
          </div>
        </span>
      ))}
    </div>
  );
}

function TimeChooser({
  slots,
  selected,
  onPick,
}: {
  slots: AvailabilitySlot[];
  selected: number;
  onPick: (h: number) => void;
}) {
  const avail = slots.filter((s) => s.available);
  const carpoolOnly = avail.length > 0 && !avail.some((s) => s.remaining === CAP);

  const am = slots.filter((s) => s.hour < 12);
  const pm = slots.filter((s) => s.hour >= 12);

  const card = (s: AvailabilitySlot) => {
    const closed = s.isPast || !s.available;
    const right = s.isPast ? "지난시간" : !s.available ? "마감" : `남은 ${s.remaining}석`;
    if (closed) {
      return (
        <button key={s.hour} className="time-card time-card-full" disabled>
          <span className="time-main">{fmtTime(s.hour)}</span>
          <span className="time-right">{right}</span>
        </button>
      );
    }
    return (
      <button
        key={s.hour}
        className={`time-card${selected === s.hour ? " on" : ""}`}
        onClick={() => onPick(s.hour)}
      >
        <span className="time-main">{fmtTime(s.hour)}</span>
        <span className="time-remain">{right}</span>
      </button>
    );
  };

  return (
    <>
      {carpoolOnly && (
        <div className="info-note">
          🚐 이 날짜는 신규 운행(하루 4회)이 모두 찼어요. 자리가 남은 기존 운행에만 <b>합승</b>으로 신청할 수
          있어요.
        </div>
      )}
      {am.length > 0 && <div className="time-section-label">🌅 오전</div>}
      {am.map(card)}
      {pm.length > 0 && (
        <div className="time-section-label" style={{ marginTop: 20 }}>
          🌇 오후
        </div>
      )}
      {pm.map(card)}
    </>
  );
}

function Spinner() {
  return (
    <div className="center-fill" style={{ minHeight: 140 }}>
      <div className="spinner" />
    </div>
  );
}
