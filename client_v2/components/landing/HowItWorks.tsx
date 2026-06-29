"use client";

import { useEffect, useRef, useState } from "react";
import { MonoLabel } from "@/components/ui/kit";
import { TOKEN0, TOKEN1, chain } from "@/lib/contracts";

const steps = [
  {
    number: "01",
    title: "Connect",
    subtitle: "& approve",
    description: `Connect a wallet on ${chain.name} and approve the AMM to move your ${TOKEN0.symbol} and ${TOKEN1.symbol}. Approvals happen inline, only when needed.`,
  },
  {
    number: "02",
    title: "Swap",
    subtitle: "or provide",
    description:
      "Trade either direction along the x·y=k curve with a live quote, or deposit both tokens to mint LP shares at the current ratio.",
  },
  {
    number: "03",
    title: "Track",
    subtitle: "& redeem",
    description:
      "Reserves and your position update live after each transaction. Burn LP shares anytime to redeem your proportional slice of the pool.",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setIsVisible(true), {
      threshold: 0.1,
    });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % steps.length), 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how" ref={sectionRef} className="relative overflow-hidden py-24 lg:py-32">
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-brand/[0.04] blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-16">
          <span
            className={`inline-flex items-center gap-3 font-mono text-sm text-muted-foreground transition-all duration-1000 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"}`}
          >
            <span className="h-px w-12 bg-foreground/20" />
            How it works
          </span>
          <h2
            className={`mt-8 font-display text-6xl leading-[0.85] tracking-tight transition-all delay-100 duration-1000 md:text-7xl lg:text-[110px] ${isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}
          >
            <span className="block text-foreground">Connect.</span>
            <span className="block text-foreground/30">Swap.</span>
            <span className="block text-foreground/10">Provide.</span>
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`relative cursor-pointer overflow-hidden border bg-black p-8 text-left transition-all duration-500 lg:p-12 ${
                activeStep === index ? "border-foreground/60" : "border-foreground/25 hover:border-foreground/50"
              }`}
            >
              <div className="mb-8 flex items-center gap-4">
                <span
                  className={`font-display text-4xl transition-colors duration-300 ${activeStep === index ? "text-brand" : "text-foreground/20"}`}
                >
                  {step.number}
                </span>
                <div className="h-px flex-1 overflow-hidden bg-foreground/10">
                  {activeStep === index && <div className="h-full animate-hiw-progress bg-brand/50" />}
                </div>
              </div>

              <h3 className="font-display text-3xl text-foreground lg:text-4xl">{step.title}</h3>
              <span className="mb-6 block font-display text-xl text-foreground/40">{step.subtitle}</span>
              <p className="leading-relaxed text-muted-foreground">{step.description}</p>

              <div
                className={`absolute inset-x-0 bottom-0 h-1 origin-left bg-brand transition-transform duration-500 ${activeStep === index ? "scale-x-100" : "scale-x-0"}`}
              />
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes hiw-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-hiw-progress {
          animation: hiw-progress 6s linear forwards;
        }
      `}</style>
    </section>
  );
}
