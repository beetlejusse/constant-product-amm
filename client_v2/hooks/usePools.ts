"use client";

import { useMemo } from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { ammAbi, erc20Abi, POOLS, type PoolInfo } from "@/lib/contracts";

export interface PoolRow {
  info: PoolInfo;
  lpToken?: Address;
  reserve0?: bigint;
  reserve1?: bigint;
  lpSupply?: bigint;
  lpBalance?: bigint;
  /** token1 per token0, derived from live reserves */
  price?: number;
  /** pool value denominated in token1 — a constant product pool is 50/50 by value, so this is 2x reserve1 */
  tvl?: number;
  sharePct: number;
  initialized: boolean;
}

export interface UsePoolsResult {
  rows: PoolRow[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

// Reserves are read as raw token balances rather than via getpoolState(), because
// getpoolState() divides by reserve1 before guarding against zero and therefore
// reverts on an empty pool. Balances stay readable at every stage of a pool's life.
export function usePools(): UsePoolsResult {
  const { address } = useAccount();

  const poolCalls = useMemo(
    () =>
      POOLS.flatMap((p) => [
        { address: p.token0.address, abi: erc20Abi, functionName: "balanceOf", args: [p.address] } as const,
        { address: p.token1.address, abi: erc20Abi, functionName: "balanceOf", args: [p.address] } as const,
        { address: p.address, abi: ammAbi, functionName: "getLPTokenAddress" } as const,
      ]),
    [],
  );

  const pools = useReadContracts({
    contracts: poolCalls,
    query: { enabled: POOLS.length > 0, retry: false },
  });

  const lpTokens = useMemo(
    () => POOLS.map((_, i) => pools.data?.[i * 3 + 2]?.result as Address | undefined),
    [pools.data],
  );

  // Second round: LP supply for every discovered LP token, plus the connected
  // wallet's balance. Kept as an index map so a pool whose LP token failed to
  // resolve doesn't shift everything after it.
  const lpTargets = useMemo(() => {
    const out: { poolIndex: number; lp: Address }[] = [];
    lpTokens.forEach((lp, i) => {
      if (lp) out.push({ poolIndex: i, lp });
    });
    return out;
  }, [lpTokens]);

  const lpCalls = useMemo(
    () =>
      lpTargets.flatMap(({ lp }) => [
        { address: lp, abi: erc20Abi, functionName: "totalSupply" } as const,
        ...(address
          ? [{ address: lp, abi: erc20Abi, functionName: "balanceOf", args: [address] } as const]
          : []),
      ]),
    [lpTargets, address],
  );

  const lp = useReadContracts({
    contracts: lpCalls,
    query: { enabled: lpTargets.length > 0, retry: false },
  });

  const stride = address ? 2 : 1;

  const lpByPool = useMemo(() => {
    const supply = new Map<number, bigint>();
    const balance = new Map<number, bigint>();
    lpTargets.forEach(({ poolIndex }, i) => {
      const s = lp.data?.[i * stride]?.result as bigint | undefined;
      if (s !== undefined) supply.set(poolIndex, s);
      if (address) {
        const b = lp.data?.[i * stride + 1]?.result as bigint | undefined;
        if (b !== undefined) balance.set(poolIndex, b);
      }
    });
    return { supply, balance };
  }, [lpTargets, lp.data, stride, address]);

  const rows = useMemo<PoolRow[]>(
    () =>
      POOLS.map((info, i) => {
        const reserve0 = pools.data?.[i * 3]?.result as bigint | undefined;
        const reserve1 = pools.data?.[i * 3 + 1]?.result as bigint | undefined;
        const lpSupply = lpByPool.supply.get(i);
        const lpBalance = lpByPool.balance.get(i);

        const initialized = !!reserve0 && !!reserve1 && reserve0 > 0n && reserve1 > 0n;

        const r0 = reserve0 !== undefined ? Number(formatUnits(reserve0, info.token0.decimals)) : 0;
        const r1 = reserve1 !== undefined ? Number(formatUnits(reserve1, info.token1.decimals)) : 0;

        const price = initialized && r0 > 0 ? r1 / r0 : undefined;
        const tvl = initialized ? r1 * 2 : undefined;

        const sharePct =
          lpBalance !== undefined && lpSupply !== undefined && lpSupply > 0n
            ? Math.min(100, (Number(lpBalance) / Number(lpSupply)) * 100)
            : 0;

        return {
          info,
          lpToken: lpTokens[i],
          reserve0,
          reserve1,
          lpSupply,
          lpBalance,
          price,
          tvl,
          sharePct,
          initialized,
        };
      }),
    [pools.data, lpTokens, lpByPool],
  );

  return {
    rows,
    isLoading: pools.isLoading || lp.isLoading,
    isError: pools.isError,
    refetch: () => {
      void pools.refetch();
      void lp.refetch();
    },
  };
}
