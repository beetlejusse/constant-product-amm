"use client";

import { useReadContract, useReadContracts } from "wagmi";
import type { Address } from "viem";
import {
  ammAbi,
  erc20Abi,
  AMM_ADDRESS,
  isAmmConfigured,
  TOKEN0,
  TOKEN1,
  type TokenInfo,
} from "@/lib/contracts";

const amm = { address: AMM_ADDRESS, abi: ammAbi } as const;

export function usePoolState() {
  return useReadContract({
    ...amm,
    functionName: "getpoolState",
    query: { enabled: isAmmConfigured, retry: false },
  });
}

export function useLpTokenAddress() {
  return useReadContract({
    ...amm,
    functionName: "getLPTokenAddress",
    query: { enabled: isAmmConfigured },
  });
}

export function usePoolToken() {
  return useReadContract({
    ...amm,
    functionName: "poolToken",
    query: { enabled: isAmmConfigured },
  });
}

export function useSwapEstimate(tokenIn: Address | undefined, amountIn: bigint) {
  const enabled = isAmmConfigured && !!tokenIn && amountIn > 0n;
  return useReadContract({
    ...amm,
    functionName: "getSwapEstimate",
    args: enabled ? [tokenIn as Address, amountIn] : undefined,
    query: { enabled, retry: false },
  });
}

export function useTokenBalance(token: TokenInfo, owner?: Address) {
  return useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  });
}

export function useAllowance(token: TokenInfo, owner?: Address) {
  return useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: owner ? [owner, AMM_ADDRESS] : undefined,
    query: { enabled: !!owner },
  });
}

export function useReserves() {
  const res = useReadContracts({
    contracts: [
      { address: TOKEN0.address, abi: erc20Abi, functionName: "balanceOf", args: [AMM_ADDRESS] },
      { address: TOKEN1.address, abi: erc20Abi, functionName: "balanceOf", args: [AMM_ADDRESS] },
    ],
    query: { enabled: isAmmConfigured },
  });
  return {
    reserve0: res.data?.[0]?.result as bigint | undefined,
    reserve1: res.data?.[1]?.result as bigint | undefined,
    isLoading: res.isLoading,
    refetch: res.refetch,
  };
}

export function useLpSupply(lp?: Address) {
  return useReadContract({
    address: lp,
    abi: erc20Abi,
    functionName: "totalSupply",
    query: { enabled: !!lp },
  });
}

export function useLpBalance(lp?: Address, owner?: Address) {
  return useReadContract({
    address: lp,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!lp && !!owner },
  });
}
