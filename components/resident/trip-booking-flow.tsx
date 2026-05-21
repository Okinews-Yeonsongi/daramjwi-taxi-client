"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTitle, SheetSub } from "@/components/ui/sheet";
import {
  ALL_TIMES, TIMES_AM, TIMES_PM, PLACES, CAT_NAMES, SLOT_CAPACITY,
  catToDirection, formatTimeKo, formatDateKo,
} from "@/lib/constants";
import type { CreateReservationInput } from "@/lib/dal";
import { cn } from "@/lib/utils";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export type TripPayload = Omit<
  CreateReservationInput,
  "village_id" | "resident_id" | "booked_by" | "created_by" | "is_phone_intake"
>;

interface Props {
  dates: string[]; // 선택 가능한 날짜 (ISO)
  usageMap: Record<string, number>; // `${date}|${time}` → 신청 인원 합계
  /** 확정 시 호출. 성공하면 success 화면 표시 */
  onConfirm: (payload: TripPayload) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
}

const STEPS = ["날짜", "시간", "인원", "출발지", "도착지"];

export function TripBookingFlow({ dates, usageMap, onConfirm, submitLabel = "신청하기" }: Props) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [persons, setPersons] = useState(0);
  const [departCat, setDepartCat] = useState<0 | 1 | null>(null);
  const [departLoc, setDepartLoc] = useState<string | null>(null);
  const [arriveLoc, setArriveLoc] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const arriveCat = departCat === null ? null : ((departCat === 0 ? 1 : 0) as 0 | 1);
  const remaining = (d: string, t: string) => SLOT_CAPACITY - (usageMap[`${d}|${t}`] ?? 0);
  const maxPersons = date && time ? Math.max(0, remaining(date, time)) : SLOT_CAPACITY;

  function reset() {
    setStep(0); setDate(null); setTime(null); setPersons(0);
    setDepartCat(null); setDepartLoc(null); setArriveLoc(null);
    setShowConfirm(false); setDone(false); setError(null);
  }

  function submit() {
    if (!date || !time || departCat === null || !departLoc || !arriveLoc) return;
    setError(null);
    startTransition(async () => {
      const res = await onConfirm({
        reservation_date: date,
        reservation_time: time,
        direction: catToDirection(departCat),
        depart_label: departLoc,
        arrive_label: arriveLoc,
        passenger_count: persons,
      });
      if (res.ok) { setShowConfirm(false); setDone(true); }
      else setError(res.error ?? "신청에 실패했습니다.");
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <div className="text-7xl">🎉</div>
        <h2 className="mt-4 text-2xl font-black text-ink">탑승 신청 완료!</h2>
        <p className="mt-2 leading-relaxed text-ink-muted">
          신청이 접수되었어요.<br />담당자 확인 후 안내드릴게요.
        </p>
        <div className="my-7 w-full rounded-[20px] bg-bg p-5 text-left">
          <Summary date={date!} time={time!} persons={persons} departLoc={departLoc!} arriveLoc={arriveLoc!} />
        </div>
        <Button onClick={reset}>처음으로</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepBar current={step} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-[18px] pb-28 pt-5">
        {step === 0 && (
          <>
            <H>언제 탑승하실 건가요?</H>
            <div className="flex flex-col gap-3">
              {dates.map((iso) => {
                const d = new Date(iso + "T00:00:00");
                const sel = date === iso;
                const weekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <button key={iso} onClick={() => { setDate(iso); setTime(null); setPersons(0); }}
                    className={cn("flex items-center gap-5 rounded-[20px] border-[3px] bg-white px-5 py-4 text-left shadow-sm transition",
                      sel ? "border-primary bg-primary text-white" : "border-black/10")}>
                    <div className="min-w-[64px] text-center">
                      <div className={cn("text-lg font-black leading-none", sel ? "text-white" : weekend ? "text-bad" : "text-ink-muted")}>{DOW[d.getDay()]}요일</div>
                      <div className={cn("text-5xl font-black leading-none", sel ? "text-white" : weekend ? "text-bad" : "text-ink")}>{d.getDate()}</div>
                    </div>
                    <div className={cn("flex-1 text-lg font-bold", sel ? "text-white" : "text-ink")}>{d.getMonth() + 1}월 {d.getDate()}일</div>
                    {sel && <span className="text-2xl text-white">✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <H>몇 시에 타실 건가요?</H>
            <TimeGroup label="🌅 오전" times={TIMES_AM} value={time} date={date!} remaining={remaining} onPick={(t) => { setTime(t); setPersons(0); }} />
            <div className="h-6" />
            <TimeGroup label="🌆 오후" times={TIMES_PM} value={time} date={date!} remaining={remaining} onPick={(t) => { setTime(t); setPersons(0); }} />
          </>
        )}

        {step === 2 && (
          <>
            <H>몇 명이서 타실 건가요?</H>
            {maxPersons < SLOT_CAPACITY && (
              <div className="mb-4 rounded-xl bg-bad-light px-4 py-3 text-base font-bold text-bad">
                ⚠️ 이 시간대는 {maxPersons}명까지만 신청할 수 있어요.
              </div>
            )}
            <div className="grid grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map((n) => {
                const disabled = n > maxPersons;
                const sel = persons === n;
                return (
                  <button key={n} disabled={disabled} onClick={() => setPersons(n)}
                    className={cn("flex flex-col items-center gap-2 rounded-[20px] border-[3px] bg-white px-3.5 py-6 shadow-sm transition",
                      sel ? "border-primary bg-primary-light" : "border-black/10", disabled && "pointer-events-none opacity-35")}>
                    <span className="text-3xl">{"🧑".repeat(n)}</span>
                    <span className={cn("text-2xl font-black", sel ? "text-primary-darker" : "text-ink")}>{n}명</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <H>출발지를 선택해주세요</H>
            <div className="mb-4 grid grid-cols-2 gap-3">
              {[0, 1].map((c) => (
                <button key={c} onClick={() => { setDepartCat(c as 0 | 1); setDepartLoc(null); setArriveLoc(null); }}
                  className={cn("rounded-[14px] border-[3px] bg-white px-3.5 py-5 text-center text-lg font-extrabold shadow-sm",
                    departCat === c ? "border-primary bg-primary-light text-primary-darker" : "border-black/10 text-ink")}>
                  {c === 0 ? "🏡 청산면" : "🏥 읍내"}
                  <span className="mt-1 block text-xs font-medium text-ink-muted">{c === 0 ? "우리집·마을회관" : "병원·관공서·시장"}</span>
                </button>
              ))}
            </div>
            {departCat !== null && (
              <LocOptions options={PLACES[departCat]} value={departLoc} onPick={setDepartLoc} />
            )}
          </>
        )}

        {step === 4 && (
          <>
            <H>도착지를 선택해주세요</H>
            {arriveCat !== null && (
              <div className="mb-4 flex items-center gap-3.5 rounded-[14px] bg-good-light px-5 py-4">
                <span className="text-2xl">✅</span>
                <span className="font-bold leading-relaxed text-good-dark">
                  출발지({CAT_NAMES[departCat!]}) 반대 방향인 {CAT_NAMES[arriveCat]} 지역에서 골라주세요.
                </span>
              </div>
            )}
            {arriveCat !== null && (
              <LocOptions options={PLACES[arriveCat]} value={arriveLoc} onPick={setArriveLoc} />
            )}
          </>
        )}
      </div>

      {/* 하단 액션바 */}
      <div className="absolute inset-x-0 bottom-0 border-t border-black/10 bg-white px-[18px] pb-8 pt-3.5">
        {step < 4 ? (
          <Button disabled={!canNext(step, { date, time, persons, departLoc })} onClick={() => setStep((s) => s + 1)}>
            다음 — {STEPS[step + 1]} 선택 →
          </Button>
        ) : (
          <Button disabled={!arriveLoc} onClick={() => setShowConfirm(true)}>{submitLabel} 확인하기 ✓</Button>
        )}
      </div>

      {/* 확인 모달 */}
      <Sheet open={showConfirm} onClose={() => setShowConfirm(false)}>
        <SheetTitle>신청 내용 확인</SheetTitle>
        <SheetSub>아래 내용으로 탑승을 신청할까요?</SheetSub>
        {date && time && departLoc && arriveLoc && (
          <div className="mb-1">
            <Summary date={date} time={time} persons={persons} departLoc={departLoc} arriveLoc={arriveLoc} rows />
          </div>
        )}
        {error && <p className="mb-3 text-center text-base font-bold text-bad">{error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" size="md" onClick={() => setShowConfirm(false)} disabled={pending}>수정하기</Button>
          <Button size="md" onClick={submit} disabled={pending}>{pending ? "신청 중…" : "신청하기 ✓"}</Button>
        </div>
      </Sheet>
    </div>
  );
}

function canNext(step: number, s: { date: string | null; time: string | null; persons: number; departLoc: string | null }) {
  if (step === 0) return !!s.date;
  if (step === 1) return !!s.time;
  if (step === 2) return s.persons > 0;
  if (step === 3) return !!s.departLoc;
  return true;
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-2xl font-black leading-snug text-ink">{children}</h2>;
}

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-start border-b border-black/10 bg-white px-[18px] pb-2.5 pt-3.5">
      {STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-start">
          {i > 0 && <div className={cn("mt-4 h-[3px] flex-1", i <= current ? "bg-primary" : "bg-[#E0E0E0]")} />}
          <div className="flex flex-col items-center">
            <div className={cn("flex size-9 items-center justify-center rounded-full text-base font-extrabold",
              i < current ? "bg-primary text-white" : i === current ? "bg-primary text-white ring-4 ring-primary-light" : "bg-[#E0E0E0] text-[#999]")}>
              {i < current ? "✓" : i + 1}
            </div>
            <div className="mt-1.5 text-xs font-bold text-ink-hint">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeGroup({ label, times, value, date, remaining, onPick }: {
  label: string; times: readonly string[]; value: string | null; date: string;
  remaining: (d: string, t: string) => number; onPick: (t: string) => void;
}) {
  return (
    <>
      <div className="mb-3 text-[17px] font-extrabold text-ink-muted">{label}</div>
      <div className="flex flex-col gap-2.5">
        {times.map((t) => {
          const full = remaining(date, t) <= 0;
          const sel = value === t;
          return (
            <button key={t} disabled={full} onClick={() => onPick(t)}
              className={cn("flex items-center justify-between rounded-[14px] border-[3px] bg-white px-5 py-4 text-left text-xl font-extrabold shadow-sm",
                sel ? "border-primary bg-primary text-white" : full ? "border-[#E8E8E8] bg-[#F7F7F7] text-[#BBB]" : "border-black/10 text-ink")}>
              <span>{formatTimeKo(t)}</span>
              {full ? <span className="text-sm text-[#BBB]">마감</span> : sel ? <span>✓</span> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

function LocOptions({ options, value, onPick }: { options: string[]; value: string | null; onPick: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((loc) => {
        const sel = value === loc;
        return (
          <button key={loc} onClick={() => onPick(loc)}
            className={cn("flex items-center gap-3.5 rounded-[14px] border-[3px] bg-white px-5 py-4 text-left text-xl font-bold shadow-sm",
              sel ? "border-primary bg-primary-light text-primary-darker" : "border-black/10 text-ink")}>
            <span className="flex-1">{loc}</span>
            {sel && <span className="text-primary">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function Summary({ date, time, persons, departLoc, arriveLoc, rows }: {
  date: string; time: string; persons: number; departLoc: string; arriveLoc: string; rows?: boolean;
}) {
  const items = [
    ["📅 탑승 날짜", formatDateKo(date)],
    ["🕒 탑승 시간", formatTimeKo(time)],
    ["👥 인원", `${persons}명`],
    ["📍 출발지", departLoc],
    ["🎯 도착지", arriveLoc],
  ];
  if (rows) {
    return (
      <>
        {items.map(([l, v]) => (
          <div key={l} className="flex items-center justify-between border-b border-black/10 py-3.5 last:border-0">
            <span className="font-semibold text-ink-muted">{l}</span>
            <span className="font-extrabold text-ink">{v}</span>
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      {items.map(([l, v]) => (
        <div key={l} className="flex items-center gap-3 py-2">
          <span className="text-lg font-bold text-ink">{l}: {v}</span>
        </div>
      ))}
    </>
  );
}
