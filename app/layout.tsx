import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./citizen.css";

export const metadata: Metadata = {
  title: "🐿️ 다람쥐 택시",
  description: "청산면 마을 공유택시 — 주민·기사님",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f5a623",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
