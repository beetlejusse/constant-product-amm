export const ammAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_token0", type: "address", internalType: "address" },
      { name: "_token1", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addLiquidityToPool",
    inputs: [
      { name: "_reserveAdded0", type: "uint256", internalType: "uint256" },
      { name: "_reserveAdded1", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getLPTokenAddress",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSwapEstimate",
    inputs: [
      { name: "_tokenIn", type: "address", internalType: "address" },
      { name: "_amountIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getpoolState",
    inputs: [],
    outputs: [
      { name: "token0address", type: "address", internalType: "address" },
      { name: "token1address", type: "address", internalType: "address" },
      { name: "reserve_0", type: "uint256", internalType: "uint256" },
      { name: "reserve_1", type: "uint256", internalType: "uint256" },
      { name: "ratio", type: "uint256", internalType: "uint256" },
      { name: "totalLPSupply", type: "uint256", internalType: "uint256" },
      { name: "token0ExchangeRate", type: "uint256", internalType: "uint256" },
      { name: "token1ExchangeRate", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolToken",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract LPToken" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "removeLiquidityfromPool",
    inputs: [{ name: "_shares", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "reserveAmountRemoved0", type: "uint256", internalType: "uint256" },
      { name: "reserveAmountRemoved1", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "swap",
    inputs: [
      { name: "_tokenIn", type: "address", internalType: "address" },
      { name: "_amountIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "LiquidityAdded",
    inputs: [
      { name: "sender", type: "address", indexed: true, internalType: "address" },
      { name: "sharesMinted", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LiquidityRemoved",
    inputs: [
      { name: "sender", type: "address", indexed: true, internalType: "address" },
      { name: "sharesBurned", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "ReserveUpdated",
    inputs: [
      { name: "reserve0", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "reserve1", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Swapped",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "tokenIn", type: "address", indexed: false, internalType: "address" },
      { name: "amountIn", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "tokenOut", type: "address", indexed: false, internalType: "address" },
      { name: "amountOut", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
] as const;

export const wethAbi = [
  {
    type: "function",
    name: "deposit",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "wad", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;
