import { baseSepolia } from "@reown/appkit/networks";
import type { Address } from "viem";
import { ammAbi, erc20Abi, wethAbi } from "./abi";

export { ammAbi, erc20Abi, wethAbi };

export const chain = baseSepolia;
export const CHAIN_ID = baseSepolia.id;

export const AMM_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as Address;
export const isAmmConfigured = AMM_ADDRESS.length === 42;

export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as Address;
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address;

export type TokenKey = "ETH" | "WETH" | "USDC";

export interface TokenInfo {
  key: TokenKey;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
}

export const TOKENS: Record<Exclude<TokenKey, "ETH">, TokenInfo> = {
  WETH: { key: "WETH", address: WETH_ADDRESS, symbol: "WETH", name: "Wrapped Ether", decimals: 18, icon: "/weth.avif" },
  USDC: { key: "USDC", address: USDC_ADDRESS, symbol: "USDC", name: "USD Coin", decimals: 6, icon: "/usdc.svg" },
};

// Native ETH pseudo-token (not an ERC-20; address is only a placeholder)
export const NATIVE_ETH: TokenInfo = {
  key: "ETH",
  address: "0x0000000000000000000000000000000000000000",
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
  icon: "/eth.webp",
};

export const TOKEN0 = TOKENS.WETH;
export const TOKEN1 = TOKENS.USDC;

export const SWAP_FEE_BPS = 30;

export interface PoolInfo {
  address: Address;
  token0: TokenInfo;
  token1: TokenInfo;
}

// Pools listed on /pools. There is no factory contract, so nothing on-chain knows
// which pools exist — this list is curated by hand. After deploying another
// ConstantProductAMM, append an entry here with its address and token pair.
// Only the address and pair live here; reserves, price, TVL, LP supply and your
// share are all read live from chain in usePools().
export const POOLS: PoolInfo[] = [
  ...(isAmmConfigured ? [{ address: AMM_ADDRESS, token0: TOKENS.WETH, token1: TOKENS.USDC }] : []),
];

const EXPLORER = chain.blockExplorers?.default.url ?? "https://sepolia.basescan.org";
export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${EXPLORER}/address/${addr}`;

export function tokenByAddress(address?: string): TokenInfo | undefined {
  if (!address) return undefined;
  const a = address.toLowerCase();
  return Object.values(TOKENS).find((t) => t.address.toLowerCase() === a);
}
