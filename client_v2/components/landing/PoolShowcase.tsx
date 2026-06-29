"use client";

import { motion } from "motion/react";
import { MonoLabel } from "@/components/ui/kit";
import { usePoolSummary } from "@/hooks/usePoolSummary";
import { TOKEN0, TOKEN1, SWAP_FEE_BPS, chain } from "@/lib/contracts";
import { fmtUnits, fmtCompact } from "@/lib/format";

export function PoolShowcase() {
  const { reserve0, reserve1, lpSupply, price, initialized } = usePoolSummary();

  return (
    <section id="pool" className="relative py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 lg:grid-cols-2 lg:items-end"
        >
          <div>
            <MonoLabel>Live pool</MonoLabel>
            <h2 className="mt-8 font-display text-6xl leading-[0.9] tracking-tight md:text-7xl lg:text-8xl">
              <span className="block text-foreground">Real reserves,</span>
              <span className="block text-foreground/30">real time.</span>
            </h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground lg:justify-self-end">
            Read straight from the contract on {chain.name}. No backend, no cache — the numbers below
            are the pool&apos;s on-chain state right now.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-px border border-border bg-border lg:grid-cols-3">

          <div className="bg-background p-8 lg:col-span-2 lg:p-12">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {TOKEN0.symbol} price
            </span>
            <div className="tnum mt-6 flex items-baseline gap-3">
              <span className="font-display text-6xl text-foreground lg:text-8xl">
                {price !== undefined ? price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
              </span>
              <span className="text-lg text-muted-foreground">{TOKEN1.symbol}</span>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {initialized
                ? `${fmtUnits(reserve0, TOKEN0.decimals, 4)} ${TOKEN0.symbol} · ${fmtUnits(reserve1, TOKEN1.decimals, 2)} ${TOKEN1.symbol} in reserve`
                : "Pool not initialised yet — add the first liquidity to set the price."}
            </p>
          </div>

          <div className="grid grid-rows-2 gap-px bg-border">
            <div className="flex flex-col justify-center bg-background p-8">
              <span className="tnum font-display text-4xl text-foreground">{fmtCompact(lpSupply, 18)}</span>
              <span className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                LP supply
              </span>
            </div>
            <div className="flex flex-col justify-center bg-background p-8">
              <span className="tnum font-display text-4xl text-foreground">{SWAP_FEE_BPS / 100}%</span>
              <span className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Swap fee → LPs
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
