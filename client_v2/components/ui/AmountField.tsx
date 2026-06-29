"use client";

import { type TokenInfo } from "@/lib/contracts";
import { fmtUnits } from "@/lib/format";

function sanitize(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function AmountField({
  token,
  value,
  onChange,
  balance,
  onMax,
  label,
  readOnly = false,
}: {
  token: TokenInfo;
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
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-semibold">
          {token.icon ? (

            <img
              src={token.icon}
              alt={token.symbol}
              width={18}
              height={18}
              className="size-[18px] rounded-full bg-white object-contain"
            />
          ) : (
            <span className="size-2 rounded-full bg-brand" />
          )}
          {token.symbol}
        </span>
      </div>
    </div>
  );
}
