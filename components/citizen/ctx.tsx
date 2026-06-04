"use client";

import { createContext, useContext } from "react";

export type CitizenScreen = "home" | "book" | "today" | "village" | "my";

export interface CitizenCtxValue {
  goScreen: (s: CitizenScreen) => void;
  tick: number; // 데이터 변경 신호
  bump: () => void;
  residentName: string;
  onLogout: () => void;
}

export const CitizenCtx = createContext<CitizenCtxValue | null>(null);

export function useCitizen(): CitizenCtxValue {
  const v = useContext(CitizenCtx);
  if (!v) throw new Error("useCitizen must be used within CitizenCtx");
  return v;
}
