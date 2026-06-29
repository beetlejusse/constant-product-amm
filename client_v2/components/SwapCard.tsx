"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown02Icon } from "@hugeicons/core-free-icons";
import { TOKEN0, TOKEN1, SWAP_FEE_BPS, CHAIN_ID, chain, type TokenInfo } from "@/lib/contracts";
import { useSwapEstimate, useTokenBalance, useReserves } from "@/hooks/useReads";
import { useAmmActions } from "@/hooks/useWrites";
import { Card, Button } from "./ui/primitives";
import { AmountField } from "./ui/AmountField";

function tryParse(v: string, decimals: number): bigint {
  try {
    return v ? parseUnits(v, decimals) : 0n;
  } catch {
    return 0n;
  }
}

export function SwapCard() {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();
  const { swap } = useAmmActions();

  const [zeroForOne, setZeroForOne] = useState(true);
  const [amountIn, setAmountIn] = useState("");
  const [busy, setBusy] = useState(false);

  const tokenIn: TokenInfo = zeroForOne ? TOKEN0 : TOKEN1;
  const tokenOut: TokenInfo = zeroForOne ? TOKEN1 : TOKEN0;

  const amountInRaw = tryParse(amountIn, tokenIn.decimals);
  const { data: balanceIn } = useTokenBalance(tokenIn, address);
  const { data: balanceOut } = useTokenBalance(tokenOut, address);
  const { data: estimate, isFetching } = useSwapEstimate(tokenIn.address, amountInRaw);
  const { reserve0, reserve1 } = useReserves();

  const amountOut = (estimate as bigint | undefined) ?? 0n;
  const outDisplay = amountOut > 0n ? formatUnits(amountOut, tokenOut.decimals) : "";

  const reserveIn = zeroForOne ? reserve0 : reserve1;
  const reserveOut = zeroForOne ? reserve1 : reserve0;
  const inHuman = amountInRaw > 0n ? Number(formatUnits(amountInRaw, tokenIn.decimals)) : 0;
  const outHuman = amountOut > 0n ? Number(formatUnits(amountOut, tokenOut.decimals)) : 0;
  const effRate = inHuman > 0 && outHuman > 0 ? outHuman / inHuman : undefined;
  const spotRate =
    reserveIn && reserveOut && reserveIn > 0n
      ? Number(formatUnits(reserveOut, tokenOut.decimals)) / Number(formatUnits(reserveIn, tokenIn.decimals))
      : undefined;
  const priceImpact =
    effRate !== undefined && spotRate !== undefined && spotRate > 0
      ? Math.max(0, ((spotRate - effRate) / spotRate) * 100)
      : 0;

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;
  const insufficient = balanceIn !== undefined && amountInRaw > (balanceIn as bigint);
  const noLiquidity = amountInRaw > 0n && !isFetching && amountOut === 0n;

  function flip() {
    setZeroForOne((v) => !v);
    setAmountIn("");
  }

  async function handleSwap() {
    if (!address || amountInRaw === 0n) return;
    setBusy(true);
    try {

      await swap({
        tokenIn: tokenIn.address,
        amountIn: amountInRaw,
        account: address,
        label: `${amountIn} ${tokenIn.symbol} → ${tokenOut.symbol}`,
      });
      setAmountIn("");
    } catch {

    } finally {
      setBusy(false);
    }
  }

  let cta = { label: "Swap Tokens", disabled: false, action: handleSwap as () => void };
  if (!isConnected) cta = { label: "Connect Wallet", disabled: false, action: () => open() };
  else if (wrongNetwork) cta = { label: `Switch to ${chain.name}`, disabled: false, action: () => open({ view: "Networks" }) };
  else if (amountInRaw === 0n) cta = { label: "Enter an amount", disabled: true, action: () => {} };
  else if (insufficient) cta = { label: `Insufficient ${tokenIn.symbol}`, disabled: true, action: () => {} };
  else if (noLiquidity) cta = { label: "Insufficient liquidity", disabled: true, action: () => {} };

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">Swap Tokens</h2>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {SWAP_FEE_BPS / 100}% fee
        </span>
      </div>

      <div className="relative flex flex-col gap-1.5">
        <AmountField
          token={tokenIn}
          value={amountIn}
          onChange={setAmountIn}
          balance={balanceIn as bigint | undefined}
          onMax={
            balanceIn !== undefined
              ? () => setAmountIn(formatUnits(balanceIn as bigint, tokenIn.decimals))
              : undefined
          }
          label="From"
        />

        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <motion.button
            type="button"
            onClick={flip}
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary text-brand"
            aria-label="Flip direction"
          >
            <HugeiconsIcon icon={ArrowDown02Icon} size={18} strokeWidth={2.2} />
          </motion.button>
        </div>

        <AmountField
          token={tokenOut}
          value={isFetching && amountInRaw > 0n ? "…" : outDisplay}
          balance={balanceOut as bigint | undefined}
          label="To"
          readOnly
        />
      </div>

      <div className="mt-4 space-y-2.5 rounded-md border border-border bg-background/40 p-4 text-sm">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Transaction Details
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price Impact</span>
          <span className="tnum font-medium text-brand">{priceImpact.toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Expected to Receive</span>
          <span className="tnum font-medium text-brand">
            {outHuman > 0 ? outHuman.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "0.00"} {tokenOut.symbol}
          </span>
        </div>
        {effRate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span className="tnum text-foreground">
              1 {tokenIn.symbol} ≈ {effRate.toLocaleString("en-US", { maximumFractionDigits: 6 })} {tokenOut.symbol}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button size="lg" fullWidth loading={busy} disabled={cta.disabled} onClick={cta.action}>
          {cta.label}
        </Button>
      </div>
    </Card>
  );
}
