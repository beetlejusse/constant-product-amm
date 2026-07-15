"use client";

import { type ReactNode } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ReloadIcon,
  LinkSquare02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { usePoolSummary } from "@/hooks/usePoolSummary";
import { usePoolState, useLpBalance } from "@/hooks/useReads";
import {
  TOKEN0,
  TOKEN1,
  AMM_ADDRESS,
  SWAP_FEE_BPS,
  explorerAddress,
} from "@/lib/contracts";
import { fmtUnits, shortAddr } from "@/lib/format";
import { Button } from "@/components/ui/primitives";

const compact = (n: number) =>
  !isFinite(n) || n === 0
    ? "0"
    : n.toLocaleString("en-US", {
        notation: "compact",
        maximumFractionDigits: 2,
      });

// The price move the depth readout is quoted against.
const IMPACT_REFERENCE = 0.01;

// Largest trade the pool absorbs before its price shifts by `impact`, derived from
// the reserves themselves. Constant product with fee: (x + gu)(x + u) = x^2 / (1 - impact),
// solved for u via the quadratic g*u^2 + (1 + g)*x*u - ((1 / (1 - impact)) - 1)*x^2 = 0.
function tradeSizeForImpact(
  reserve: number,
  impact: number,
  feeBps: number,
): number {
  if (!(reserve > 0)) return 0;
  const g = 1 - feeBps / 10_000;
  const target = 1 / (1 - impact) - 1;
  const b = (1 + g) * reserve;
  const c = -target * reserve * reserve;
  return (-b + Math.sqrt(b * b - 4 * g * c)) / (2 * g);
}

function Tile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-5 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`tnum mt-2 font-display text-3xl ${accent ? "text-brand" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

export function PoolAnalytics({ title }: { title: string }) {
  const qc = useQueryClient();
  const { address } = useAccount();
  const { reserve0, reserve1, lpSupply, lpToken, price, initialized } =
    usePoolSummary();
  const { isError } = usePoolState();
  const { data: lpBalance } = useLpBalance(lpToken, address);

  const wethHuman =
    reserve0 !== undefined ? Number(formatUnits(reserve0, TOKEN0.decimals)) : 0;
  const usdcHuman =
    reserve1 !== undefined ? Number(formatUnits(reserve1, TOKEN1.decimals)) : 0;
  const k = wethHuman * usdcHuman;

  const lpHeld = lpBalance as bigint | undefined;
  const hasShare = lpHeld !== undefined && !!lpSupply && lpSupply > 0n;
  const sharePct = hasShare
    ? Math.min(100, (Number(lpHeld) / Number(lpSupply)) * 100)
    : 0;

  const depth0 = tradeSizeForImpact(wethHuman, IMPACT_REFERENCE, SWAP_FEE_BPS);
  const depth1 = tradeSizeForImpact(usdcHuman, IMPACT_REFERENCE, SWAP_FEE_BPS);
  const impactLabel = `${(IMPACT_REFERENCE * 100).toFixed(0)}%`;

  return (
    <div className="rounded-lg border border-border bg-card p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        <button
          onClick={() => qc.invalidateQueries()}
          className="cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Refresh"
        >
          <HugeiconsIcon icon={ReloadIcon} size={16} strokeWidth={2} />
        </button>
      </div>

      {isError && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          <span className="mt-0.5 text-brand">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={14}
              strokeWidth={2}
            />
          </span>
          <span>
            Pool is not initialised yet — add the first liquidity to populate
            these stats.
          </span>
        </div>
      )}

      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Pool balances
      </span>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="tnum font-display text-2xl text-foreground sm:text-3xl">
          {fmtUnits(reserve0, TOKEN0.decimals, 4)} {TOKEN0.symbol}
        </span>
        <span className="tnum font-display text-2xl text-foreground sm:text-3xl">
          {fmtUnits(reserve1, TOKEN1.decimals, 2)} {TOKEN1.symbol}
        </span>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Ratio:{" "}
        <span className="tnum font-medium text-brand">
          {price !== undefined
            ? price.toLocaleString("en-US", { maximumFractionDigits: 2 })
            : "—"}
        </span>{" "}
        {TOKEN1.symbol} per {TOKEN0.symbol}
        <span className="ml-2 text-muted-foreground/70">
          · always 50 / 50 by value (x · y = k)
        </span>
      </p>

      <div className="mt-6 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Your share of pool
        </span>
        <span className="tnum text-xs text-muted-foreground">
          {hasShare
            ? `${fmtUnits(lpHeld, 18, 4)} / ${fmtUnits(lpSupply, 18, 4)} LP`
            : "—"}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500"
          style={{ width: `${hasShare ? sharePct : 0}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="tnum">
          {hasShare ? `${sharePct.toFixed(2)}% you` : "No position"}
        </span>
        <span className="tnum">
          {hasShare ? `${(100 - sharePct).toFixed(2)}% others` : "—"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Tile
          label="Your LP Tokens"
          value={hasShare ? fmtUnits(lpHeld, 18, 4) : "—"}
          sub={
            lpSupply
              ? `of ${fmtUnits(lpSupply, 18, 2)} total supply`
              : "No liquidity yet"
          }
          accent
        />
        <Tile
          label="Pool Constant"
          value={initialized ? compact(k) : "—"}
          sub="k = x × y"
        />
        <Tile
          label={`${TOKEN0.symbol} Price`}
          value={
            price !== undefined
              ? `${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
              : "—"
          }
          sub={
            price
              ? `1 ${TOKEN1.symbol} = ${(1 / price).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${TOKEN0.symbol}`
              : `${TOKEN1.symbol} per ${TOKEN0.symbol}`
          }
        />
        <Tile
          label="Liquidity Depth"
          value={initialized ? `${compact(depth0)} ${TOKEN0.symbol}` : "—"}
          sub={
            initialized
              ? `or ${compact(depth1)} ${TOKEN1.symbol} — moves price ${impactLabel}`
              : `trade size that moves price ${impactLabel}`
          }
        />
      </div>
    </div>
  );
}
