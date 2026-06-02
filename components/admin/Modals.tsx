"use client";

/** 하단에서 올라오는 시트(모달) 래퍼. open=false 면 렌더 안 함. */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="moverlay" onClick={onClose}>
      <div className="msheet" onClick={(e) => e.stopPropagation()}>
        <div className="mhandle" />
        {children}
      </div>
    </div>
  );
}

/** 예/아니오 확인 시트. */
export function ConfirmSheet({
  open,
  q,
  sub,
  okLabel,
  okClass,
  busy,
  onOk,
  onClose,
}: {
  open: boolean;
  q: string;
  sub?: string;
  okLabel: string;
  okClass: string; // "bg2" | "br2" ...
  busy?: boolean;
  onOk: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose}>
      <div className="confirm-box">
        <div className="confirm-q">{q}</div>
        {sub && <div className="confirm-sub">{sub}</div>}
      </div>
      <div className="mft">
        <button className="btn bo2" style={{ flex: 1, padding: 13 }} onClick={onClose} disabled={busy}>
          닫기
        </button>
        <button
          className={"btn " + okClass}
          style={{ flex: 1, padding: 13 }}
          onClick={onOk}
          disabled={busy}
        >
          {busy ? <span className="inline-spin" /> : okLabel}
        </button>
      </div>
    </Sheet>
  );
}
