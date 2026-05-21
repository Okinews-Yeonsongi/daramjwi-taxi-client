"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/** 하단 바텀시트 — 예약 상세/확인 모달에 공통 사용 (PRD: 바텀시트 또는 모달) */
export function Sheet({ open, onClose, children, className }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-ink/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "animate-sheet-up w-full rounded-t-[28px] bg-white px-5 pb-10 pt-2",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto my-4 h-[5px] w-11 rounded-full bg-[#DDD]" />
        {children}
      </div>
    </div>
  );
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-1.5 text-2xl font-black text-ink">{children}</h2>;
}
export function SheetSub({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-base text-ink-muted">{children}</p>;
}
