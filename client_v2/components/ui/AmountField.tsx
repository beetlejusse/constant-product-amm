"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { type TokenInfo } from "@/lib/contracts";
import { fmtUnits } from "@/lib/format";

function sanitize(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function TokenIcon({ token, size = 18 }: { token: TokenInfo; size?: number }) {
  return token.icon ? (

    <img
      src={token.icon}
      alt={token.symbol}
      width={size}
      height={size}
      className="rounded-full bg-white object-contain"
      style={{ width: size, height: size }}
    />
  ) : (
    <span className="size-2 rounded-full bg-brand" />
  );
}

function TokenSelect({
  token,
  tokens,
  onSelect,
}: {
  token: TokenInfo;
  tokens: TokenInfo[];
  onSelect: (t: TokenInfo) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-semibold transition-colors hover:border-foreground/30"
      >
        <TokenIcon token={token} />
        {token.symbol}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={14}
          strokeWidth={2.2}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-md border border-border bg-card shadow-xl">
          {tokens.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect(t);
              }}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/5 ${
                t.key === token.key ? "bg-foreground/5" : ""
              }`}
            >
              <TokenIcon token={t} size={22} />
              <span>
                <span className="block font-semibold leading-tight">{t.symbol}</span>
                <span className="block text-xs leading-tight text-muted-foreground">{t.name}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AmountField({
  token,
  tokens,
  onSelectToken,
  value,
  onChange,
  balance,
  onMax,
  label,
  readOnly = false,
}: {
  token: TokenInfo;
  tokens?: TokenInfo[];
  onSelectToken?: (t: TokenInfo) => void;
  value: string;
  onChange?: (v: string) => void;
  balance?: bigint;
  onMax?: () => void;
  label: string;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-4 transition-colors focus-within:border-foreground/30">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        {balance !== undefined && (
          <button
            type="button"
            onClick={onMax}
            disabled={!onMax}
            className="tnum cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
          >
            Balance: {fmtUnits(balance, token.decimals, 4)}
            {onMax && <span className="ml-1 font-semibold text-brand">MAX</span>}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.0"
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(sanitize(e.target.value))}
          className="tnum w-full min-w-0 bg-transparent text-2xl font-medium text-foreground outline-none placeholder:text-foreground/20 read-only:text-muted-foreground"
        />
        {tokens && onSelectToken ? (
          <TokenSelect token={token} tokens={tokens} onSelect={onSelectToken} />
        ) : (
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-semibold">
            <TokenIcon token={token} />
            {token.symbol}
          </span>
        )}
      </div>
    </div>
  );
}
