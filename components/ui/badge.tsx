import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1 text-sm font-extrabold whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
