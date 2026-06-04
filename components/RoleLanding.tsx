"use client";

import { useState, type CSSProperties } from "react";
import { devLogin, setToken, ApiCallError, kakaoStartUrl } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

const DEV_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";

export default function RoleLanding({
  onPicked,
}: {
  onPicked: (token: string, name: string, role: string) => void;
}) {
  const [loading, setLoading] = useState<"resident" | "admin" | null>(null);
  const [err, setErr] = useState("");

  function loginWithKakao() {
    // 콜백 후 토큰이 우리 앱(현재 호스트)으로 돌아오도록 protocol-relative 경로 사용
    const next = "//" + window.location.host + window.location.pathname;
    window.location.href = kakaoStartUrl(next);
  }

  async function pick(role: "resident" | "admin") {
    setLoading(role);
    setErr("");
    try {
      const r = await devLogin(role);
      setToken(r.access_token);
      getSupabase()?.realtime.setAuth(r.access_token);
      onPicked(r.access_token, r.user.name || (role === "admin" ? "기사님" : "주민"), r.user.role);
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "로그인에 실패했어요");
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(48px, calc(var(--safe-top) + 24px)) clamp(20px,6vw,30px) max(40px, calc(var(--safe-bottom) + 24px))",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "clamp(72px,22vw,104px)", lineHeight: 1 }}>🐿️</div>
      <div style={{ fontSize: "clamp(30px,9vw,42px)", fontWeight: 900, color: "var(--text)", marginTop: 18 }}>
        다람쥐 택시
      </div>
      <div style={{ fontSize: "clamp(15px,4vw,18px)", color: "var(--text-muted)", fontWeight: 600, marginTop: 12, marginBottom: 36 }}>
        테스트 콘솔 — 역할을 선택하세요
      </div>

      {err && (
        <div
          style={{
            width: "100%",
            background: "var(--red-light)",
            color: "var(--red)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            fontWeight: 700,
            fontSize: "clamp(13px,3.6vw,15px)",
          }}
        >
          {err}
        </div>
      )}

      {DEV_ENABLED ? (
        <>
          <button onClick={() => pick("resident")} disabled={loading !== null} style={btnPrimary}>
            {loading === "resident" ? "들어가는 중…" : "👤 주민(테스트)으로 로그인"}
          </button>
          <button onClick={() => pick("admin")} disabled={loading !== null} style={btnOutline}>
            {loading === "admin" ? "들어가는 중…" : "🧑‍✈️ 기사님(테스트)으로 로그인"}
          </button>
        </>
      ) : (
        <div style={{ fontSize: "clamp(14px,3.8vw,16px)", color: "var(--text-muted)", marginBottom: 20 }}>
          준비 중입니다. 카카오 로그인으로 시작해주세요.
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          margin: "18px 0",
          color: "var(--text-hint)",
          fontSize: "clamp(12px,3vw,14px)",
          fontWeight: 600,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        또는
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <button style={btnKakao} onClick={loginWithKakao}>
        💬 카카오로 시작하기
      </button>
      <div style={{ marginTop: 16, fontSize: "clamp(12px,3vw,14px)", color: "var(--text-hint)" }}>
        카카오 계정으로 간편하게 시작해요
      </div>
    </div>
  );
}

const btnBase: CSSProperties = {
  width: "100%",
  padding: "clamp(16px,4.5vw,20px)",
  borderRadius: 16,
  fontSize: "clamp(16px,4.5vw,19px)",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  marginBottom: 12,
};
const btnPrimary: CSSProperties = {
  ...btnBase,
  border: "none",
  background: "var(--primary)",
  color: "#fff",
  boxShadow: "0 6px 20px rgba(232,150,10,0.35)",
};
const btnOutline: CSSProperties = {
  ...btnBase,
  border: "2px solid var(--border-med)",
  background: "#fff",
  color: "var(--text)",
};
const btnKakao: CSSProperties = {
  ...btnBase,
  border: "none",
  background: "#FEE500",
  color: "#3C1E1E",
  marginBottom: 0,
};
