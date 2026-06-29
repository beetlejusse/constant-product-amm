"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { usePoolSummary } from "@/hooks/usePoolSummary";
import { TOKEN0, TOKEN1, SWAP_FEE_BPS, chain } from "@/lib/contracts";
import { fmtUnits } from "@/lib/format";

const words = ["swap", "balance", "compound", "scale"];

function BlurWord({ word, trigger }: { word: string; trigger: number }) {
  const letters = word.split("");
  const STAGGER = 45;
  const DURATION = 500;
  const GRADIENT_HOLD = STAGGER * letters.length + DURATION + 200;

  const [letterStates, setLetterStates] = useState<{ opacity: number; blur: number }[]>(
    letters.map(() => ({ opacity: 0, blur: 20 })),
  );
  const [showGradient, setShowGradient] = useState(true);
  const framesRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    framesRef.current.forEach(cancelAnimationFrame);
    timersRef.current.forEach(clearTimeout);
    framesRef.current = [];
    timersRef.current = [];

    setLetterStates(letters.map(() => ({ opacity: 0, blur: 20 })));
    setShowGradient(true);

    letters.forEach((_, i) => {
      const t = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setLetterStates((prev) => {
            const next = [...prev];
            next[i] = { opacity: eased, blur: 20 * (1 - eased) };
            return next;
          });
          if (progress < 1) framesRef.current.push(requestAnimationFrame(tick));
        };
        framesRef.current.push(requestAnimationFrame(tick));
      }, i * STAGGER);
      timersRef.current.push(t);
    });

    const gt = setTimeout(() => setShowGradient(false), GRADIENT_HOLD);
    timersRef.current.push(gt);

    return () => {
      framesRef.current.forEach(cancelAnimationFrame);
      timersRef.current.forEach(clearTimeout);
    };

  }, [trigger]);

  const gradientColors = ["#eca8d6", "#a78bfa", "#67e8f9", "#fbbf24", "#eca8d6"];
  const hex2rgb = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];

  return (
    <>
      {letters.map((char, i) => {
        const colorIndex = (i / Math.max(letters.length - 1, 1)) * (gradientColors.length - 1);
        const lower = Math.floor(colorIndex);
        const upper = Math.min(lower + 1, gradientColors.length - 1);
        const t = colorIndex - lower;
        const [r1, g1, b1] = hex2rgb(gradientColors[lower]);
        const [r2, g2, b2] = hex2rgb(gradientColors[upper]);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: letterStates[i]?.opacity ?? 0,
              filter: `blur(${letterStates[i]?.blur ?? 20}px)`,
              color: showGradient ? `rgb(${r},${g},${b})` : "white",
              transition: "color 0.4s ease",
            }}
          >
            {char}
          </span>
        );
      })}
    </>
  );
}

export function LandingHero() {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const { reserve0, reserve1 } = usePoolSummary();

  useEffect(() => setIsVisible(true), []);
  useEffect(() => {
    const interval = setInterval(() => setWordIndex((p) => (p + 1) % words.length), 2500);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: fmtUnits(reserve0, TOKEN0.decimals, 3), label: `${TOKEN0.symbol} in reserve` },
    { value: fmtUnits(reserve1, TOKEN1.decimals, 2), label: `${TOKEN1.symbol} in reserve` },
    { value: `${SWAP_FEE_BPS / 100}%`, label: "swap fee to LPs" },
  ];

  return (
    <section className="relative flex min-h-screen flex-col items-start justify-center overflow-hidden bg-black">

      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-80"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden opacity-20">
        {[...Array(8)].map((_, i) => (
          <div key={`h-${i}`} className="absolute right-0 left-0 h-px bg-white/10" style={{ top: `${12.5 * (i + 1)}%` }} />
        ))}
        {[...Array(12)].map((_, i) => (
          <div key={`v-${i}`} className="absolute top-0 bottom-0 w-px bg-white/10" style={{ left: `${8.33 * (i + 1)}%` }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-32 lg:px-12 lg:py-40">
        <div className="lg:max-w-[60%]">
          <div className={`mb-8 transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <span className="inline-flex items-center gap-3 font-mono text-sm text-white/60">
              <span className="h-px w-8 bg-white/30" />
              Constant-product AMM
            </span>
          </div>

          <h1
            className={`text-left font-display text-[clamp(2rem,6vw,7rem)] leading-[0.92] tracking-tight text-white transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          >
            <span className="block whitespace-nowrap">On-chain liquidity,</span>
            <span className="block whitespace-nowrap">
              pools that{" "}
              <span className="relative inline-block">
                <BlurWord word={words[wordIndex]} trigger={wordIndex} />
              </span>
            </span>
          </h1>

          <div className={`mt-10 flex flex-wrap items-center gap-3 transition-all delay-300 duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <Link href="/swap">
              <Button size="lg" className="px-8">
                Launch app
              </Button>
            </Link>
            <Link href="/liquidity">
              <Button size="lg" variant="outline" className="border-white/25 text-white hover:bg-white/10">
                Provide liquidity
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className={`absolute right-0 bottom-12 left-0 px-6 transition-all delay-500 duration-700 lg:px-12 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="mx-auto flex max-w-[1400px] items-start gap-10 lg:gap-20">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2">
              <span className="tnum font-display text-3xl text-white lg:text-4xl">{stat.value}</span>
              <span className="text-xs leading-tight text-white/50">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
