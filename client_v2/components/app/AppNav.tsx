"use client";

import { usePathname } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { ConnectButton } from "@/components/ConnectButton";
import { chain } from "@/lib/contracts";

export function AppNav() {
  const pathname = usePathname();
  const links = [
    { name: "Home", href: "/" },
    { name: "Swap", href: "/swap", active: pathname === "/swap" },
    { name: "Pools", href: "/pools", active: pathname === "/pools" },
    { name: "Liquidity", href: "/liquidity", active: pathname === "/liquidity" },
  ];

  return (
    <SiteNav
      links={links}
      cta={
        <>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" />
            {chain.name}
          </span>
          <ConnectButton size="sm" />
        </>
      }
    />
  );
}
