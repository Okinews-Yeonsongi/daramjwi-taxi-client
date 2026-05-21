"use client";
import { useState } from "react";
import { Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ReservationDetailSheet } from "@/components/admin/reservation-detail-sheet";
import { STATUS_FILTERS, formatTimeKo, formatDateKo } from "@/lib/constants";
import type { ReservationView, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ListClient({ reservations }: { reservations: ReservationView[] }) {
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [selected, setSelected] = useState<ReservationView | null>(null);

  const filtered = reservations.filter((r) => filter === "all" || r.status === filter);

  return (
    <>
      {/* 조건별 상단 토글 필터 */}
      <div className="no-scrollbar sticky top-0 z-10 flex gap-2 overflow-x-auto bg-bg px-5 py-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition",
              filter === f.value
                ? "bg-primary text-white"
                : "border border-black/15 bg-white text-ink-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5">
        {filtered.length === 0 && (
          <Card className="text-center text-ink-muted">해당하는 신청이 없습니다.</Card>
        )}
        {filtered.map((r) => (
          <button key={r.id} onClick={() => setSelected(r)} className="text-left active:scale-[0.99]">
            <Card className="flex items-center gap-3">
              <div className="w-16 shrink-0">
                <div className="text-base font-extrabold text-ink">
                  {formatTimeKo(r.reservation_time).replace(/(오전|오후) /, "")}
                </div>
                <div className="text-[11px] text-ink-hint">{formatDateKo(r.reservation_date).replace(/ \(.+\)/, "")}</div>
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
                  {r.depart_label} → {r.arrive_label} · {r.passenger_count}명
                </div>
              </div>
              <StatusBadge status={r.status} />
            </Card>
          </button>
        ))}
      </div>
      <ReservationDetailSheet reservation={selected} onClose={() => setSelected(null)} />
    </>
  );
}
