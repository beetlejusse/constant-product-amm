"use client";

import { motion } from "motion/react";
import { MonoLabel } from "@/components/ui/kit";
import { TOKEN0, TOKEN1, SWAP_FEE_BPS } from "@/lib/contracts";

const FEATURES = [
  {
    k: "Invariant",
    t: "x · y = k",
    d: "Reserves multiply to a constant. Every trade slides along the curve, setting price automatically.",
  },
  {
    k: "Fee",
    t: `${SWAP_FEE_BPS / 100}% to LPs`,
    d: "A fee is taken on every swap and left in the pool, accruing to liquidity providers over time.",
  },
  {
    k: "Pair",
    t: `${TOKEN0.symbol} / ${TOKEN1.symbol}`,
    d: "Two ERC-20 reserves. Deposit both to mint LP shares; burn shares to redeem your slice.",
  },
];

export function CurveSection() {
  return (
    <section id="curve" className="relative py-24 lg:py-32">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand/[0.05] blur-[120px]" />
      <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <MonoLabel className="!text-muted-foreground">The curve</MonoLabel>
          <h2 className="mt-8 font-display text-6xl leading-[0.9] tracking-tight md:text-7xl lg:text-8xl">
            <span className="block text-foreground">Constant product.</span>
            <span className="block text-foreground/30">x · y = k.</span>
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Prices come from the pool, not an order book. The product of the two reserves stays
            constant, so trading one token in pushes the other&apos;s price along a smooth curve.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-px border border-border bg-border sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.k}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-background p-8 lg:p-10"
            >
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{f.k}</span>
              <p className="mt-6 font-display text-3xl text-foreground">{f.t}</p>
              <p className="mt-3 leading-relaxed text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
