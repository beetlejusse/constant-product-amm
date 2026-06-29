import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { CurveSection } from "@/components/landing/CurveSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PoolShowcase } from "@/components/landing/PoolShowcase";
import { CtaSection } from "@/components/landing/CtaSection";
import { SiteFooter } from "@/components/SiteFooter";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <CurveSection />
        <HowItWorks />
        <PoolShowcase />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
