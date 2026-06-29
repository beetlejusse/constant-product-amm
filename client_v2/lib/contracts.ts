import { baseSepolia } from "@reown/appkit/networks";
import type { Address } from "viem";
import { ammAbi, erc20Abi } from "./abi";

export { ammAbi, erc20Abi };

export const chain = baseSepolia;
export const CHAIN_ID = baseSepolia.id;

export const AMM_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as Address;
export const isAmmConfigured = AMM_ADDRESS.length === 42;

export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as Address;
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address;

export type TokenKey = "WETH" | "USDC";

export interface TokenInfo {
  key: TokenKey;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
}

export const TOKENS: Record<TokenKey, TokenInfo> = {
  WETH: { key: "WETH", address: WETH_ADDRESS, symbol: "WETH", name: "Wrapped Ether", decimals: 18, icon: "/eth.webp" },
  USDC: { key: "USDC", address: USDC_ADDRESS, symbol: "USDC", name: "USD Coin", decimals: 6, icon: "/usdc.svg" },
};

export const TOKEN0 = TOKENS.WETH;
export const TOKEN1 = TOKENS.USDC;

export const SWAP_FEE_BPS = 30;

const EXPLORER = chain.blockExplorers?.default.url ?? "https://sepolia.basescan.org";
export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${EXPLORER}/address/${addr}`;

export function tokenByAddress(address?: string): TokenInfo | undefined {
  if (!address) return undefined;
  const a = address.toLowerCase();
  return Object.values(TOKENS).find((t) => t.address.toLowerCase() === a);
}
