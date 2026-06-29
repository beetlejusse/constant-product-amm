import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { AMM_ADDRESS, WETH_ADDRESS, USDC_ADDRESS, explorerAddress, chain } from "@/lib/contracts";

const columns: { title: string; links: { name: string; href: string; external?: boolean }[] }[] = [
  {
    title: "App",
    links: [
      { name: "Swap", href: "/swap" },
      { name: "Liquidity", href: "/liquidity" },
      { name: "The curve", href: "/#curve" },
      { name: "How it works", href: "/#how" },
    ],
  },
  {
    title: "Contracts",
    links: [
      { name: "AMM", href: explorerAddress(AMM_ADDRESS), external: true },
      { name: "WETH", href: explorerAddress(WETH_ADDRESS), external: true },
      { name: "USDC", href: explorerAddress(USDC_ADDRESS), external: true },
    ],
  },
  {
    title: "Network",
    links: [{ name: chain.name, href: chain.blockExplorers?.default.url ?? "#", external: true }],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-12">
        <div className="grid grid-cols-2 gap-10 py-16 md:grid-cols-5 lg:py-20">

          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="font-display text-2xl text-foreground">Constant</span>
              <span className="font-mono text-xs text-muted-foreground">AMM</span>
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A constant-product automated market maker for WETH/USDC, deployed to{" "}
              {chain.name}.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-6 text-sm font-medium text-foreground">{col.title}</h3>
              <ul className="space-y-4">
                {col.links.map((link) =>
                  link.external ? (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.name}
                        <HugeiconsIcon icon={LinkSquare02Icon} size={12} strokeWidth={2} />
                      </a>
                    </li>
                  ) : (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-8 md:flex-row">
          <p className="text-sm text-muted-foreground/60">© 2026 Constant. Educational project.</p>
          <span className="flex items-center gap-2 text-sm text-muted-foreground/60">
            <span className="size-2 rounded-full bg-brand" />
            Live on {chain.name}
          </span>
        </div>
      </div>
    </footer>
  );
}
