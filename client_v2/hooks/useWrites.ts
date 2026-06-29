"use client";

import { useConfig, type Config } from "wagmi";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { ammAbi, erc20Abi, AMM_ADDRESS, TOKEN0, TOKEN1, tokenByAddress } from "@/lib/contracts";
import { useToast, type ToastContextValue } from "@/components/ui/Toast";
import { cleanError } from "@/lib/format";

async function ensureAllowance(
  config: Config,
  token: Address,
  owner: Address,
  amount: bigint,
  toast: ToastContextValue,
) {
  const current = await readContract(config, {
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, AMM_ADDRESS],
  });

  if (current >= amount) return;

  const sym = tokenByAddress(token)?.symbol ?? "token";
  const id = toast.notify({
    status: "pending",
    title: `Approve ${sym}`,
    description: "Confirm the approval in your wallet…",
  });
  try {
    const hash = await writeContract(config, {
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [AMM_ADDRESS, amount],
    });
    toast.update(id, { hash, description: "Waiting for approval to confirm…" });
    await waitForTransactionReceipt(config, { hash });
    toast.update(id, { status: "success", title: `${sym} approved`, description: undefined });
  } catch (e) {
    toast.update(id, { status: "error", title: `${sym} approval failed`, description: cleanError(e) });
    throw e;
  }
}

export function useAmmActions() {
  const config = useConfig();
  const qc = useQueryClient();
  const toast = useToast();

  async function track(
    opts: { title: string; failTitle: string; label: string },
    write: () => Promise<`0x${string}`>,
  ) {
    const id = toast.notify({ status: "pending", title: opts.title, description: "Confirm in your wallet…" });
    try {
      const hash = await write();
      toast.update(id, { hash, description: "Waiting for confirmation…" });
      await waitForTransactionReceipt(config, { hash });
      toast.update(id, { status: "success", title: `${opts.title} confirmed`, description: opts.label, hash });
      await qc.invalidateQueries();
    } catch (e) {
      toast.update(id, { status: "error", title: opts.failTitle, description: cleanError(e) });
      throw e;
    }
  }

  async function swap(p: { tokenIn: Address; amountIn: bigint; account: Address; label: string }) {
    await ensureAllowance(config, p.tokenIn, p.account, p.amountIn, toast);
    await track({ title: "Swap", failTitle: "Swap failed", label: p.label }, () =>
      writeContract(config, {
        address: AMM_ADDRESS,
        abi: ammAbi,
        functionName: "swap",
        args: [p.tokenIn, p.amountIn],
      }),
    );
  }

  async function addLiquidity(p: { amount0: bigint; amount1: bigint; account: Address; label: string }) {
    await ensureAllowance(config, TOKEN0.address, p.account, p.amount0, toast);
    await ensureAllowance(config, TOKEN1.address, p.account, p.amount1, toast);
    await track({ title: "Add liquidity", failTitle: "Add liquidity failed", label: p.label }, () =>
      writeContract(config, {
        address: AMM_ADDRESS,
        abi: ammAbi,
        functionName: "addLiquidityToPool",
        args: [p.amount0, p.amount1],
      }),
    );
  }

  async function removeLiquidity(p: { shares: bigint; account: Address; label: string }) {
    await track({ title: "Remove liquidity", failTitle: "Remove liquidity failed", label: p.label }, () =>
      writeContract(config, {
        address: AMM_ADDRESS,
        abi: ammAbi,
        functionName: "removeLiquidityfromPool",
        args: [p.shares],
      }),
    );
  }

  return { swap, addLiquidity, removeLiquidity };
}
