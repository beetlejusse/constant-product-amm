"use client";

import { useState } from "react";
import Link from "next/link";
import { type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel02Icon } from "@hugeicons/core-free-icons";
import { useScrolled } from "@/hooks/useScrolled";

export interface NavLink {
  name: string;
  href: string;
  active?: boolean;
}

function NavAnchor({
  href,
  className,
  style,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className} style={style} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}

export function SiteNav({
  links,
  cta,
  brandHref = "/",
}: {
  links: NavLink[];
  cta: ReactNode;
  brandHref?: string;
}) {
  const scrolled = useScrolled(20);
  const [mobileOpen, setMobileOpen] = useState(false);
  const condensed = scrolled || mobileOpen;

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${condensed ? "top-4 right-4 left-4" : "top-0 right-0 left-0"}`}
    >
      <nav
        className={`mx-auto transition-all duration-500 ${
          condensed
            ? "max-w-[1200px] rounded-2xl border border-foreground/10 bg-background/80 shadow-lg backdrop-blur-xl"
            : "max-w-[1400px] border border-transparent bg-transparent"
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 transition-all duration-500 lg:px-8 ${scrolled ? "h-14" : "h-20"}`}
        >

          <Link href={brandHref} className="flex items-center gap-2">
            <span
              className={`font-display tracking-tight transition-all duration-500 ${scrolled ? "text-xl text-foreground" : "text-2xl text-white"}`}
            >
              Constant
            </span>
            <span
              className={`font-mono transition-all duration-500 ${scrolled ? "mt-0.5 text-[10px] text-muted-foreground" : "mt-1 text-xs text-white/60"}`}
            >
              AMM
            </span>
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            {links.map((link) => (
              <NavAnchor
                key={link.href}
                href={link.href}
                className={`group relative text-sm transition-colors duration-300 ${
                  link.active
                    ? "text-foreground"
                    : scrolled
                      ? "text-foreground/70 hover:text-foreground"
                      : "text-white/70 hover:text-white"
                }`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-1 left-0 h-px transition-all duration-300 ${link.active ? "w-full" : "w-0 group-hover:w-full"} ${scrolled ? "bg-foreground" : "bg-white"}`}
                />
              </NavAnchor>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">{cta}</div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`cursor-pointer p-2 transition-colors duration-500 md:hidden ${condensed ? "text-foreground" : "text-white"}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <HugeiconsIcon icon={Cancel02Icon} size={24} strokeWidth={2} />
            ) : (
              <span className="flex flex-col gap-1.5">
                <span className="block h-px w-6 bg-current" />
                <span className="block h-px w-6 bg-current" />
              </span>
            )}
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-background transition-all duration-500 md:hidden ${mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="flex h-full flex-col px-8 pt-28 pb-8">
          <div className="flex flex-1 flex-col justify-center gap-7">
            {links.map((link, i) => (
              <NavAnchor
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`font-display text-5xl text-foreground transition-all duration-500 ${mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                style={{ transitionDelay: mobileOpen ? `${i * 75}ms` : "0ms" }}
              >
                {link.name}
              </NavAnchor>
            ))}
          </div>
          <div
            className="flex gap-3 border-t border-foreground/10 pt-8"
            onClick={() => setMobileOpen(false)}
          >
            {cta}
          </div>
        </div>
      </div>
    </header>
  );
}
