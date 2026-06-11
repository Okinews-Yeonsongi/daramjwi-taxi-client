"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { enablePush, pushSupported } from "@/lib/push";
import { useToast } from "@/components/Toast";

/**
 * '🔔 알림 켜기' 버튼. 알림 권한이 아직 정해지지 않은 경우에만 보임.
 * 탭하면 권한 요청 + 구독 (사용자 제스처 기반 → iOS Safari 호환).
 * 이미 허용/차단했거나 미지원이면 아무것도 안 보임.
 */
export default function PushButton({ style }: { style?: CSSProperties }) {
  const toast = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    if (Notification.permission === "default") setShow(true);
  }, []);

  if (!show) return null;

  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await enablePush({ ask: true });
        setBusy(false);
        if (r === "ok") {
          toast("🔔 알림을 켰어요");
          setShow(false);
        } else if (r === "denied") {
          toast("알림이 차단되어 있어요. 브라우저 설정에서 허용해주세요");
          setShow(false);
        } else if (r === "unsupported") {
          toast("이 기기에서는 알림을 지원하지 않아요");
          setShow(false);
        } else {
          toast("알림 설정에 실패했어요");
        }
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 14px",
        borderRadius: 999,
        border: "1.5px solid rgba(0,0,0,0.10)",
        background: "#fff",
        color: "var(--primary-darker)",
        fontWeight: 800,
        fontSize: "clamp(13px,3.4vw,15px)",
        fontFamily: "inherit",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        ...style,
      }}
    >
      {busy ? "설정 중…" : "🔔 알림 켜기"}
    </button>
  );
}
