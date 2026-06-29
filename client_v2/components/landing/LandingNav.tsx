"use client";

import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/primitives";

const LINKS = [
  { name: "The curve", href: "#curve" },
  { name: "How it works", href: "#how" },
  { name: "Pool", href: "#pool" },
];

export function LandingNav() {
  return (
    <SiteNav
      links={LINKS}
      cta={
        <>
          <Link href="/liquidity">
            <Button variant="ghost" size="sm">
              Liquidity
            </Button>
          </Link>
          <Link href="/swap">
            <Button size="sm" className="px-6">
              Launch app
            </Button>
          </Link>
        </>
      }
    />
  );
}
