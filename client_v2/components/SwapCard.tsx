"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { parseUnits, formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown02Icon } from "@hugeicons/core-free-icons";
import { TOKENS, NATIVE_ETH, SWAP_FEE_BPS, CHAIN_ID, chain, type TokenInfo } from "@/lib/contracts";
import { useSwapEstimate, useTokenBalance, useReserves } from "@/hooks/useReads";
import { useAmmActions, useWethActions } from "@/hooks/useWrites";
import { Card, Button } from "./ui/primitives";
import { AmountField } from "./ui/AmountField";

const SWAP_TOKENS: TokenInfo[] = [NATIVE_ETH, TOKENS.WETH, TOKENS.USDC];

// Kept aside when pressing MAX on ETH so the wrap tx still has gas to pay for itself
const GAS_RESERVE = parseUnits("0.0005", 18);

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
  const { wrap, unwrap } = useWethActions();

  const [tokenIn, setTokenIn] = useState<TokenInfo>(NATIVE_ETH);
  const [tokenOut, setTokenOut] = useState<TokenInfo>(TOKENS.USDC);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  // Route: ETH<->WETH is a pure wrap/unwrap; anything involving USDC goes
  // through the AMM, with ETH legs bridged via WETH.
  const isWrap = tokenIn.key === "ETH" && tokenOut.key === "WETH";
  const isUnwrap = tokenIn.key === "WETH" && tokenOut.key === "ETH";
  const wrapOnly = isWrap || isUnwrap;
  const swapIn = tokenIn.key === "ETH" ? TOKENS.WETH : tokenIn;
  const swapOut = tokenOut.key === "ETH" ? TOKENS.WETH : tokenOut;

  const amountRaw = tryParse(amount, tokenIn.decimals);
  const { data: ethBalance } = useBalance({ address, query: { enabled: !!address } });
  const { data: wethBalance } = useTokenBalance(TOKENS.WETH, address);
  const { data: usdcBalance } = useTokenBalance(TOKENS.USDC, address);

  function balanceOf(t: TokenInfo): bigint | undefined {
    if (t.key === "ETH") return ethBalance?.value;
    if (t.key === "WETH") return wethBalance as bigint | undefined;
    return usdcBalance as bigint | undefined;
  }
  const balanceIn = balanceOf(tokenIn);
  const balanceOut = balanceOf(tokenOut);

  const { data: estimate, isFetching } = useSwapEstimate(
    wrapOnly ? undefined : swapIn.address,
    amountRaw,
  );
  const { reserve0, reserve1 } = useReserves();

  const amountOut = wrapOnly ? amountRaw : ((estimate as bigint | undefined) ?? 0n);
  const outDisplay = wrapOnly ? amount : amountOut > 0n ? formatUnits(amountOut, tokenOut.decimals) : "";

  const inHuman = amountRaw > 0n ? Number(formatUnits(amountRaw, tokenIn.decimals)) : 0;
  const outHuman = amountOut > 0n ? Number(formatUnits(amountOut, tokenOut.decimals)) : 0;
  const effRate = inHuman > 0 && outHuman > 0 ? outHuman / inHuman : undefined;

  // Price impact only applies to the AMM leg (WETH is token0, USDC token1)
  const reserveIn = swapIn.key === "WETH" ? reserve0 : reserve1;
  const reserveOut = swapIn.key === "WETH" ? reserve1 : reserve0;
  const spotRate =
    !wrapOnly && reserveIn && reserveOut && reserveIn > 0n
      ? Number(formatUnits(reserveOut, swapOut.decimals)) / Number(formatUnits(reserveIn, swapIn.decimals))
      : undefined;
  const priceImpact =
    effRate !== undefined && spotRate !== undefined && spotRate > 0
      ? Math.max(0, ((spotRate - effRate) / spotRate) * 100)
      : 0;

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;
  const insufficient = balanceIn !== undefined && amountRaw > balanceIn;
  const noLiquidity = !wrapOnly && amountRaw > 0n && !isFetching && amountOut === 0n;

  function selectIn(t: TokenInfo) {
    if (t.key === tokenOut.key) setTokenOut(tokenIn);
    setTokenIn(t);
    setAmount("");
  }

  function selectOut(t: TokenInfo) {
    if (t.key === tokenIn.key) setTokenIn(tokenOut);
    setTokenOut(t);
    setAmount("");
  }

  function flip() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmount("");
  }

  function handleMax() {
    if (balanceIn === undefined) return;
    const max =
      tokenIn.key === "ETH" ? (balanceIn > GAS_RESERVE ? balanceIn - GAS_RESERVE : 0n) : balanceIn;
    setAmount(formatUnits(max, tokenIn.decimals));
  }

  async function handleSwap() {
    if (!address || amountRaw === 0n) return;
    setBusy(true);
    try {
      if (isWrap) {
        await wrap({ amount: amountRaw, label: `${amount} ETH → WETH` });
      } else if (isUnwrap) {
        await unwrap({ amount: amountRaw, label: `${amount} WETH → ETH` });
      } else {
        if (tokenIn.key === "ETH") {
          await wrap({ amount: amountRaw, label: `${amount} ETH → WETH` });
        }
        const swappedOut = await swap({
          tokenIn: swapIn.address,
          amountIn: amountRaw,
          account: address,
          label: `${amount} ${swapIn.symbol} → ${swapOut.symbol}`,
        });
        if (tokenOut.key === "ETH" && swappedOut !== undefined && swappedOut > 0n) {
          await unwrap({
            amount: swappedOut,
            label: `${formatUnits(swappedOut, 18)} WETH → ETH`,
          });
        }
      }
      setAmount("");
    } catch {

    } finally {
      setBusy(false);
    }
  }

  let ctaLabel = "Swap Tokens";
  if (isWrap) ctaLabel = "Wrap ETH";
  else if (isUnwrap) ctaLabel = "Unwrap WETH";
  else if (tokenIn.key === "ETH") ctaLabel = "Wrap & Swap";
  else if (tokenOut.key === "ETH") ctaLabel = "Swap & Unwrap";

  let cta = { label: ctaLabel, disabled: false, action: handleSwap as () => void };
  if (!isConnected) cta = { label: "Connect Wallet", disabled: false, action: () => open() };
  else if (wrongNetwork) cta = { label: `Switch to ${chain.name}`, disabled: false, action: () => open({ view: "Networks" }) };
  else if (amountRaw === 0n) cta = { label: "Enter an amount", disabled: true, action: () => {} };
  else if (insufficient) cta = { label: `Insufficient ${tokenIn.symbol}`, disabled: true, action: () => {} };
  else if (noLiquidity) cta = { label: "Insufficient liquidity", disabled: true, action: () => {} };

  const routeLabel = wrapOnly
    ? `${tokenIn.symbol} → ${tokenOut.symbol}`
    : tokenIn.key === "ETH"
      ? `ETH → WETH → ${tokenOut.symbol}`
      : tokenOut.key === "ETH"
        ? `${tokenIn.symbol} → WETH → ETH`
        : `${tokenIn.symbol} → ${tokenOut.symbol}`;

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">Swap Tokens</h2>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {wrapOnly ? "1:1 · No fee" : `${SWAP_FEE_BPS / 100}% fee`}
        </span>
      </div>

      <div className="relative flex flex-col gap-1.5">
        <AmountField
          token={tokenIn}
          tokens={SWAP_TOKENS}
          onSelectToken={selectIn}
          value={amount}
          onChange={setAmount}
          balance={balanceIn}
          onMax={balanceIn !== undefined ? handleMax : undefined}
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
          tokens={SWAP_TOKENS}
          onSelectToken={selectOut}
          value={!wrapOnly && isFetching && amountRaw > 0n ? "…" : outDisplay}
          balance={balanceOut}
          label="To"
          readOnly
        />
      </div>

      <div className="mt-4 space-y-2.5 rounded-md border border-border bg-background/40 p-4 text-sm">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Transaction Details
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Route</span>
          <span className="tnum font-medium text-foreground">{routeLabel}</span>
        </div>
        {!wrapOnly && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price Impact</span>
            <span className="tnum font-medium text-brand">{priceImpact.toFixed(2)}%</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Expected to Receive</span>
          <span className="tnum font-medium text-brand">
            {outHuman > 0 ? outHuman.toLocaleString("en-US", { maximumFractionDigits: 6 }) : "0.00"}{" "}
            {tokenOut.symbol}
          </span>
        </div>
        {effRate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span className="tnum text-foreground">
              1 {tokenIn.symbol} ≈ {effRate.toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
              {tokenOut.symbol}
            </span>
          </div>
        )}
        {!wrapOnly && (tokenIn.key === "ETH" || tokenOut.key === "ETH") && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Transactions</span>
            <span className="tnum text-foreground">2 (plus approval if needed)</span>
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
