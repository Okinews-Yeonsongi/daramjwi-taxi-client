"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetTitle, SheetSub } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { cancelReservationAction } from "@/app/actions/reservations";
import { formatDateKo, formatTimeKo, CANCEL_LABEL } from "@/lib/constants";
import type { ReservationView } from "@/lib/types";

export function ReservationsClient({ initial }: { initial: ReservationView[] }) {
  const [items, setItems] = useState(initial);
  const [target, setTarget] = useState<ReservationView | null>(null);
  const [pending, startTransition] = useTransition();

  function doCancel() {
    if (!target) return;
    // PRD 7.2 — 매칭 전(대기중)은 즉시 취소, 확정 후에는 이장님 확인용 '취소 요청'
    const requestOnly = target.status === "confirmed";
    startTransition(async () => {
      const res = await cancelReservationAction(target.id, requestOnly);
      if (res.ok) {
        setItems((prev) =>
          prev.map((r) => (r.id === target.id ? { ...r, ...res.reservation } : r)),
        );
        setTarget(null);
      }
    });
  }

  if (items.length === 0) {
    return <Card className="m-[18px] text-center text-ink-muted">아직 신청한 예약이 없어요.</Card>;
  }

  return (
    <>
      <div className="flex flex-col gap-3 px-[18px] py-5">
        {items.map((r) => {
          const cancelable = r.status === "pending" || r.status === "confirmed";
          const requested = r.cancel_status === "cancel_requested";
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-extrabold text-ink">{formatDateKo(r.reservation_date)}</div>
                  <div className="mt-0.5 text-base text-ink-muted">{formatTimeKo(r.reservation_time)}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-2 text-base text-ink">
                {r.depart_label} → {r.arrive_label}
                <span className="ml-1.5 text-sm text-ink-hint">· {r.passenger_count}명</span>
              </div>
              {requested && (
                <div className="mt-2 rounded-lg bg-bad-light px-3 py-1.5 text-sm font-bold text-bad">
                  {CANCEL_LABEL.cancel_requested} · 이장님 확인 대기
                </div>
              )}
              {cancelable && !requested && (
                <Button variant="outline" size="md" className="mt-3 w-full" onClick={() => setTarget(r)}>
                  예약 취소
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Sheet open={!!target} onClose={() => setTarget(null)}>
        {target && (
          <div className="px-1">
            <SheetTitle>예약을 취소할까요?</SheetTitle>
            <SheetSub>
              {formatDateKo(target.reservation_date)} {formatTimeKo(target.reservation_time)}
              <br />
              {target.depart_label} → {target.arrive_label}
            </SheetSub>
            {target.status === "confirmed" && (
              <p className="mt-3 rounded-lg bg-primary-light px-3 py-2 text-sm font-medium text-primary-darker">
                확정된 예약은 이장님 확인 후 최종 취소됩니다.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setTarget(null)}>
                닫기
              </Button>
              <Button variant="bad" className="flex-1" disabled={pending} onClick={doCancel}>
                {pending ? "처리 중…" : "취소하기"}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
