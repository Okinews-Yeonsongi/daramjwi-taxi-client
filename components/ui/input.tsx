import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[14px] border-2 border-black/15 bg-bg px-4 py-4 text-lg text-ink outline-none placeholder:text-ink-hint focus:border-primary focus:bg-white",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
