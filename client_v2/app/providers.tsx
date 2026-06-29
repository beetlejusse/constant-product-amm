"use client";

import { type ReactNode, useState } from "react";
import { WagmiProvider, cookieToInitialState, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";
import { wagmiAdapter, projectId, networks } from "@/lib/wagmi";
import { ToastProvider } from "@/components/ui/Toast";

const metadata = {
  name: "Constant AMM",
  description: "WETH/USDC constant-product (x·y=k) AMM on Base Sepolia",
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: baseSepolia,
  metadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#22d3ee",
    "--w3m-font-family": "var(--font-geist-sans)",
    "--w3m-border-radius-master": "2px",
  },
  features: { analytics: false },
});

export function Providers({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
