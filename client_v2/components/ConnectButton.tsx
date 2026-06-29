"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { HugeiconsIcon } from "@hugeicons/react";
import { Wallet02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "./ui/primitives";
import { shortAddr } from "@/lib/format";
import { CHAIN_ID, chain } from "@/lib/contracts";

export function ConnectButton({ size = "sm" }: { size?: "sm" | "md" }) {
  const { open } = useAppKit();
  const { address, isConnected, chainId } = useAccount();

  if (!isConnected) {
    return (
      <Button size={size} onClick={() => open()}>
        <HugeiconsIcon icon={Wallet02Icon} size={16} strokeWidth={2} />
        Connect
      </Button>
    );
  }

  if (chainId !== CHAIN_ID) {
    return (
      <Button size={size} variant="brand" onClick={() => open({ view: "Networks" })}>
        <HugeiconsIcon icon={InformationCircleIcon} size={16} strokeWidth={2} />
        Wrong network
      </Button>
    );
  }

  return (
    <Button size={size} variant="outline" onClick={() => open({ view: "Account" })}>
      <span className="size-2 rounded-full bg-success" />
      {shortAddr(address)}
    </Button>
  );
}
