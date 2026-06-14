"use client";

import { useEffect, useState } from "react";
import {
  getReservations,
  confirmReservation,
  cancelReservation,
  mergeReservations,
  editReservationPhone,
  ApiCallError,
} from "@/lib/api";
import type { AdminReservation, AdminTab, ReservationStatus } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { useAdmin } from "./ctx";
import { Sheet, ConfirmSheet } from "./Modals";

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

export default function WaitingList() {
  const { goPage, tick, bump } = useAdmin();
  const toast = useToast();

  const [tab, setTab] = useState<AdminTab>("waiting");
  const [list, setList] = useState<AdminReservation[] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selIds, setSelIds] = useState<number[]>([]);

  // 모달 상태
  const [detail, setDetail] = useState<AdminReservation | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminReservation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminReservation | null>(null);
  const [cancelReason, setCancelReason] = useState("차량 사정");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // 연락처 수정
  const [phoneTarget, setPhoneTarget] = useState<AdminReservation | null>(null);
  const [phoneVal, setPhoneVal] = useState("");

  useEffect(() => {
    let alive = true;
    setList(null);
    getReservations({ status: tab })
      .then((r) => {
        if (!alive) return;
        let rows = r.reservations;
        // 확정 탭: 지난 슬롯(completed) 은 숨김 — 월별 현황에서만 봄
        if (tab === "confirmed") rows = rows.filter((x) => x.effective_status !== "completed");
        setList(rows);
      })
      .catch((e) => {
        if (alive) {
          setList([]);
          toast(e instanceof ApiCallError ? e.message : "불러오기 실패");
        }
      });
    return () => {
      alive = false;
    };
  }, [tab, tick, toast]);

  function switchTab(t: AdminTab) {
    setTab(t);
    setEditMode(false);
    setSelIds([]);
  }

  function toggleSel(id: number) {
    setSelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function onItemClick(r: AdminReservation) {
    if (editMode) toggleSel(r.id);
    else setDetail(r);
  }

  async function doConfirm() {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      await confirmReservation(confirmTarget.id);
      toast(`💬 ${confirmTarget.resident.name ?? ""} 님께 확정 알림 발송`);
      setConfirmTarget(null);
      bump();
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "확정 실패");
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    if (!cancelTarget) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast("취소 사유를 입력해 주세요");
      return;
    }
    setBusy(true);
    try {
      await cancelReservation(cancelTarget.id, reason);
      toast(`💬 ${cancelTarget.resident.name ?? ""} 님께 취소 알림 발송`);
      setCancelTarget(null);
      setCancelReason("차량 사정");
      bump();
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "취소 실패");
    } finally {
      setBusy(false);
    }
  }

  async function doEditPhone() {
    if (!phoneTarget) return;
    const digits = phoneVal.replace(/\D/g, "");
    if (digits.length < 4) {
      toast("전화번호 끝 4자리 이상 입력해 주세요");
      return;
    }
    setBusy(true);
    try {
      await editReservationPhone(phoneTarget.id, phoneVal.trim());
      toast("연락처를 수정했어요");
      setPhoneTarget(null);
      bump();
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "연락처 수정 실패");
    } finally {
      setBusy(false);
    }
  }

  function openEditPhone(r: AdminReservation) {
    setPhoneTarget(r);
    setPhoneVal(r.resident.phone ?? "");
  }

  return (
    <div className="pg">
      <div className="sub-ph-plain">
        <div className="sub-ph-title">⏳ 대기 신청 현황</div>
      </div>

      <div className="tabs">
        <button className={"tab" + (tab === "waiting" ? " on" : "")} onClick={() => switchTab("waiting")}>
          대기
        </button>
        <button className={"tab" + (tab === "confirmed" ? " on" : "")} onClick={() => switchTab("confirmed")}>
          확정
        </button>
        <button className={"tab" + (tab === "cancelled" ? " on" : "")} onClick={() => switchTab("cancelled")}>
          취소
        </button>
      </div>

      <div className="scroller">
        {tab === "waiting" && (
          <div className="edit-bar">
            <div className="edit-bar-info">
              {editMode ? `${selIds.length}개 선택됨` : "편집 모드로 예약을 합칠 수 있어요"}
            </div>
            <div className="edit-bar-btns">
              {editMode ? (
                <>
                  <button
                    className="btn by2"
                    disabled={selIds.length < 2}
                    onClick={() => (selIds.length >= 2 ? setMergeOpen(true) : toast("2개 이상 선택해주세요"))}
                  >
                    합치기
                  </button>
                  <button className="btn bo2" onClick={() => { setEditMode(false); setSelIds([]); }}>
                    완료
                  </button>
                </>
              ) : (
                <button className="btn bo2" onClick={() => { setEditMode(true); setSelIds([]); }}>
                  편집
                </button>
              )}
            </div>
          </div>
        )}

        {list === null ? (
          <div className="center-fill" style={{ minHeight: 200 }}>
            <div className="spinner" />
          </div>
        ) : list.length === 0 ? (
          <div className="empty">
            {tab === "waiting" ? "대기 중인 신청이 없어요" : tab === "confirmed" ? "확정된 신청이 없어요" : "취소된 신청이 없어요"}
          </div>
        ) : (
          list.map((r) => (
            <WaitItem
              key={r.id}
              r={r}
              tab={tab}
              editMode={editMode}
              selected={selIds.includes(r.id)}
              onClick={() => onItemClick(r)}
              onConfirm={() => setConfirmTarget(r)}
              onCancel={() => { setCancelTarget(r); setCancelReason("차량 사정"); }}
              onEditPhone={() => openEditPhone(r)}
            />
          ))
        )}
      </div>

      <div className="bottom-bar">
        <button className="btn-home" onClick={() => goPage("home")}>
          🏠 홈으로
        </button>
      </div>

      {/* 상세 모달 */}
      <DetailSheet
        r={detail}
        onClose={() => setDetail(null)}
        onConfirm={(r) => { setDetail(null); setConfirmTarget(r); }}
        onCancel={(r) => { setDetail(null); setCancelTarget(r); setCancelReason("차량 사정"); }}
      />

      {/* 확정 확인 */}
      <ConfirmSheet
        open={!!confirmTarget}
        q="확정하시겠습니까?"
        sub={confirmTarget ? `${confirmTarget.resident.name ?? ""} 님 · ${fmtDate(confirmTarget.reservation_date)} ${timeLabelOf(confirmTarget)}` : ""}
        okLabel="확정 알림 발송"
        okClass="bg2"
        busy={busy}
        onOk={doConfirm}
        onClose={() => setConfirmTarget(null)}
      />

      {/* 취소(사유 입력) */}
      <Sheet open={!!cancelTarget} onClose={busy ? () => {} : () => setCancelTarget(null)}>
        <div className="mtit">정말 취소하시겠습니까?</div>
        <div className="msub2">
          {cancelTarget ? `${cancelTarget.resident.name ?? ""} 님 · ${fmtDate(cancelTarget.reservation_date)} ${cancelTarget ? timeLabelOf(cancelTarget) : ""}` : ""}
        </div>
        <label className="lbl-big" style={{ margin: "4px 0 8px" }}>취소 사유</label>
        <input
          className="fi"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="예: 차량 사정"
          disabled={busy}
        />
        <div className="mft">
          <button className="btn bo2" style={{ flex: 1, padding: 13 }} onClick={() => setCancelTarget(null)} disabled={busy}>
            닫기
          </button>
          <button className="btn br2" style={{ flex: 1, padding: 13 }} onClick={doCancel} disabled={busy}>
            {busy ? <span className="inline-spin" /> : "취소 알림 발송"}
          </button>
        </div>
      </Sheet>

      {/* 연락처 수정 */}
      <Sheet open={!!phoneTarget} onClose={busy ? () => {} : () => setPhoneTarget(null)}>
        <div className="mtit">연락처 수정</div>
        <div className="msub2">
          {phoneTarget ? `${phoneTarget.resident.name ?? ""} 님 · ${fmtDate(phoneTarget.reservation_date)} ${phoneTarget ? timeLabelOf(phoneTarget) : ""}` : ""}
        </div>
        <label className="lbl-big" style={{ margin: "4px 0 8px" }}>전화번호</label>
        <input
          className="fi"
          type="tel"
          inputMode="numeric"
          value={phoneVal}
          onChange={(e) => setPhoneVal(e.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="전화번호 (끝 4자리만 입력해도 돼요)"
          disabled={busy}
        />
        <div className="mft">
          <button className="btn bo2" style={{ flex: 1, padding: 13 }} onClick={() => setPhoneTarget(null)} disabled={busy}>
            닫기
          </button>
          <button className="btn bg2" style={{ flex: 1, padding: 13 }} onClick={doEditPhone} disabled={busy}>
            {busy ? <span className="inline-spin" /> : "저장"}
          </button>
        </div>
      </Sheet>

      {/* 합치기 */}
      <MergeSheet
        open={mergeOpen}
        items={(list ?? []).filter((r) => selIds.includes(r.id))}
        onClose={() => setMergeOpen(false)}
        onDone={async (ids, hour, minute) => {
          setBusy(true);
          try {
            await mergeReservations(ids, hour, minute);
            toast("💬 합치기 + 확정 알림 발송 완료");
            setMergeOpen(false);
            setEditMode(false);
            setSelIds([]);
            bump();
          } catch (e) {
            toast(e instanceof ApiCallError ? e.message : "합치기 실패");
          } finally {
            setBusy(false);
          }
        }}
        busy={busy}
      />
    </div>
  );
}

/* ───────── 리스트 아이템 ───────── */
function WaitItem({
  r,
  tab,
  editMode,
  selected,
  onClick,
  onConfirm,
  onCancel,
  onEditPhone,
}: {
  r: AdminReservation;
  tab: AdminTab;
  editMode: boolean;
  selected: boolean;
  onClick: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onEditPhone: () => void;
}) {
  const st = r.effective_status;
  return (
    <div className="wait-card">
      <div className={"wait-item" + (selected ? " wait-item-sel" : "")} onClick={onClick}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {editMode && <div className={"check-circle" + (selected ? " on" : "")} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="wi-date-badge">
              {fmtDate(r.reservation_date)} · {timeLabelOf(r)}
            </div>
            <div className="wi-top">
              <span className="wi-name">{r.resident.name ?? "—"} 님</span>
              <span className={"badge " + STATUS_CLASS[st]}>{STATUS_LABEL[st]}</span>
            </div>
            <div className="wi-route">
              📍 {r.departure?.name ?? "?"} → {r.arrival?.name ?? "?"}
              <br />👥 {r.persons}명
            </div>
            <div className="wi-bottom">
              {r.resident.is_guest && <span className="wi-src">📞 전화</span>}
              {r.resident.phone && <span className="wi-src">📱 {r.resident.phone}</span>}
              <span className="wi-usage">이달 {r.monthly_confirmed}회</span>
            </div>
            {tab === "waiting" && !editMode && (
              <div className="wi-btns">
                <button
                  className="wi-btn wi-btn-g"
                  onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                >
                  ✓ 확정
                </button>
                <button
                  className="wi-btn wi-btn-r"
                  onClick={(e) => { e.stopPropagation(); onCancel(); }}
                >
                  취소
                </button>
                <button
                  className="wi-btn"
                  onClick={(e) => { e.stopPropagation(); onEditPhone(); }}
                >
                  ✏️ 번호
                </button>
              </div>
            )}
            {tab === "confirmed" && (
              <div className="wi-btns">
                <button
                  className="wi-btn wi-btn-r"
                  onClick={(e) => { e.stopPropagation(); onCancel(); }}
                >
                  취소
                </button>
                <button
                  className="wi-btn"
                  onClick={(e) => { e.stopPropagation(); onEditPhone(); }}
                >
                  ✏️ 번호
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── 상세 모달 ───────── */
function DetailSheet({
  r,
  onClose,
  onConfirm,
  onCancel,
}: {
  r: AdminReservation | null;
  onClose: () => void;
  onConfirm: (r: AdminReservation) => void;
  onCancel: (r: AdminReservation) => void;
}) {
  if (!r) return null;
  const st = r.effective_status;
  return (
    <Sheet open={!!r} onClose={onClose}>
      <div className="mtit">{r.resident.name ?? "—"} 님 신청</div>
      <div className="msub2">
        {fmtDate(r.reservation_date)} {timeLabelOf(r)} · {r.resident.is_guest ? "전화" : "앱"} 신청
      </div>
      <Row k="연락처" v={r.resident.phone ?? "—"} />
      <Row k="출발지" v={r.departure?.name ?? "—"} />
      <Row k="도착지" v={r.arrival?.name ?? "—"} />
      <Row k="인원" v={`${r.persons}명`} />
      {r.vehicle_code && <Row k="차량" v={`${r.vehicle_code}호차`} />}
      {r.cancel_reason && <Row k="취소 사유" v={r.cancel_reason} />}
      <div className="mrow">
        <span className="mk">상태</span>
        <span className={"badge " + STATUS_CLASS[st]}>{STATUS_LABEL[st]}</span>
      </div>
      <div className="mft">
        <button className="btn bo2" onClick={onClose}>닫기</button>
        {st === "waiting" && (
          <>
            <button className="btn bg2" onClick={() => onConfirm(r)}>✓ 확정</button>
            <button className="btn br2" onClick={() => onCancel(r)}>취소</button>
          </>
        )}
        {st === "confirmed" && (
          <button className="btn br2" onClick={() => onCancel(r)}>취소</button>
        )}
      </div>
    </Sheet>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="mrow">
      <span className="mk">{k}</span>
      <span className="mv">{v}</span>
    </div>
  );
}

/* ───────── 합치기 모달 (시·분 다이얼) ───────── */
function MergeSheet({
  open,
  items,
  onClose,
  onDone,
  busy,
}: {
  open: boolean;
  items: AdminReservation[];
  onClose: () => void;
  onDone: (ids: number[], hour: number, minute: number) => void;
  busy: boolean;
}) {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);

  // 모달이 열릴 때 첫 예약 시각으로 초기화
  useEffect(() => {
    if (open && items.length) {
      setHour(items[0].hour || 9);
      setMinute(0);
    }
  }, [open, items]);

  if (!open) return null;

  function changeHour(d: number) {
    setHour((h) => { let n = h + d; if (n < 9) n = 18; if (n > 18) n = 9; return n; });
  }
  function changeMinute(d: number) {
    setMinute((m) => { let n = m + d * 10; if (n < 0) n = 50; if (n >= 60) n = 0; return n; });
  }

  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose}>
      <div className="mtit">예약 합치기</div>
      <div className="msub2">{items.length}건을 한 차로 합쳐요</div>
      <div className="merge-list">
        {items.map((r) => (
          <div key={r.id} className="merge-item">
            <div className="merge-item-top">
              <span className="merge-name">{r.resident.name ?? "—"}</span>
              <span className="merge-persons">{r.persons}명</span>
            </div>
            <div className="merge-route">
              {r.departure?.name ?? "?"} <span className="merge-arrow">→</span> {r.arrival?.name ?? "?"}
            </div>
            <div className="merge-time">🕐 {timeLabelOf(r)}</div>
          </div>
        ))}
      </div>
      <div className="dial-section">
        <div className="dial-section-label">합쳐진 예약 시간 선택</div>
        <div className="dial-row">
          <div className="dial-col">
            <div className="dial-col-label">시</div>
            <button className="dial-arrow-btn" onClick={() => changeHour(1)}>▲</button>
            <div className="dial-display">{hour}</div>
            <button className="dial-arrow-btn" onClick={() => changeHour(-1)}>▼</button>
          </div>
          <div className="dial-colon">:</div>
          <div className="dial-col">
            <div className="dial-col-label">분</div>
            <button className="dial-arrow-btn" onClick={() => changeMinute(1)}>▲</button>
            <div className="dial-display">{String(minute).padStart(2, "0")}</div>
            <button className="dial-arrow-btn" onClick={() => changeMinute(-1)}>▼</button>
          </div>
        </div>
        <div className="dial-selected-preview">{fmtTime(hour, minute)}</div>
      </div>
      <div className="mft">
        <button className="btn bo2" onClick={onClose} disabled={busy}>취소</button>
        <button className="btn bg2" onClick={() => onDone(items.map((r) => r.id), hour, minute)} disabled={busy}>
          {busy ? <span className="inline-spin" /> : "✓ 합치기 + 확정"}
        </button>
      </div>
    </Sheet>
  );
}
