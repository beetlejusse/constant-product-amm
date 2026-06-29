"use client";

import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: 0.85 }}
      className="inline-flex"
    >
      <HugeiconsIcon icon={Loading03Icon} size={size} strokeWidth={2.2} />
    </motion.span>
  );
}

type Variant = "primary" | "outline" | "brand" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/90 disabled:bg-foreground/15 disabled:text-foreground/40",
  outline:
    "border border-foreground/20 text-foreground hover:bg-foreground/5 disabled:opacity-40",
  brand: "bg-brand text-black hover:brightness-105 disabled:bg-foreground/10 disabled:text-foreground/40",
  ghost: "text-foreground/70 hover:text-foreground hover:bg-foreground/5 disabled:opacity-40",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-colors duration-300 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading && <Spinner size={size === "lg" ? 18 : 15} />}
      {children}
    </motion.button>
  );
}

export function Card({
  className = "",
  id,
  children,
}: {
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className={`rounded-lg border border-border bg-card ${className}`}>
      {children}
    </div>
  );
}
