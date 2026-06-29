"use client";

import { type ReactNode } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReloadIcon, LinkSquare02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { usePoolSummary } from "@/hooks/usePoolSummary";
import { usePoolState, useLpBalance } from "@/hooks/useReads";
import { TOKEN0, TOKEN1, AMM_ADDRESS, explorerAddress } from "@/lib/contracts";
import { fmtUnits, shortAddr } from "@/lib/format";
import { Button } from "@/components/ui/primitives";

const compact = (n: number) =>
  !isFinite(n) || n === 0 ? "0" : n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });

function Tile({ label, value, sub, accent }: { label: string; value: ReactNode; sub: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-5 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`tnum mt-2 font-display text-3xl ${accent ? "text-brand" : "text-foreground"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

export function PoolAnalytics({ title }: { title: string }) {
  const qc = useQueryClient();
  const { address } = useAccount();
  const { reserve0, reserve1, lpSupply, lpToken, price, initialized } = usePoolSummary();
  const { isError } = usePoolState();
  const { data: lpBalance } = useLpBalance(lpToken, address);

  const wethHuman = reserve0 !== undefined ? Number(formatUnits(reserve0, TOKEN0.decimals)) : 0;
  const usdcHuman = reserve1 !== undefined ? Number(formatUnits(reserve1, TOKEN1.decimals)) : 0;

  const wethVal = price ? wethHuman * price : 0;
  const total = wethVal + usdcHuman;
  const wethPct = total > 0 ? (wethVal / total) * 100 : 50;
  const usdcPct = 100 - wethPct;

  const k = wethHuman * usdcHuman;
  const sharePct =
    lpBalance !== undefined && lpSupply && lpSupply > 0n
      ? (Number(lpBalance) / Number(lpSupply)) * 100
      : 0;
  const depth = usdcHuman >= 100_000 ? "High" : usdcHuman >= 10_000 ? "Medium" : usdcHuman > 0 ? "Low" : "—";

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
            <HugeiconsIcon icon={InformationCircleIcon} size={14} strokeWidth={2} />
          </span>
          <span>Pool is not initialised yet — add the first liquidity to populate these stats.</span>
        </div>
      )}

      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Pool balances</span>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="tnum font-display text-2xl text-foreground sm:text-3xl">
          {fmtUnits(reserve0, TOKEN0.decimals, 4)} {TOKEN0.symbol}
        </span>
        <span className="tnum font-display text-2xl text-foreground sm:text-3xl">
          {fmtUnits(reserve1, TOKEN1.decimals, 2)} {TOKEN1.symbol}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${wethPct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="tnum">{wethPct.toFixed(1)}% {TOKEN0.symbol}</span>
        <span className="tnum">{usdcPct.toFixed(1)}% {TOKEN1.symbol}</span>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Ratio:{" "}
        <span className="tnum font-medium text-brand">
          {price !== undefined ? price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
        </span>{" "}
        {TOKEN1.symbol} per {TOKEN0.symbol}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Tile
          label="Your Pool Share"
          value={`${sharePct.toFixed(4)}%`}
          sub={`${fmtUnits(lpBalance as bigint | undefined, 18, 4)} LP Tokens`}
          accent
        />
        <Tile label="Pool Constant" value={initialized ? compact(k) : "—"} sub="k = x × y" />
        <Tile
          label={`${TOKEN0.symbol} Price`}
          value={price !== undefined ? `${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
          sub={
            price
              ? `1 ${TOKEN1.symbol} = ${(1 / price).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${TOKEN0.symbol}`
              : `${TOKEN1.symbol} per ${TOKEN0.symbol}`
          }
        />
        <Tile label="Liquidity Depth" value={depth} sub={`${fmtUnits(reserve0, TOKEN0.decimals, 2)} ${TOKEN0.symbol} available`} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
        <a href={explorerAddress(AMM_ADDRESS)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono transition-colors hover:text-foreground">
          AMM {shortAddr(AMM_ADDRESS, 4)}
          <HugeiconsIcon icon={LinkSquare02Icon} size={12} strokeWidth={2} />
        </a>
        {lpToken && (
          <a href={explorerAddress(lpToken)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono transition-colors hover:text-foreground">
            LP {shortAddr(lpToken, 4)}
            <HugeiconsIcon icon={LinkSquare02Icon} size={12} strokeWidth={2} />
          </a>
        )}
      </div>

      <div className="mt-5 flex justify-center">
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries()}>
          <HugeiconsIcon icon={ReloadIcon} size={14} strokeWidth={2} />
          Refresh pool data
        </Button>
      </div>
    </div>
  );
}
