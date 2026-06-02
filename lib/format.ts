// lib/format.ts
// 백엔드가 KST(한국시간) 기준으로 동작하므로 프론트도 KST 로 날짜를 계산합니다.
// (dev-console.html 의 kstDate/ymd 와 동일한 로직)

export const DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** offset(일) 만큼 더한 KST 기준 Date (UTC 필드로 읽어야 KST 가 됨) */
export function kstDate(offsetDays = 0): Date {
  return new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400000);
}

/** Date → "YYYY-MM-DD" (UTC 필드 사용 = KST 날짜) */
export function ymd(d: Date): string {
  return (
    d.getUTCFullYear() +
    "-" +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getUTCDate()).padStart(2, "0")
  );
}

/** KST 오늘 "YYYY-MM-DD" */
export function todayStr(): string {
  return ymd(kstDate());
}

/** "2026-05-25" → "5월 25일 (일)" */
export function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

/** "2026-05-25" → "2026년 5월 25일 (일요일)" */
export function fmtDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]}요일)`;
}

/** hour + minute → "오전 10시 30분" */
export function fmtTime(hour: number, minute = 0): string {
  const ampm = hour < 12 ? "오전" : "오후";
  let h12 = hour > 12 ? hour - 12 : hour;
  if (h12 === 0) h12 = 12;
  return `${ampm} ${h12}시${minute ? ` ${minute}분` : ""}`;
}

/** 카테고리 키 → 한글 권역명 */
export function categoryLabel(cat: "cheongsanmyeon" | "eupnae"): string {
  return cat === "cheongsanmyeon" ? "청산면" : "읍내";
}

/** 주(week)의 시작(일요일) Date 를 KST 로 계산 */
export function weekStartOf(d: Date): Date {
  const day = d.getUTCDay();
  return new Date(d.getTime() - day * 86400000);
}

/** 해당 날짜가 그 달의 몇 주차인지 */
export function weekOfMonth(d: Date): number {
  const firstDow = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).getUTCDay();
  return Math.ceil((d.getUTCDate() + firstDow) / 7);
}
