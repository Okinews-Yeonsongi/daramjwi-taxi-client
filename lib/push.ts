// 클라이언트 웹 푸시 lifecycle: 서비스워커 등록 + 권한 + 구독 + 서버 저장/해지.
// 서버: /api/push/public-key, /api/push/subscribe (POST/DELETE).

import { getPushPublicKey, savePushSubscription, deletePushSubscription } from "@/lib/api";

export type EnablePushResult = "ok" | "unsupported" | "denied" | "dismissed" | "error";

/** VAPID 공개키(base64url) → Uint8Array (applicationServerKey 용) */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

let regPromise: Promise<ServiceWorkerRegistration | null> | null = null;
function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return Promise.resolve(null);
  if (!regPromise) {
    regPromise = navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.warn("[push] 서비스워커 등록 실패:", e);
      return null;
    });
  }
  return regPromise;
}

/**
 * 로그인 후 호출. 서비스워커 등록 + (필요 시) 권한 요청 + 구독 + 서버 저장.
 * - opts.ask === false: 권한이 아직 'default'면 묻지 않고 조용히 종료 (이미 허용된 경우만 재구독).
 * 모든 실패는 조용히 처리 (본 기능에 영향 없음).
 */
export async function enablePush(opts: { ask?: boolean } = {}): Promise<EnablePushResult> {
  try {
    if (!pushSupported()) return "unsupported";
    const reg = await registerSW();
    if (!reg) return "unsupported";

    let perm = Notification.permission;
    if (perm === "default") {
      if (opts.ask === false) return "dismissed";
      perm = await Notification.requestPermission();
    }
    if (perm !== "granted") return "denied";

    const { publicKey } = await getPushPublicKey();
    if (!publicKey) {
      console.warn("[push] 서버에 VAPID 공개키가 없어요 (백엔드 VAPID_PUBLIC_KEY 미설정)");
      return "error";
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const j = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) return "error";

    await savePushSubscription({
      endpoint: j.endpoint,
      keys: { p256dh: j.keys.p256dh, auth: j.keys.auth },
      user_agent: navigator.userAgent,
    });
    return "ok";
  } catch (e) {
    console.warn("[push] enablePush 실패:", e);
    return "error";
  }
}

/** 로그아웃 시 호출. 서버 구독 삭제 + 로컬 구독 해지. */
export async function disablePush(): Promise<void> {
  try {
    if (!pushSupported()) return;
    const reg = (await navigator.serviceWorker.getRegistration()) ?? null;
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      try {
        await deletePushSubscription(sub.endpoint);
      } catch {
        /* 서버 삭제 실패 무시 */
      }
      try {
        await sub.unsubscribe();
      } catch {
        /* 로컬 해지 실패 무시 */
      }
    }
  } catch {
    /* 무시 */
  }
}
