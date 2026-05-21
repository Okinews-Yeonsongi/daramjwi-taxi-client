"use client";
import { useState } from "react";
import { Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ReservationDetailSheet } from "@/components/admin/reservation-detail-sheet";
import { formatTimeKo, DIRECTION_LABEL } from "@/lib/constants";
import type { ReservationView } from "@/lib/types";

export function DashboardTimeline({ items }: { items: ReservationView[] }) {
  const [selected, setSelected] = useState<ReservationView | null>(null);

  if (items.length === 0) {
    return (
      <Card className="text-center text-ink-muted">오늘 접수된 신청이 없습니다.</Card>
    );
  }

  return (
    <>
      <Card className="divide-y divide-black/10 p-0">
        {items.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-bg"
          >
            <div className="w-16 shrink-0">
              <div className="text-lg font-extrabold text-ink">{formatTimeKo(r.reservation_time).replace(/(오전|오후) /, "")}</div>
              <div className="text-xs text-ink-hint">{r.reservation_time < "12:00" ? "오전" : "오후"}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-extrabold text-ink">
                {r.resident_name}
                {r.is_phone_intake && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-info-light px-2 py-0.5 text-[11px] font-bold text-info">
                    <Phone size={11} /> 전화
                  </span>
                )}
              </div>
              <div className="truncate text-sm text-ink-muted">
                {r.depart_label} → {r.arrive_label}
                <span className="ml-1 text-ink-hint">· {r.passenger_count}명</span>
              </div>
            </div>
            <StatusBadge status={r.status} />
          </button>
        ))}
      </Card>
      <ReservationDetailSheet reservation={selected} onClose={() => setSelected(null)} />
    </>
  );
}
