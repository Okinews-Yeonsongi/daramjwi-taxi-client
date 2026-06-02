"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastFn = (msg: string) => void;
const ToastCtx = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setOn(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={"toast" + (on ? " on" : "")}>{msg}</div>
    </ToastCtx.Provider>
  );
}
