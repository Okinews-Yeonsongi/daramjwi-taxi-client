"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "good" | "bad" | "ghost";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white active:opacity-90 disabled:bg-[#D8D8D8] disabled:text-[#999]",
  outline: "bg-white text-ink border-2 border-black/15 active:bg-bg",
  good: "bg-good text-white active:opacity-90",
  bad: "bg-bad text-white active:opacity-90",
  ghost: "bg-bg text-ink-muted active:bg-black/5",
};
const sizes: Record<Size, string> = {
  lg: "px-5 py-5 text-xl rounded-[18px]", // 어르신용 기본: 큰 버튼·큰 글씨
  md: "px-4 py-3 text-base rounded-[14px]",
  sm: "px-3 py-2 text-sm rounded-[12px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "lg", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 font-extrabold transition active:scale-[0.98] disabled:active:scale-100 disabled:cursor-default",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
