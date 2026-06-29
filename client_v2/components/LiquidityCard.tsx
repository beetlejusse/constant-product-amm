"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { parseUnits, formatUnits, zeroAddress, type Address } from "viem";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { TOKEN0, TOKEN1, CHAIN_ID, chain, type TokenInfo } from "@/lib/contracts";
import {
  useReserves,
  useTokenBalance,
  useLpTokenAddress,
  useLpBalance,
  useLpSupply,
} from "@/hooks/useReads";
import { useAmmActions } from "@/hooks/useWrites";
import { Card, Button } from "./ui/primitives";
import { AmountField } from "./ui/AmountField";
import { fmtUnits } from "@/lib/format";

function tryParse(v: string, d: number): bigint {
  try {
    return v ? parseUnits(v, d) : 0n;
  } catch {
    return 0n;
  }
}

type Tab = "add" | "remove";

export function LiquidityCard() {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();
  const { addLiquidity, removeLiquidity } = useAmmActions();

  const [tab, setTab] = useState<Tab>("add");
  const [busy, setBusy] = useState(false);

  const { reserve0, reserve1 } = useReserves();
  const poolInit = !!reserve0 && !!reserve1 && reserve0 > 0n && reserve1 > 0n;

  const { data: bal0 } = useTokenBalance(TOKEN0, address);
  const { data: bal1 } = useTokenBalance(TOKEN1, address);
  const { data: lpToken } = useLpTokenAddress();
  const { data: lpBalance } = useLpBalance(lpToken as Address | undefined, address);
  const { data: lpSupply } = useLpSupply(lpToken as Address | undefined);

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">Liquidity</h2>
        <div className="flex rounded-full border border-border bg-secondary p-0.5">
          {(["add", "remove"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="relative cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium capitalize"
            >
              {tab === t && (
                <motion.span
                  layoutId="liq-tab"
                  className="absolute inset-0 rounded-full bg-foreground/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className={`relative z-10 ${tab === t ? "text-foreground" : "text-muted-foreground"}`}>
                {t}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === "add" ? (
          <motion.div
            key="add"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
          >
            <AddLiquidity
              poolInit={poolInit}
              reserve0={reserve0}
              reserve1={reserve1}
              bal0={bal0 as bigint | undefined}
              bal1={bal1 as bigint | undefined}
              address={address}
              isConnected={isConnected}
              wrongNetwork={wrongNetwork}
              busy={busy}
              setBusy={setBusy}
              onConnect={() => open()}
              onSwitch={() => open({ view: "Networks" })}
              add={addLiquidity}
            />
          </motion.div>
        ) : (
          <motion.div
            key="remove"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
          >
            <RemoveLiquidity
              lpToken={lpToken as Address | undefined}
              lpBalance={lpBalance as bigint | undefined}
              lpSupply={lpSupply as bigint | undefined}
              reserve0={reserve0}
              reserve1={reserve1}
              address={address}
              isConnected={isConnected}
              wrongNetwork={wrongNetwork}
              busy={busy}
              setBusy={setBusy}
              onConnect={() => open()}
              onSwitch={() => open({ view: "Networks" })}
              remove={removeLiquidity}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function AddLiquidity(props: {
  poolInit: boolean;
  reserve0?: bigint;
  reserve1?: bigint;
  bal0?: bigint;
  bal1?: bigint;
  address?: Address;
  isConnected: boolean;
  wrongNetwork: boolean;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onConnect: () => void;
  onSwitch: () => void;
  add: (p: { amount0: bigint; amount1: bigint; account: Address; label: string }) => Promise<void>;
}) {
  const { poolInit, reserve0, reserve1, bal0, bal1, address } = props;
  const [amt0, setAmt0] = useState("");
  const [amt1, setAmt1] = useState("");

  const raw0 = tryParse(amt0, TOKEN0.decimals);
  const raw1 = tryParse(amt1, TOKEN1.decimals);

  function onChange0(v: string) {
    setAmt0(v);
    if (poolInit && reserve0 && reserve1) {
      const r = tryParse(v, TOKEN0.decimals);
      setAmt1(r > 0n ? formatUnits((r * reserve1) / reserve0, TOKEN1.decimals) : "");
    }
  }
  function onChange1(v: string) {
    setAmt1(v);
    if (poolInit && reserve0 && reserve1) {
      const r = tryParse(v, TOKEN1.decimals);
      setAmt0(r > 0n ? formatUnits((r * reserve0) / reserve1, TOKEN0.decimals) : "");
    }
  }

  const insufficient = (bal0 !== undefined && raw0 > bal0) || (bal1 !== undefined && raw1 > bal1);

  async function submit() {
    if (!address) return;
    props.setBusy(true);
    try {

      await props.add({
        amount0: raw0,
        amount1: raw1,
        account: address,
        label: `${amt0} ${TOKEN0.symbol} + ${amt1} ${TOKEN1.symbol}`,
      });
      setAmt0("");
      setAmt1("");
    } catch {

    } finally {
      props.setBusy(false);
    }
  }

  let cta = { label: "Add Liquidity", disabled: false, action: submit as () => void };
  if (!props.isConnected) cta = { label: "Connect Wallet", disabled: false, action: props.onConnect };
  else if (props.wrongNetwork) cta = { label: `Switch to ${chain.name}`, disabled: false, action: props.onSwitch };
  else if (raw0 === 0n || raw1 === 0n) cta = { label: "Enter amounts", disabled: true, action: () => {} };
  else if (insufficient) cta = { label: "Insufficient balance", disabled: true, action: () => {} };

  return (
    <div className="flex flex-col gap-1.5">
      <AmountField
        token={TOKEN0}
        value={amt0}
        onChange={onChange0}
        balance={bal0}
        onMax={bal0 !== undefined ? () => onChange0(formatUnits(bal0, TOKEN0.decimals)) : undefined}
        label="Deposit"
      />
      <div className="flex justify-center py-0.5 text-muted-foreground">
        <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2.4} />
      </div>
      <AmountField
        token={TOKEN1}
        value={amt1}
        onChange={onChange1}
        balance={bal1}
        onMax={bal1 !== undefined ? () => onChange1(formatUnits(bal1, TOKEN1.decimals)) : undefined}
        label="Deposit"
      />

      <p className="mt-2 px-1 text-xs text-muted-foreground">
        {poolInit
          ? "Amounts are matched to the current pool ratio."
          : "Pool is empty — your deposit sets the initial price."}
      </p>

      <div className="mt-3">
        <Button size="lg" fullWidth loading={props.busy} disabled={cta.disabled} onClick={cta.action}>
          {cta.label}
        </Button>
      </div>
    </div>
  );
}

function RemoveLiquidity(props: {
  lpToken?: Address;
  lpBalance?: bigint;
  lpSupply?: bigint;
  reserve0?: bigint;
  reserve1?: bigint;
  address?: Address;
  isConnected: boolean;
  wrongNetwork: boolean;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onConnect: () => void;
  onSwitch: () => void;
  remove: (p: { shares: bigint; account: Address; label: string }) => Promise<void>;
}) {
  const { lpBalance, lpSupply, reserve0, reserve1, address } = props;
  const [shares, setShares] = useState("");
  const sharesRaw = tryParse(shares, 18);

  const lpInfo: TokenInfo = {
    key: "WETH",
    address: props.lpToken ?? zeroAddress,
    symbol: "LP",
    name: "Pool LP",
    decimals: 18,
    icon: "",
  };

  const out0 = lpSupply && lpSupply > 0n && reserve0 ? (sharesRaw * reserve0) / lpSupply : 0n;
  const out1 = lpSupply && lpSupply > 0n && reserve1 ? (sharesRaw * reserve1) / lpSupply : 0n;

  const sharePct =
    lpBalance && lpSupply && lpSupply > 0n ? (Number(lpBalance) / Number(lpSupply)) * 100 : undefined;

  const insufficient = lpBalance !== undefined && sharesRaw > lpBalance;

  async function submit() {
    if (!address) return;
    props.setBusy(true);
    try {

      await props.remove({ shares: sharesRaw, account: address, label: `${shares} LP` });
      setShares("");
    } catch {

    } finally {
      props.setBusy(false);
    }
  }

  let cta = { label: "Remove Liquidity", disabled: false, action: submit as () => void };
  if (!props.isConnected) cta = { label: "Connect Wallet", disabled: false, action: props.onConnect };
  else if (props.wrongNetwork) cta = { label: `Switch to ${chain.name}`, disabled: false, action: props.onSwitch };
  else if (sharesRaw === 0n) cta = { label: "Enter LP amount", disabled: true, action: () => {} };
  else if (insufficient) cta = { label: "Insufficient LP balance", disabled: true, action: () => {} };

  return (
    <div className="flex flex-col gap-1.5">
      <AmountField
        token={lpInfo}
        value={shares}
        onChange={setShares}
        balance={lpBalance}
        onMax={lpBalance !== undefined ? () => setShares(formatUnits(lpBalance, 18)) : undefined}
        label="Burn LP shares"
      />

      <div className="mt-2 space-y-2 rounded-md border border-border bg-background/40 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>You receive</span>
          {sharePct !== undefined && (
            <span className="tnum">
              Pool share: {sharePct.toLocaleString("en-US", { maximumFractionDigits: 4 })}%
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{TOKEN0.symbol}</span>
          <span className="tnum text-foreground">{fmtUnits(out0, TOKEN0.decimals, 6)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{TOKEN1.symbol}</span>
          <span className="tnum text-foreground">{fmtUnits(out1, TOKEN1.decimals, 4)}</span>
        </div>
      </div>

      <div className="mt-3">
        <Button size="lg" fullWidth loading={props.busy} disabled={cta.disabled} onClick={cta.action}>
          <HugeiconsIcon icon={MinusSignIcon} size={16} strokeWidth={2.2} />
          {cta.label}
        </Button>
      </div>
    </div>
  );
}
