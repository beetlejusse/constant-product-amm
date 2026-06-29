"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/primitives";
import { TOKEN0, TOKEN1 } from "@/lib/contracts";

export function CtaSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[1400px]  px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-4xl border border-border bg-card px-6 py-24 text-center lg:py-28"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/10 blur-[100px]" />
          <div className="relative">
            <h2 className="font-display text-6xl leading-[0.9] tracking-tight md:text-7xl lg:text-8xl">
              <span className="text-foreground">Start trading</span>{" "}
              <span className="text-foreground/30">in seconds.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
              Swap {TOKEN0.symbol}/{TOKEN1.symbol} or provide liquidity on a
              live, on-chain constant-product pool.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/swap">
                <Button size="lg" className="px-8">
                  Open swap
                </Button>
              </Link>
              <Link href="/liquidity">
                <Button size="lg" variant="outline">
                  Provide liquidity
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
