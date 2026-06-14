"use client";

import { useState, type CSSProperties } from "react";
import { onboardProfile, ApiCallError } from "@/lib/api";
import { useToast } from "@/components/Toast";

const labelStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: "clamp(14px,3.8vw,16px)",
  color: "var(--text)",
  margin: "0 0 8px 2px",
};

/** 최초 카카오 가입자만 보는 화면: 이름(닉네임 자동) + 전화번호 1회 입력. */
export default function CitizenOnboarding({
  initialName,
  onDone,
  onSkip,
}: {
  initialName: string;
  onDone: (name: string) => void;
  onSkip: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const phoneValid = /^01[016789]\d{7,8}$/.test(phone);

  async function submit() {
    if (!name.trim()) return toast("이름을 입력해주세요");
    if (!phoneValid) return toast("휴대폰 번호를 정확히 입력해주세요");
    setBusy(true);
    try {
      await onboardProfile({ name: name.trim(), phone });
      onDone(name.trim());
    } catch (e) {
      toast(e instanceof ApiCallError ? e.message : "저장에 실패했어요");
      setBusy(false);
    }
  }

  return (
    <div className="screen active">
      <div className="top-bar">
        <div className="app-name" style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <img src="/character.png" alt="" style={{ height: "1.5em", width: "auto" }} />
          다람쥐 택시
        </div>
        <div className="top-bar-sub">환영해요! 처음이시네요 😊</div>
      </div>
      <div className="scroll-content">
        <div className="content-pad">
          <div className="mt">연락처를 알려주세요</div>
          <div className="msub">기사님이 연락드릴 수 있도록 한 번만 입력하면 돼요</div>

          <div style={labelStyle}>이름</div>
          <input
            className="fi"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: 18 }}
          />

          <div style={labelStyle}>휴대폰 번호</div>
          <input
            className="fi"
            type="tel"
            inputMode="numeric"
            placeholder="휴대폰 번호 입력 (예: 01012345678)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          />
          <div className="ph-hint">📱 휴대폰 번호만 등록돼요</div>
        </div>
      </div>
      <div className="action-bar-single" style={{ flexDirection: "column", gap: 10 }}>
        <button
          className="btn-primary"
          style={{ width: "100%" }}
          disabled={!name.trim() || !phoneValid || busy}
          onClick={submit}
        >
          {busy ? "저장 중…" : "시작하기 →"}
        </button>
        <button
          onClick={onSkip}
          disabled={busy}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontWeight: 700,
            fontSize: "clamp(13px,3.6vw,15px)",
            textDecoration: "underline",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 4,
          }}
        >
          나중에 입력하기
        </button>
      </div>
    </div>
  );
}
