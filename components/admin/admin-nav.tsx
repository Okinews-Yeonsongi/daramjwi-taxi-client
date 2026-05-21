"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Phone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "홈", icon: Home },
  { href: "/admin/list", label: "신청목록", icon: ClipboardList },
  { href: "/admin/intake", label: "신청입력", icon: Phone },
  { href: "/admin/residents", label: "주민", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 flex border-t border-black/10 bg-white px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-1.5 text-xs font-bold",
              active ? "text-primary" : "text-ink-hint",
            )}
          >
            <Icon size={24} strokeWidth={active ? 2.4 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
