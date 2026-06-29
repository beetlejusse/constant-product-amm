import Link from "next/link";

export function Brand({
  href = "/",
  className = "text-xl text-foreground",
  tmClassName = "text-[10px] text-muted-foreground",
}: {
  href?: string;
  className?: string;
  tmClassName?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className={`font-display tracking-tight ${className}`}>Constant</span>
      <span className={`mt-1 font-mono ${tmClassName}`}>TM</span>
    </Link>
  );
}
