import { TOKEN0, TOKEN1 } from "@/lib/contracts";

export function TokenPairIcon({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center">

      <img
        src={TOKEN0.icon}
        alt={TOKEN0.symbol}
        width={size}
        height={size}
        className="z-10 rounded-full bg-white object-contain ring-2 ring-background"
        style={{ width: size, height: size }}
      />

      <img
        src={TOKEN1.icon}
        alt={TOKEN1.symbol}
        width={size}
        height={size}
        className="-ml-3 rounded-full bg-white object-contain ring-2 ring-background"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

export function PairHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <TokenPairIcon />
      <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
        {TOKEN0.symbol} / {TOKEN1.symbol} <span className="text-foreground/40">{title}</span>
      </h1>
    </div>
  );
}
