"use client";

import { useEffect, useState, Fragment } from "react";
import {
  getLocations,
  getAvailability,
  getSeats,
  createPhoneReservation,
  ApiCallError,
} from "@/lib/api";
import type { Location, LocationCategory, AvailabilitySlot } from "@/lib/types";
import { kstDate, ymd, fmtDate, fmtTime, categoryLabel, DAYS } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { useAdmin } from "./ctx";

const CAP = 4; // 1회 정원

/** 6단계 전화 신청 입력 (기사님이 대신 접수) */
export default function PhoneIntake() {
  const { goPage, bump } = useAdmin();
  const toast = useToast();

  // 마스터: 지역 목록
  const [locs, setLocs] = useState<Location[] | null>(null);
  const [locErr, setLocErr] = useState("");

  // 단계
  const [step, setStep] = useState(1);

  // 입력 상태
  const [name, setName] = useState("");
  // 전화번호: 숫자만 입력 (하이픈 없이). 백엔드는 휴대폰(01x)만 받습니다.
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [depCat, setDepCat] = useState<LocationCategory | "">("");
  const [depId, setDepId] = useState(0);
  const [arrId, setArrId] = useState(0);
  const [hour, setHour] = useState(0);
  const [persons, setPersons] = useState(1);

  // 비동기 로드 상태
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [seatMax, setSeatMax] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* 지역 목록 1회 로드 */
  useEffect(() => {
    let alive = true;
    getLocations()
      .then((r) => alive && (setLocs(r.locations), setLocErr("")))
      .catch((e) => alive && setLocErr(e instanceof ApiCallError ? e.message : "지역 정보를 불러오지 못했어요"));
    return () => {
      alive = false;
    };
  }, []);

  /* 5단계 진입 시 가용 시간 조회 */
  useEffect(() => {
    if (step !== 5 || !date || !depCat) return;
    let alive = true;
    setSlots(null);
    getAvailability(date, depCat)
      .then((r) => alive && setSlots(r.slots))
      .catch((e) => {
        if (!alive) return;
        setSlots([]);
        toast(e instanceof ApiCallError ? e.message : "시간 정보를 불러오지 못했어요");
      });
    return () => {
      alive = false;
    };
  }, [step, date, depCat, toast]);

  /* 6단계 진입 시 남은 좌석 조회 */
  useEffect(() => {
    if (step !== 6 || !date || !hour || !depCat) return;
    let alive = true;
    setSeatMax(null);
    getSeats(date, hour, depCat)
      .then((r) => {
        if (!alive) return;
        setSeatMax(r.remaining);
        setPersons((p) => (p > r.remaining ? (r.remaining > 0 ? 1 : 0) : p));
      })
      .catch((e) => {
        if (!alive) return;
        setSeatMax(CAP);
        toast(e instanceof ApiCallError ? e.message : "좌석 정보를 불러오지 못했어요");
      });
    return () => {
      alive = false;
    };
  }, [step, date, hour, depCat, toast]);

  /* 파생 값 */
  const depList = depCat ? (locs ?? []).filter((l) => l.category === depCat) : [];
  const arrCat: LocationCategory | "" =
    depCat === "cheongsanmyeon" ? "eupnae" : depCat === "eupnae" ? "cheongsanmyeon" : "";
  const arrList = arrCat ? (locs ?? []).filter((l) => l.category === arrCat) : [];
  const dep = (locs ?? []).find((l) => l.id === depId) ?? null;
  const arr = (locs ?? []).find((l) => l.id === arrId) ?? null;

  /* 전화번호 파생값 (백엔드 검증과 동일: 휴대폰 01x 만 허용) */
  /* 전화번호: 끝 4자리 이상만 입력하면 OK (백엔드가 자유 형식 허용). 숫자만 보관. */
  const phoneValid = phone.replace(/\D/g, "").length >= 4;

  /* 단계별 '다음' 활성 조건 (주민 화면과 동일하게 버튼으로 막음) */
  const canAdvance =
    (step === 1 && !!name.trim() && phoneValid) ||
    (step === 2 && !!date) ||
    (step === 3 && !!depCat && !!depId) ||
    (step === 4 && !!arrId) ||
    (step === 5 && !!hour);

  /* 단계 이동 + 검증 */
  function go(n: number) {
    if (n > step) {
      if (step === 1) {
        if (!name.trim()) return toast("이름을 입력해주세요");
        if (!phoneValid) return toast("전화번호 끝 4자리 이상 입력해주세요");
      }
      if (step === 2 && !date) return toast("날짜를 선택해주세요");
      if (step === 3 && (!depCat || !depId)) return toast("방향과 출발지를 선택해주세요");
      if (step === 4 && !arrId) return toast("도착지를 선택해주세요");
      if (step === 5 && !hour) return toast("시간을 선택해주세요");
    }
    setStep(n);
  }

  function pickDir(cat: LocationCategory) {
    setDepCat(cat);
    setDepId(0);
    setArrId(0);
  }

  async function submit() {
    if (!name.trim() || !date || !hour || !depId || !arrId) {
      return toast("모든 항목을 선택해주세요");
    }
    setSubmitting(true);
    try {
      await createPhoneReservation({
        name: name.trim(),
        phone,
        date,
        hour,
        departure_id: depId,
        arrival_id: arrId,
        persons,
      });
      toast(`✅ ${name.trim()} 님 신청이 접수됐어요`);
      bump();
      goPage("home");
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "접수에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  }

  /* 7일치 날짜 */
  const dates = Array.from({ length: 3 }, (_, i) => {
    const d = kstDate(i);
    return { iso: ymd(d), d, isToday: i === 0 };
  });

  return (
    <div className="pg">
      <div className="manual-header">
        <button className="back-arrow" onClick={() => goPage("home")} aria-label="홈으로">
          ←
        </button>
        <div style={{ fontSize: "clamp(16px,4.5vw,20px)", fontWeight: 900, color: "var(--text)" }}>
          📞 전화 신청 입력
        </div>
      </div>

      <div className="scroller">
        <div className="mb">
          {/* 단계 표시 */}
          <div className="sth">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Fragment key={`sd-${i}`}>
                <div className={`sd${i < step ? " dn" : i === step ? " on" : ""}`}>{i}</div>
                {i < 6 && <div className={`stl${i < step ? " dn" : ""}`} />}
              </Fragment>
            ))}
          </div>

          {locErr && <div className="login-err" style={{ marginBottom: 12 }}>{locErr}</div>}

          {/* 1단계: 이름·연락처 */}
          {step === 1 && (
            <div className="ms">
              <div className="mt">누가 전화하셨나요?</div>
              <div className="msub">이름과 연락처를 입력해주세요</div>
              <input
                className="fi"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <input
                className="fi"
                placeholder="전화번호 (끝 4자리만 입력해도 돼요)"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
              <div className="ph-hint">📱 전화로 들은 번호 그대로 — 일부(끝 4자리 이상)만 입력해도 접수돼요</div>
            </div>
          )}

          {/* 2단계: 날짜 */}
          {step === 2 && (
            <div className="ms">
              <div className="mt">언제 타실 건가요?</div>
              <div className="msub">날짜를 선택해주세요</div>
              <div>
                {dates.map(({ iso, d, isToday }) => {
                  const dow = d.getUTCDay();
                  const numColor =
                    isToday || (dow !== 0 && dow !== 6)
                      ? "var(--text)"
                      : dow === 0
                        ? "var(--red)"
                        : "#1A6EC4";
                  return (
                    <div
                      key={iso}
                      className={`date-card-big${dow === 0 || dow === 6 ? " wknd" : ""}${date === iso ? " on" : ""}`}
                      onClick={() => setDate(iso)}
                    >
                      <div className="dc-left">
                        {isToday ? (
                          <div className="dc-today-badge">오늘</div>
                        ) : (
                          <div className="dc-dow" style={{ color: numColor }}>
                            {DAYS[dow]}요일
                          </div>
                        )}
                        <div className="dc-num" style={{ color: numColor }}>
                          {d.getUTCDate()}
                        </div>
                      </div>
                      <div className="dc-right">
                        <div className="dc-full">
                          {d.getUTCMonth() + 1}월 {d.getUTCDate()}일
                        </div>
                      </div>
                      <div className="dc-check">✓</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3단계: 방향·출발지 */}
          {step === 3 && (
            <div className="ms">
              <div className="mt">어느 방향인가요?</div>
              <div className="msub">방향을 먼저 선택해주세요</div>
              <div className="dir-grid-big">
                <button
                  className={`dir-btn-big${depCat === "cheongsanmyeon" ? " on" : ""}`}
                  onClick={() => pickDir("cheongsanmyeon")}
                >
                  <div className="dir-em-big">🏡</div>
                  <div className="dir-label-big">청산 → 읍내</div>
                  <div className="dir-sub-big">마을에서 출발</div>
                </button>
                <button
                  className={`dir-btn-big${depCat === "eupnae" ? " on" : ""}`}
                  onClick={() => pickDir("eupnae")}
                >
                  <div className="dir-em-big">🏥</div>
                  <div className="dir-label-big">읍내 → 청산</div>
                  <div className="dir-sub-big">읍내에서 출발</div>
                </button>
              </div>

              {depCat && (
                <div style={{ marginTop: 4 }}>
                  <span className="lbl-big">출발지 ({categoryLabel(depCat)}) 선택</span>
                  {locs === null ? (
                    <div className="center-fill" style={{ minHeight: 80 }}>
                      <div className="spinner" />
                    </div>
                  ) : (
                    <div>
                      {depList.map((l) => (
                        <button
                          key={l.id}
                          className={`loc-opt-big${depId === l.id ? " on" : ""}`}
                          onClick={() => setDepId(l.id)}
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
            </div>
          )}

          {/* 4단계: 도착지 */}
          {step === 4 && (
            <div className="ms">
              <div className="mt">도착지를 선택하세요</div>
              <div className="msub">
                {depCat && arrCat
                  ? `${categoryLabel(depCat)} 출발 → ${categoryLabel(arrCat)} 도착, 장소를 선택해주세요`
                  : ""}
              </div>
              <div>
                {arrList.map((l) => (
                  <button
                    key={l.id}
                    className={`loc-opt-big${arrId === l.id ? " on" : ""}`}
                    onClick={() => setArrId(l.id)}
                  >
                    <span className="loc-em">{l.emoji || "📍"}</span>
                    <span className="loc-label">{l.name}</span>
                    <span className="loc-check">✓</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5단계: 시간 */}
          {step === 5 && (
            <div className="ms">
              <div className="mt">몇 시에 타실 건가요?</div>
              <div className="msub">운행 시간을 선택해주세요</div>
              {slots === null ? (
                <div className="center-fill" style={{ minHeight: 160 }}>
                  <div className="spinner" />
                </div>
              ) : slots.length === 0 ? (
                <div className="empty">이 날짜에는 가능한 시간이 없어요</div>
              ) : (
                <>
                  {(() => {
                    const avail = slots.filter((s) => s.available);
                    const carpoolOnly = avail.length > 0 && !avail.some((s) => s.remaining === 4);
                    return carpoolOnly ? (
                      <div className="info-note">
                        🚐 이 날짜는 신규 운행(하루 4회)이 모두 찼어요. 자리가 남은 기존 운행에만 <b>합승</b>으로 접수할
                        수 있어요.
                      </div>
                    ) : null;
                  })()}
                  <TimeList
                    slots={slots}
                    selected={hour}
                    onPick={(h) => {
                      setHour(h);
                      setPersons(1);
                    }}
                  />
                </>
              )}
            </div>
          )}

          {/* 6단계: 인원 + 확인 */}
          {step === 6 && (
            <div className="ms">
              <div className="mt">몇 명이 타시나요?</div>
              <div className="msub">탑승 인원을 선택해주세요</div>

              {seatMax !== null && seatMax < CAP && (
                <div className="prs-warn">
                  ⚠️ 이 시간대에는&nbsp;<strong>{seatMax}명</strong>&nbsp;까지만 신청할 수 있어요
                </div>
              )}

              {seatMax === null ? (
                <div className="center-fill" style={{ minHeight: 80 }}>
                  <div className="spinner" />
                </div>
              ) : (
                <div className="pr-row">
                  {[1, 2, 3, 4].map((n) =>
                    n > seatMax ? (
                      <div className="pb-full" key={n}>
                        {n}명
                      </div>
                    ) : (
                      <button
                        key={n}
                        className={`pb${persons === n ? " on" : ""}`}
                        onClick={() => setPersons(n)}
                      >
                        {n}명
                      </button>
                    ),
                  )}
                </div>
              )}

              {dep && arr && hour > 0 && (
                <div className="sumbox">
                  <div className="sum-t">✅ 신청 내용 확인</div>
                  <div>
                    <SumRow k="이름" v={name.trim()} />
                    <SumRow k="날짜·시간" v={`${fmtDate(date)} ${fmtTime(hour)}`} />
                    <SumRow k="방향" v={`${categoryLabel(depCat as LocationCategory)} → ${categoryLabel(arrCat as LocationCategory)}`} />
                    <SumRow k="출발지" v={dep.name} />
                    <SumRow k="도착지" v={arr.name} />
                    <SumRow k="인원" v={`${persons}명`} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="pg-foot">
        {step > 1 && (
          <button className="bb" onClick={() => go(step - 1)}>
            ← 이전
          </button>
        )}
        {step < 6 ? (
          <button className="bn" onClick={() => go(step + 1)} disabled={!canAdvance}>
            다음 →
          </button>
        ) : (
          <button
            className="bn"
            style={{ background: "var(--green)" }}
            disabled={submitting || persons < 1}
            onClick={submit}
          >
            {submitting ? <span className="inline-spin" /> : "✓ 접수하기"}
          </button>
        )}
      </div>
    </div>
  );
}

function SumRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="sum-r">
      <span className="sum-k">{k}</span>
      <span className="sum-v">{v}</span>
    </div>
  );
}

function TimeList({
  slots,
  selected,
  onPick,
}: {
  slots: AvailabilitySlot[];
  selected: number;
  onPick: (h: number) => void;
}) {
  const am = slots.filter((s) => s.hour < 12);
  const pm = slots.filter((s) => s.hour >= 12);

  const card = (s: AvailabilitySlot) => {
    const closed = s.isPast || !s.available;
    const rightTxt = s.isPast ? "지난시간" : !s.available ? "마감" : `남은 ${s.remaining}석`;
    if (closed) {
      return (
        <button key={s.hour} className="time-card time-card-full" disabled>
          <span className="time-main">{fmtTime(s.hour)}</span>
          <span className="time-right">{rightTxt}</span>
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
        <span className="time-remain">{rightTxt}</span>
      </button>
    );
  };

  return (
    <div>
      {am.length > 0 && <div className="time-section-label">🌅 오전</div>}
      {am.map(card)}
      {pm.length > 0 && (
        <div className="time-section-label" style={{ marginTop: 20 }}>
          🌇 오후
        </div>
      )}
      {pm.map(card)}
    </div>
  );
}
