"use client";
import { useState, useTransition } from "react";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDateKo, formatTimeKo } from "@/lib/constants";
import type { ReservationView } from "@/lib/types";
import {
  confirmReservationAction,
  cancelReservationAction,
} from "@/app/actions/reservations";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 py-3.5 last:border-0">
      <span className="font-semibold text-ink-muted">{label}</span>
      <span className="text-right font-extrabold text-ink">{value}</span>
    </div>
  );
}

export function ReservationDetailSheet({
  reservation,
  onClose,
}: {
  reservation: ReservationView | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const r = reservation;

  function act(fn: () => Promise<unknown>, msg: string) {
    startTransition(async () => {
      await fn();
      setDone(msg);
      setTimeout(() => {
        setDone(null);
        onClose();
      }, 900);
    });
  }

  return (
    <Sheet open={!!r} onClose={onClose}>
      {r && (
        <>
          <SheetTitle>{r.resident_name} 님 신청</SheetTitle>
          <p className="mb-5 text-base text-ink-muted">
            {formatDateKo(r.reservation_date)} {formatTimeKo(r.reservation_time)}
            {r.is_phone_intake ? " · 전화 신청" : ""}
          </p>

          <div className="mb-5 rounded-[14px] bg-bg px-4 py-1.5">
            <Row label="연락처" value={r.resident_phone} />
            <Row label="출발지" value={r.depart_label} />
            <Row label="도착지" value={r.arrive_label} />
            <Row label="인원" value={`${r.passenger_count}명`} />
            <Row label="상태" value={<StatusBadge status={r.status} />} />
          </div>

          {done ? (
            <p className="py-3 text-center text-lg font-extrabold text-good">{done}</p>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              <Button variant="ghost" size="md" onClick={onClose} disabled={pending}>
                닫기
              </Button>
              <Button
                variant="good"
                size="md"
                disabled={pending || r.status === "confirmed" || r.status === "completed"}
                onClick={() => act(() => confirmReservationAction(r.id), "✓ 확정 · 안내 발송됨")}
              >
                ✓ 확정
              </Button>
              <Button
                variant="bad"
                size="md"
                disabled={pending || r.status === "canceled"}
                onClick={() => act(() => cancelReservationAction(r.id), "취소 처리됨")}
              >
                × 취소
              </Button>
            </div>
          )}
          <p className="mt-3 text-center text-xs text-ink-hint">
            확정 시 주민에게 안내 문자가 자동 발송됩니다 (현재 placeholder)
          </p>
        </>
      )}
    </Sheet>
  );
}
