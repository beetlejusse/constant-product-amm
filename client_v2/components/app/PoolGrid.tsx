"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReloadIcon, LinkSquare02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { usePools, type PoolRow } from "@/hooks/usePools";
import { explorerAddress, POOLS } from "@/lib/contracts";
import { fmtUnits, shortAddr } from "@/lib/format";
import { Button, Spinner } from "@/components/ui/primitives";
import { TokenPairIcon } from "@/components/app/PairHeader";

const compact = (n: number | undefined) =>
  n === undefined || !isFinite(n) ? "—" : n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });

function AddressLink({ label, address }: { label: string; address?: string }) {
  if (!address) return null;
  return (
    <a
      href={explorerAddress(address)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="text-muted-foreground/60">{label}</span>
      {shortAddr(address, 4)}
      <HugeiconsIcon icon={LinkSquare02Icon} size={11} strokeWidth={2} />
    </a>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tnum mt-1 font-display text-xl text-foreground">{value}</div>
    </div>
  );
}

function PoolCard({ row, index }: { row: PoolRow; index: number }) {
  const { info, price, tvl, sharePct, initialized, lpToken, reserve0, reserve1 } = row;
  const { isConnected } = useAccount();
  const hasPosition = isConnected && sharePct > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group relative flex flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TokenPairIcon size={36} token0={info.token0} token1={info.token1} />
          <div>
            <div className="font-display text-xl text-foreground">
              {info.token0.symbol} / {info.token1.symbol}
            </div>
            <div className="text-xs text-muted-foreground">0.30% fee · x · y = k</div>
          </div>
        </div>
        {hasPosition && (
          <span className="shrink-0 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-brand">
            Your position
          </span>
        )}
      </div>

      {!initialized ? (
        <div className="mt-6 flex items-start gap-2 rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          <span className="mt-0.5 text-brand">
            <HugeiconsIcon icon={InformationCircleIcon} size={14} strokeWidth={2} />
          </span>
          <span>No liquidity yet — this pool is waiting for its first deposit.</span>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Stat label={`TVL (${info.token1.symbol})`} value={compact(tvl)} />
            <Stat
              label="Price"
              value={price !== undefined ? price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
            />
          </div>

          <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>{info.token0.symbol} reserve</span>
              <span className="tnum text-foreground">{fmtUnits(reserve0, info.token0.decimals, 4)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{info.token1.symbol} reserve</span>
              <span className="tnum text-foreground">{fmtUnits(reserve1, info.token1.decimals, 2)}</span>
            </div>
          </div>

          {hasPosition && (
            <div className="mt-4 rounded-md border border-border bg-background/40 p-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Your share</span>
                <span className="tnum font-medium text-brand">{sharePct.toFixed(2)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${sharePct}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-4">
        <AddressLink label="Pool" address={info.address} />
        <AddressLink label="LP" address={lpToken} />
      </div>

      <div className="mt-5 flex gap-2">
        <Link href="/swap" className="flex-1">
          <Button variant="outline" size="sm" fullWidth>
            Swap
          </Button>
        </Link>
        <Link href="/liquidity" className="flex-1">
          <Button variant="brand" size="sm" fullWidth>
            {hasPosition ? "Manage" : "Add liquidity"}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export function PoolGrid() {
  const qc = useQueryClient();
  const { rows, isLoading, isError } = usePools();

  const totalTvl = rows.reduce((sum, r) => sum + (r.tvl ?? 0), 0);
  const liveCount = rows.filter((r) => r.initialized).length;

  if (POOLS.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center">
        <p className="font-display text-xl text-foreground">No pools configured</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Set <span className="font-mono text-foreground">NEXT_PUBLIC_CONTRACT_ADDRESS</span> to list your deployed
          pool.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>
            <span className="tnum font-display text-2xl text-foreground">{POOLS.length}</span>{" "}
            {POOLS.length === 1 ? "pool" : "pools"}
          </span>
          <span>
            <span className="tnum font-display text-2xl text-foreground">{liveCount}</span> with liquidity
          </span>
          <span>
            <span className="tnum font-display text-2xl text-brand">{compact(totalTvl)}</span> total TVL
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries()}>
          <HugeiconsIcon icon={ReloadIcon} size={14} strokeWidth={2} />
          Refresh
        </Button>
      </div>

      {isError && (
        <div className="mb-5 flex items-start gap-2 rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          <span className="mt-0.5 text-brand">
            <HugeiconsIcon icon={InformationCircleIcon} size={14} strokeWidth={2} />
          </span>
          <span>Could not read pool data — check that the RPC is reachable and the addresses are correct.</span>
        </div>
      )}

      {isLoading && rows.every((r) => r.reserve0 === undefined) ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-16 text-sm text-muted-foreground">
          <Spinner size={16} />
          Loading pools…
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, i) => (
            <PoolCard key={row.info.address} row={row} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
