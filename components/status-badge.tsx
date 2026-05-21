import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/constants";
import type { ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ReservationStatus; className?: string }) {
  const m = STATUS_META[status];
  return <Badge className={cn(m.bg, m.fg, className)}>{m.label}</Badge>;
}
