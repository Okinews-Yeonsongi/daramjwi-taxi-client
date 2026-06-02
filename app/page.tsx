"use client";

import { useEffect, useState } from "react";
import { setToken, authMe } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { ToastProvider } from "@/components/Toast";
import LoginScreen from "@/components/LoginScreen";
import AdminShell from "@/components/admin/AdminShell";

export default function Page() {
  const [splashDone, setSplashDone] = useState(false);
  const [restored, setRestored] = useState(false); // 세션 복원 시도 완료 여부
  const [tok, setTok] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("기사님");

  /* 스플래시(최소 1.8초) + 기존 세션 복원 시도 */
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => alive && setSplashDone(true), 1800);

    (async () => {
      try {
        const sb = getSupabase();
        if (sb) {
          const { data } = await sb.auth.getSession();
          const at = data.session?.access_token;
          if (at) {
            setToken(at);
            sb.realtime.setAuth(at);
            const me = await authMe();
            if (me.profile?.role === "admin") {
              if (alive) {
                setTok(at);
                setAdminName(me.profile.name ?? "기사님");
              }
            } else {
              // 기사님 권한이 아니면 복원하지 않음
              setToken(null);
              await sb.auth.signOut();
            }
          }
        }
      } catch {
        /* 복원 실패 → 로그인 화면으로 */
      } finally {
        if (alive) setRestored(true);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  function handleLoggedIn(token: string, name: string) {
    // api 토큰/실시간 setAuth 는 LoginScreen 에서 이미 처리됨
    setTok(token);
    setAdminName(name);
  }

  async function handleLogout() {
    setToken(null);
    try {
      await getSupabase()?.auth.signOut();
    } catch {
      /* 무시 */
    }
    setTok(null);
    setAdminName("기사님");
  }

  const booting = !(splashDone && restored);

  return (
    <ToastProvider>
      <div className="phone-shell">
        <div className="notch" />
        {booting ? (
          <div className="splash">
            <div className="splash-icon">🐿️</div>
            <div className="splash-title">다람쥐택시</div>
          </div>
        ) : tok ? (
          <AdminShell token={tok} adminName={adminName} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLoggedIn={handleLoggedIn} />
        )}
      </div>
    </ToastProvider>
  );
}
