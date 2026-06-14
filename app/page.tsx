"use client";

import { useEffect, useState } from "react";
import { setToken, authMe } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { enablePush, disablePush } from "@/lib/push";
import { ToastProvider } from "@/components/Toast";
import RoleLanding from "@/components/RoleLanding";
import AdminShell from "@/components/admin/AdminShell";
import CitizenShell from "@/components/citizen/CitizenShell";
import CitizenOnboarding from "@/components/citizen/CitizenOnboarding";

type Role = "admin" | "resident";

export default function Page() {
  const [splashDone, setSplashDone] = useState(false);
  const [restored, setRestored] = useState(false);
  const [tok, setTok] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [onboarding, setOnboarding] = useState(false);

  /* 스플래시(최소 1.8초) + 카카오 콜백 처리 + 기존 세션 복원 */
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => alive && setSplashDone(true), 1800);

    (async () => {
      try {
        const sb = getSupabase();
        if (sb) {
          // 1) 카카오 콜백에서 돌아온 경우 — URL fragment 에 토큰이 있음
          const frag = new URLSearchParams((window.location.hash || "").slice(1));
          const fragAccess = frag.get("access_token");
          const fragRefresh = frag.get("refresh_token");
          const fragOnboarding = frag.get("needsOnboarding") === "1";
          if (fragAccess && fragRefresh) {
            await sb.auth.setSession({ access_token: fragAccess, refresh_token: fragRefresh });
            window.history.replaceState(null, "", window.location.pathname);
          }

          // 2) 세션 확인 (방금 카카오로 설정했거나, 이전 자동 로그인)
          const { data } = await sb.auth.getSession();
          const at = data.session?.access_token;
          if (at) {
            setToken(at);
            sb.realtime.setAuth(at);
            const me = await authMe();
            const r = me.profile?.role;
            if (alive) {
              if (r === "admin") {
                setTok(at);
                setRole("admin");
                setName(me.profile?.name ?? "기사님");
              } else {
                // 카카오/주민 (역할 미지정도 주민으로 취급)
                setTok(at);
                setRole("resident");
                setName(me.profile?.name ?? "주민");
                // 전화번호가 없으면(최초 카카오 가입) 온보딩 필요
                setOnboarding(fragOnboarding || !me.profile || !me.profile.phone);
              }
            }
          }
        }
      } catch {
        /* 복원 실패 → 랜딩으로 */
      } finally {
        if (alive) setRestored(true);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  /* 로그인 후: 최초 1회는 자동으로 알림 권한을 물어보고, 이후엔 조용히 재구독.
     (닫았거나 거부했으면 홈의 '🔔 알림 켜기' 버튼으로 다시 켤 수 있어요.
      아이폰 Safari는 자동 팝업이 막혀 있어 버튼으로만 됩니다.) */
  useEffect(() => {
    if (!(tok && role && !onboarding)) return;
    const KEY = "daramjwi-push-auto-asked";
    let asked = false;
    try {
      asked = localStorage.getItem(KEY) === "1";
    } catch {
      /* 무시 */
    }
    const id = setTimeout(() => {
      enablePush({ ask: !asked });
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        /* 무시 */
      }
    }, 1200);
    return () => clearTimeout(id);
  }, [tok, role, onboarding]);

  function handlePicked(token: string, pickedName: string, pickedRole: string) {
    // 토큰/실시간 setAuth 는 RoleLanding 에서 이미 처리됨 (테스트 로그인)
    setTok(token);
    setRole(pickedRole === "admin" ? "admin" : "resident");
    setName(pickedName);
    setOnboarding(false);
  }

  async function handleLogout() {
    try {
      await disablePush(); // 토큰 유효할 때 서버 구독 삭제
    } catch {
      /* 무시 */
    }
    setToken(null);
    try {
      await getSupabase()?.auth.signOut();
    } catch {
      /* 무시 */
    }
    setTok(null);
    setRole(null);
    setName("");
    setOnboarding(false);
  }

  const booting = !(splashDone && restored);
  const isCitizen = !!tok && role === "resident";

  return (
    <ToastProvider>
      <div className={"phone-shell" + (isCitizen ? " cz" : "")}>
        <div className="notch" />
        {booting ? (
          <div className="splash">
            <div className="splash-icon">
              <img src="/character.png" alt="" style={{ width: "76%", height: "76%", objectFit: "contain" }} />
            </div>
            <div className="splash-title">다람쥐택시</div>
          </div>
        ) : !tok || !role ? (
          <RoleLanding onPicked={handlePicked} />
        ) : role === "admin" ? (
          <AdminShell token={tok} adminName={name || "기사님"} onLogout={handleLogout} />
        ) : onboarding ? (
          <CitizenOnboarding
            initialName={name}
            onDone={(nm) => {
              setName(nm);
              setOnboarding(false);
            }}
            onSkip={() => setOnboarding(false)}
          />
        ) : (
          <CitizenShell token={tok} residentName={name || "주민"} onLogout={handleLogout} />
        )}
      </div>
    </ToastProvider>
  );
}
