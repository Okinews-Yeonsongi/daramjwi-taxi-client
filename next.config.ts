import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 PWA 자산(manifest, sw.js)은 public/ 에서 그대로 서빙됩니다.
  // 프로덕션에서는 @ducanh2912/next-pwa 또는 Serwist 도입을 권장(개선 제안 참고).
  reactStrictMode: true,
};

export default nextConfig;
