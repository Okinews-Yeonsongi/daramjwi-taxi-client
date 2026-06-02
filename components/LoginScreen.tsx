"use client";

import { useState } from "react";
import { devLogin, authMe, setToken, ApiCallError } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

const DEV_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";

/** "010-1234-5678" / "01012345678" → "+821012345678" */
function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length >= 10) return "+82" + digits.slice(1);
  if (digits.startsWith("82")) return "+" + digits;
  return null;
}

export default function LoginScreen({
  onLoggedIn,
}: {
  onLoggedIn: (token: string, name: string) => void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  /** 개발용 로그인 — SMS 연동 전 임시. 기사님 토큰을 바로 발급. */
  async function handleDevLogin() {
    setErr("");
    setBusy(true);
    try {
      const { access_token } = await devLogin("admin");
      setToken(access_token);
      getSupabase()?.realtime.setAuth(access_token);
      const me = await authMe();
      if (me.profile?.role !== "admin") {
        setErr("이 계정은 기사님(관리자) 권한이 없어요.");
        setToken(null);
        return;
      }
      onLoggedIn(access_token, me.profile?.name ?? "기사님");
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "로그인에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtp() {
    setErr("");
    const e164 = toE164(phone);
    if (!e164) {
      setErr("휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)");
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setErr("로그인 설정이 없어요. 관리자에게 문의해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithOtp({ phone: e164 });
      if (error) throw error;
      setOtpSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setErr(
        "인증번호 발송에 실패했어요. (SMS 연동 전이라면 아래 임시 로그인을 사용하세요)" +
          (msg ? `\n${msg}` : ""),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setErr("");
    const e164 = toE164(phone);
    const sb = getSupabase();
    if (!e164 || !sb) return;
    setBusy(true);
    try {
      const { data, error } = await sb.auth.verifyOtp({
        phone: e164,
        token: code.trim(),
        type: "sms",
      });
      if (error) throw error;
      const token = data.session?.access_token;
      if (!token) throw new Error("세션을 받지 못했어요.");
      setToken(token);
      sb.realtime.setAuth(token);
      const me = await authMe();
      if (me.profile?.role !== "admin") {
        setErr("이 계정은 기사님(관리자) 권한이 없어요.");
        setToken(null);
        await sb.auth.signOut();
        return;
      }
      onLoggedIn(token, me.profile?.name ?? "기사님");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "인증에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-icon">🐿️</div>
      <div className="login-title">다람쥐 택시</div>
      <div className="login-sub">
        기사님(관리자) 화면입니다.
        <br />
        휴대폰 번호로 로그인하세요.
      </div>

      <div className="login-form">
        {err && <div className="login-err" style={{ whiteSpace: "pre-line" }}>{err}</div>}

        {!otpSent ? (
          <>
            <input
              className="fi"
              type="tel"
              inputMode="numeric"
              placeholder="휴대폰 번호 (010-0000-0000)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy}
            />
            <button
              className="login-btn login-btn-primary"
              onClick={handleSendOtp}
              disabled={busy}
            >
              {busy ? <span className="inline-spin" /> : "인증번호 받기"}
            </button>
          </>
        ) : (
          <>
            <input
              className="fi"
              type="tel"
              inputMode="numeric"
              placeholder="인증번호 6자리"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={busy}
            />
            <button
              className="login-btn login-btn-primary"
              onClick={handleVerifyOtp}
              disabled={busy}
            >
              {busy ? <span className="inline-spin" /> : "로그인"}
            </button>
            <button
              className="login-btn login-btn-dev"
              onClick={() => {
                setOtpSent(false);
                setCode("");
                setErr("");
              }}
              disabled={busy}
            >
              번호 다시 입력
            </button>
          </>
        )}

        {DEV_ENABLED && (
          <>
            <div className="login-divider">개발 중</div>
            <button className="login-btn login-btn-dev" onClick={handleDevLogin} disabled={busy}>
              {busy ? <span className="inline-spin" style={{ borderTopColor: "#111" }} /> : "🛠️ 기사님으로 바로 로그인 (테스트)"}
            </button>
          </>
        )}
      </div>

      <div className="login-note">
        실제 문자(SMS) 인증은 발신 연동 후 작동합니다.
        <br />
        그 전까지는 임시 로그인을 사용하세요.
      </div>
    </div>
  );
}
