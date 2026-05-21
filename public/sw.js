// public/sw.js
// MVP용 최소 서비스워커: 설치 가능(PWA) + 오프라인 시 캐시 폴백.
// ⚠️ 개선 제안: 프로덕션에서는 @ducanh2912/next-pwa 또는 Serwist로 교체해
// 빌드 산출물(_next/static)을 자동 프리캐시하는 것을 권장합니다.
const CACHE = "darangtaxi-v1";
const APP_SHELL = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // 페이지 이동: network-first → 실패 시 캐시
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // 정적 자원: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
