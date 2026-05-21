"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarPlus, Bus, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/resident", label: "홈", icon: Home },
  { href: "/resident/booking", label: "탑승신청", icon: CalendarPlus },
  { href: "/resident/today", label: "오늘운행", icon: Bus },
  { href: "/resident/reservations", label: "내예약", icon: ClipboardCheck },
];

export function ResidentNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 flex border-t border-black/10 bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/resident" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-1.5 text-[13px] font-bold",
              active ? "text-primary" : "text-ink-hint",
            )}
          >
            <Icon size={26} strokeWidth={active ? 2.4 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
