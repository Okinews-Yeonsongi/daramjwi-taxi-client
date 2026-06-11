// 다람쥐 택시 — 클라이언트 서비스워커
// 웹 푸시 수신 + 알림 클릭 처리. 서버(daramjwi-taxi-server)의 sw.js와 호환.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "다람쥐 택시", body: event.data ? event.data.text() : "새 알림" };
  }

  const title = payload.title || "🐿️ 다람쥐 택시";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: payload.badge || "/icons/icon-192.png",
    tag: payload.tag || "daramjwi-notify",
    data: { url: payload.url || "/" },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // 서버 알림의 url 은 서버 콘솔 경로(/dev-console.html#...)라 우리 앱엔 없음 → 앱 루트로 보정
  let targetUrl = (event.notification.data && event.notification.data.url) || "/";
  if (targetUrl.indexOf("/dev-console.html") === 0 || targetUrl.indexOf("dev-console.html") !== -1) {
    targetUrl = "/";
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url.indexOf(self.location.origin) === 0) {
          await client.focus();
          if (client.navigate) {
            try {
              await client.navigate(targetUrl);
            } catch (e) {}
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })()
  );
});
