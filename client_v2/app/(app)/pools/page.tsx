import { PoolGrid } from "@/components/app/PoolGrid";

export const metadata = {
  title: "Pools",
  description: "Every liquidity pool on the platform, with live reserves, price and your share.",
};

export default function PoolsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-24">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Pools <span className="text-foreground/40">All markets</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every constant product pool on the platform. Reserves, price, TVL and your share are read live from chain on
          every load.
        </p>
      </div>
      <PoolGrid />
    </div>
  );
}
