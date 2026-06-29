"use client";

import { motion } from "motion/react";

const CONTENT = {
  liquidity: {
    title: "Understanding AMM Mechanics",
    items: [
      {
        h: "Constant Product Formula",
        p: "The pool keeps x · y = k constant, where x and y are the two reserves. Adding liquidity grows both reserves proportionally, so k increases while the price stays the same.",
      },
      {
        h: "Dynamic Pool Balance",
        p: "Deposits must match the current reserve ratio. Type one side and the other is filled in automatically — providing off-ratio would change the price and is rejected by the contract.",
      },
      {
        h: "LP Token Precision",
        p: "LP shares use 18 decimals and can be very small. When removing liquidity, your share of each reserve is returned proportionally to the LP tokens you burn.",
      },
    ],
  },
  swap: {
    title: "Understanding Swap Mechanics",
    items: [
      {
        h: "Price Impact",
        p: "Price impact measures how much your trade moves the pool price. Larger trades relative to the reserves shift further along the curve, producing a worse effective rate.",
      },
      {
        h: "Pool Balances",
        p: "The balance bar visualises the current value split of the pool. Each swap moves reserves in opposite directions, nudging the ratio and the quoted price.",
      },
      {
        h: "Liquidity Depth",
        p: "Depth reflects how much volume the pool can absorb before price moves materially. Deeper reserves mean lower slippage on the same trade size.",
      },
    ],
  },
} as const;

export function AmmMechanics({ variant }: { variant: "liquidity" | "swap" }) {
  const data = CONTENT[variant];
  return (
    <section className="mx-auto mt-6 w-full max-w-6xl px-6 pb-24">
      <div className="rounded-lg border border-border bg-card p-6 lg:p-10">
        <h2 className="font-display text-3xl text-brand">{data.title}</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {data.items.map((item, i) => (
            <motion.div
              key={item.h}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <h3 className="text-lg font-medium text-foreground">{item.h}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.p}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
