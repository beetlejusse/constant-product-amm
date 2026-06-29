import { LiquidityCard } from "@/components/LiquidityCard";
import { PoolAnalytics } from "@/components/app/PoolAnalytics";
import { PairHeader } from "@/components/app/PairHeader";
import { AmmMechanics } from "@/components/app/AmmMechanics";

export default function LiquidityPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-6">
        <PairHeader title="Liquidity Pool" />
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-6 lg:grid-cols-[1.5fr_1fr]">
        <PoolAnalytics title="Pool Analytics" />
        <LiquidityCard />
      </div>
      <AmmMechanics variant="liquidity" />
    </>
  );
}
