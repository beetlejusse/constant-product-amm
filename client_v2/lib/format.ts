import { formatUnits } from "viem";

export function fmtUnits(value: bigint | undefined | null, decimals: number, maxFrac = 6): string {
  if (value === undefined || value === null) return "—";
  const s = formatUnits(value, decimals);
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (n === 0) return "0";
  if (n > 0 && n < 1 / 10 ** maxFrac) return `<${1 / 10 ** maxFrac}`;
  return n.toLocaleString("en-US", { maximumFractionDigits: maxFrac });
}

export function fmtCompact(value: bigint | undefined | null, decimals: number): string {
  if (value === undefined || value === null) return "—";
  const n = Number(formatUnits(value, decimals));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}

export function shortAddr(a?: string, n = 4): string {
  return a ? `${a.slice(0, 2 + n)}…${a.slice(-n)}` : "";
}

export function cleanError(e: unknown): string {
  if (!e) return "Unknown error";
  const anyE = e as { shortMessage?: string; message?: string };
  const msg = anyE.shortMessage || anyE.message || String(e);
  if (/user rejected|denied/i.test(msg)) return "Transaction rejected in wallet";
  return msg.split("\n")[0].slice(0, 160);
}
