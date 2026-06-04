"use client";

import { useEffect, useState } from "react";
import { setToken, authMe } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { ToastProvider } from "@/components/Toast";
import RoleLanding from "@/components/RoleLanding";
import AdminShell from "@/components/admin/AdminShell";
import CitizenShell from "@/components/citizen/CitizenShell";

type Role = "admin" | "resident";

export default function Page() {
  const [splashDone, setSplashDone] = useState(false);
  const [restored, setRestored] = useState(false);
  const [tok, setTok] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");

  /* 스플래시(최소 1.8초) + 기존 세션 복원 */
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
            const r = me.profile?.role;
            if ((r === "admin" || r === "resident") && alive) {
              setTok(at);
              setRole(r);
              setName(me.profile?.name ?? (r === "admin" ? "기사님" : "주민"));
            } else {
              setToken(null);
              await sb.auth.signOut();
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

  function handlePicked(token: string, pickedName: string, pickedRole: string) {
    // 토큰/실시간 setAuth 는 RoleLanding 에서 이미 처리됨
    setTok(token);
    setRole(pickedRole === "admin" ? "admin" : "resident");
    setName(pickedName);
  }

  async function handleLogout() {
    setToken(null);
    try {
      await getSupabase()?.auth.signOut();
    } catch {
      /* 무시 */
    }
    setTok(null);
    setRole(null);
    setName("");
  }

  const booting = !(splashDone && restored);
  const isCitizen = !!tok && role === "resident";

  return (
    <ToastProvider>
      <div className={"phone-shell" + (isCitizen ? " cz" : "")}>
        <div className="notch" />
        {booting ? (
          <div className="splash">
            <div className="splash-icon">🐿️</div>
            <div className="splash-title">다람쥐택시</div>
          </div>
        ) : !tok || !role ? (
          <RoleLanding onPicked={handlePicked} />
        ) : role === "admin" ? (
          <AdminShell token={tok} adminName={name || "기사님"} onLogout={handleLogout} />
        ) : (
          <CitizenShell token={tok} residentName={name || "주민"} onLogout={handleLogout} />
        )}
      </div>
    </ToastProvider>
  );
}
