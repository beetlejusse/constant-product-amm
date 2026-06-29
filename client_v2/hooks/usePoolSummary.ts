"use client";

import { formatUnits, type Address } from "viem";
import { useReserves, useLpTokenAddress, useLpSupply } from "./useReads";
import { TOKEN0, TOKEN1 } from "@/lib/contracts";

export function usePoolSummary() {
  const { reserve0, reserve1 } = useReserves();
  const { data: lpToken } = useLpTokenAddress();
  const { data: lpSupply } = useLpSupply(lpToken as Address | undefined);

  const initialized = !!reserve0 && !!reserve1 && reserve0 > 0n && reserve1 > 0n;

  const price = initialized
    ? Number(formatUnits(reserve1!, TOKEN1.decimals)) / Number(formatUnits(reserve0!, TOKEN0.decimals))
    : undefined;

  return {
    reserve0,
    reserve1,
    lpToken: lpToken as Address | undefined,
    lpSupply: lpSupply as bigint | undefined,
    price,
    initialized,
  };
}
