// lib/supabase.ts
// OTP 로그인 + 실시간 동기화 전용 Supabase 클라이언트 (브라우저).
// anon key 는 공개되어도 안전합니다 (RLS 가 데이터 접근을 보호).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("[supabase] 환경변수 누락 — 실시간/OTP 비활성화됨");
    return null;
  }
  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _client;
}
