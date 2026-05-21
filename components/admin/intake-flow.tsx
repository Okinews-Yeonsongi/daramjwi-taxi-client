"use client";
import { useState, useTransition } from "react";
import { Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TripBookingFlow, type TripPayload } from "@/components/resident/trip-booking-flow";
import { createReservationAction, registerResidentAction } from "@/app/actions/reservations";
import type { ResidentWithUsage } from "@/lib/types";

interface Props {
  villageId: string;
  residents: ResidentWithUsage[];
  dates: string[];
  usageMap: Record<string, number>;
}

export function IntakeFlow({ villageId, residents, dates, usageMap }: Props) {
  const [list, setList] = useState(residents);
  const [picked, setPicked] = useState<ResidentWithUsage | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [pending, startTransition] = useTransition();

  function addNewResident() {
    if (!newName.trim() || !newPhone.trim()) return;
    startTransition(async () => {
      const res = await registerResidentAction({
        village_id: villageId,
        full_name: newName.trim(),
        phone: newPhone.trim(),
        registered_by: "user_manager",
      });
      if (res.ok) {
        const withUsage = { ...res.resident, monthly_usage: 0 };
        setList((prev) => [withUsage, ...prev]);
        setPicked(withUsage);
        setNewName(""); setNewPhone("");
      }
    });
  }

  // 주민 선택 후 → 예약 입력 플로우
  if (picked) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-black/10 bg-white px-[18px] py-3">
          <button onClick={() => setPicked(null)} className="text-2xl text-ink-muted">←</button>
          <div>
            <div className="font-extrabold text-ink">{picked.full_name} 님</div>
            <div className="text-sm text-ink-muted">{picked.phone} · 전화 접수</div>
          </div>
        </div>
        <TripBookingFlow
          dates={dates}
          usageMap={usageMap}
          submitLabel="대리 신청"
          onConfirm={(p: TripPayload) =>
            createReservationAction({
              ...p,
              village_id: villageId,
              resident_id: picked.id,
              booked_by: "village_manager",
              created_by: "user_manager",
              is_phone_intake: true,
            })
          }
        />
      </div>
    );
  }

  // 스텝 0: 누가 전화하셨나요?
  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-[18px] pb-28 pt-5">
      <div className="mb-4 flex items-center gap-2 text-2xl font-black text-ink">
        <Phone className="text-primary" /> 누가 전화하셨나요?
      </div>
      <p className="mb-4 text-base text-ink-muted">주민을 선택하거나 직접 입력하세요</p>

      <div className="flex flex-col gap-2.5">
        {list.map((r) => (
          <button key={r.id} onClick={() => setPicked(r)}
            className="flex items-center gap-3 rounded-[16px] border border-black/10 bg-white px-4 py-3.5 text-left shadow-sm active:scale-[0.99]">
            <span className="flex size-11 items-center justify-center rounded-full bg-bg text-ink-muted">👤</span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold text-ink">{r.full_name}</span>
              <span className="block text-sm text-ink-muted">{r.phone}</span>
            </span>
            {/* 누적 이용 횟수 카운터 (전화접수+직접예약 통합) */}
            <span className="rounded-full bg-primary-light px-3 py-1 text-sm font-extrabold text-primary-darker">
              {r.monthly_usage}회
            </span>
          </button>
        ))}
      </div>

      {/* 예외 처리: 신규 주민 추가 */}
      <div className="my-4 text-center text-sm font-bold text-ink-hint">— 또는 직접 입력 —</div>
      <div className="flex flex-col gap-3 rounded-[16px] border border-dashed border-black/20 bg-white p-4">
        <div className="flex items-center gap-1.5 font-extrabold text-ink"><UserPlus size={18} /> 신규 주민 등록</div>
        <Input placeholder="이름" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Input placeholder="연락처 (010-0000-0000)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} inputMode="tel" />
        <Button disabled={pending || !newName.trim() || !newPhone.trim()} onClick={addNewResident}>
          {pending ? "등록 중…" : "등록하고 계속 →"}
        </Button>
      </div>
    </div>
  );
}
