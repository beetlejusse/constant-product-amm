"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

export function MonoLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 font-mono text-sm text-muted-foreground ${className}`}>
      <span className="h-px w-8 bg-foreground/20" />
      {children}
    </span>
  );
}

export function Display({
  lead,
  trail,
  className = "",
  as: Tag = "h2",
}: {
  lead: ReactNode;
  trail?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={`font-display tracking-tight leading-[0.9] text-foreground ${className}`}>
      <span>{lead}</span>
      {trail !== undefined && <span className="text-foreground/30"> {trail}</span>}
    </Tag>
  );
}

export function StatBig({
  value,
  label,
  className = "",
}: {
  value: ReactNode;
  label: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="tnum font-display text-3xl text-foreground lg:text-4xl">{value}</div>
      <div className="mt-2 text-xs leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}

export function NumberedCard({
  index,
  title,
  sub,
  children,
  active = false,
}: {
  index: string;
  title: string;
  sub?: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative border bg-black p-8 transition-colors duration-500 lg:p-10 ${active ? "border-foreground/60" : "border-foreground/20 hover:border-foreground/40"}`}
    >
      <div className="mb-8 flex items-center gap-4">
        <span className={`font-display text-4xl ${active ? "text-brand" : "text-foreground/20"}`}>
          {index}
        </span>
        <span className="h-px flex-1 bg-foreground/10" />
      </div>
      <h3 className="font-display text-3xl text-foreground lg:text-4xl">{title}</h3>
      {sub && <span className="mt-1 block font-display text-xl text-foreground/40">{sub}</span>}
      <p className="mt-5 leading-relaxed text-muted-foreground">{children}</p>
      <div
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand transition-transform duration-500 ${active ? "scale-x-100" : "scale-x-0"}`}
      />
    </motion.div>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`mx-auto w-full max-w-[1400px] px-6 lg:px-12 ${className}`}
    >
      {children}
    </motion.section>
  );
}
