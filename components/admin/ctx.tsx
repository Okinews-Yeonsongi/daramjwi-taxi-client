"use client";

import { createContext, useContext } from "react";

export type AdminPage = "home" | "waiting" | "today" | "monthly" | "manual";

export interface AdminCtxValue {
  goPage: (p: AdminPage) => void;
  tick: number; // 실시간/변경 시 증가 → 화면이 다시 불러옴
  bump: () => void; // 데이터 변경 후 호출
  adminName: string;
  onLogout: () => void;
}

export const AdminCtx = createContext<AdminCtxValue | null>(null);

export function useAdmin(): AdminCtxValue {
  const v = useContext(AdminCtx);
  if (!v) throw new Error("useAdmin must be inside AdminShell");
  return v;
}
