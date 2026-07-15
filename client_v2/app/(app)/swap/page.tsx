import { SwapCard } from "@/components/SwapCard";
import { PoolAnalytics } from "@/components/app/PoolAnalytics";
import { AmmMechanics } from "@/components/app/AmmMechanics";
import { TOKENS, NATIVE_ETH } from "@/lib/contracts";

function SwapTokensIcon({ size = 44 }: { size?: number }) {
  const tokens = [NATIVE_ETH, TOKENS.WETH, TOKENS.USDC];
  return (
    <div className="flex items-center">
      {tokens.map((t, i) => (

        <img
          key={t.key}
          src={t.icon}
          alt={t.symbol}
          width={size}
          height={size}
          className={`rounded-full bg-white object-contain ring-2 ring-background ${i > 0 ? "-ml-3" : ""}`}
          style={{ width: size, height: size, zIndex: tokens.length - i }}
        />
      ))}
    </div>
  );
}

export default function SwapPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-6 pt-28 pb-6">
        <div className="flex items-center gap-4">
          <SwapTokensIcon />
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            ETH / WETH / USDC <span className="text-foreground/40">Token Swap</span>
          </h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <PoolAnalytics title="Swap Analytics" />
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-2xl text-foreground">How swaps route</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pick any pair of ETH, WETH, and USDC and the swap chooses the route for you. ETH and
              WETH convert 1:1 through the canonical WETH contract — wrapping deposits native ETH and
              mints an equal amount of WETH; unwrapping redeems it back. The only cost is gas.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Swaps involving USDC are routed through the WETH/USDC constant-product pool and pay the
              pool&apos;s 0.3% fee. Since native ETH isn&apos;t an ERC-20 token, ETH ⇄ USDC trades
              bridge through WETH automatically: the swap wraps (or unwraps) and swaps in sequence, so
              you&apos;ll confirm two transactions — plus a one-time token approval if needed.
            </p>
          </div>
        </div>
        <SwapCard />
      </div>
      <AmmMechanics variant="swap" />
    </>
  );
}
