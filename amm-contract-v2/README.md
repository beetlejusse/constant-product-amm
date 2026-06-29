# Constant Product AMM (Uniswap V2 style)

A from-scratch implementation of a Uniswap V2 style **constant product Automated Market Maker** (`x * y = k`), built with [Foundry](https://book.getfoundry.sh/). The repo also contains a custom LP token, an ERC-4626 "auto-zapping" yield vault on top of the pool, mock tokens, deploy scripts, and tests.

This is a learning project for understanding how a DEX works from the ground up.

## Why Uniswap V2?

- Every token pair (e.g. `WETH/USDC`) is held by its own freshly deployed pool contract.
- When you swap, tokens are physically transferred in and out of the contract immediately.
- The `0.3%` fee and the `x * y = k` curve are hardcoded.
- Only ERC-20 tokens are supported, so native ETH must be wrapped into WETH to trade.

If your goal is to understand how DeFi works from the ground up, the V2 architecture is the place to start.

## Contracts

| Contract | File | Purpose |
| --- | --- | --- |
| `ConstantProductAMM` | [src/AMM.sol](src/AMM.sol) | Core `x * y = k` pool: add/remove liquidity and swap with a 0.3% fee. |
| `LPToken` | [src/LPtoken.sol](src/LPtoken.sol) | Minimal, custom LP share token. Mint/burn restricted to the AMM that deployed it. |
| `AMMVault` | [src/Vault.sol](src/Vault.sol) | ERC-4626 vault that takes a single asset (USDC), auto-zaps it into the pool, and holds LP tokens on the depositor's behalf. |
| `MockERC20` | [src/MockERC20.sol](src/MockERC20.sol) | Test ERC-20 with configurable decimals and a public `mint`. |

### `ConstantProductAMM`

The pool holds two tokens (`token0`, `token1`) and deploys its own `LPToken` in the constructor. Reserves are tracked internally and resynced from real balances after every state change via `updateReserves()`.

| Function | Description |
| --- | --- |
| `addLiquidityToPool(uint256 amount0, uint256 amount1) → shares` | Pulls both tokens in. The **first** deposit mints `sqrt(amount0 * amount1)` shares; later deposits must roughly match the current reserve ratio and mint the proportional minimum of the two sides. |
| `removeLiquidityfromPool(uint256 shares) → (amount0, amount1)` | Burns LP shares and returns a proportional slice of both reserves. |
| `swap(address tokenIn, uint256 amountIn) → amountOut` | Swaps along the constant-product curve after taking a 0.3% fee. |
| `getSwapEstimate(address tokenIn, uint256 amountIn) → amountOut` | `view` quote for a swap (same math as `swap`, no state change). |
| `getpoolState() → (...)` | Returns token addresses, reserves, ratio, total LP supply, and per-token exchange rates (scaled by `1e18`). |
| `getLPTokenAddress() → address` | Address of the pool's `LPToken`. |

All external mutating functions are protected with OpenZeppelin's `ReentrancyGuard` and emit events (`LiquidityAdded`, `LiquidityRemoved`, `ReserveUpdated`, `Swapped`).

**The math**

- Initial LP shares: `shares = sqrt(reserve0 * reserve1)` (Babylonian square root, implemented in `sqrt`).
- Later LP shares: `min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1)`.
- Swap output (0.3% fee): `amountInWithFee = amountIn * 997 / 1000`, then `amountOut = amountInWithFee * reserveOut / (reserveIn + amountInWithFee)`.

### `LPToken`

A deliberately minimal share token (not OpenZeppelin's ERC-20). `mint` and `burn` are gated by the `onlyAMMcanCall` modifier so only the deploying AMM can change supply. Note the **non-standard** transfer/approve method names:

- `approveAmount(spender, amount)`
- `transferToReceiver(receiver, amount)`
- `transferFundFrom(from, to, amount)` (treats `type(uint256).max` allowance as infinite)

Metadata: name `WETH-USDC TAC-LP`, symbol `TAC-LP`, 18 decimals.

### `AMMVault` (ERC-4626)

A single-asset vault whose base `asset` is `token1` (USDC). The idea: a user deposits USDC and the vault transparently manages an LP position for them.

- **Deposit:** pulls USDC, swaps the correct fraction to `token0` (WETH), adds liquidity, and mints vault shares (`vUSDC`).
- **Withdraw / redeem:** burns LP proportionally, swaps the WETH leg back to USDC, and returns USDC to the user.
- `totalAssets()` values the vault's LP balance entirely in USDC using the live pool exchange rate.
- Swaps use `slippageBps = 100` (1%) slippage protection and `SafeERC20` for transfers.

## Project layout

```
amm-contract-v2/
├── src/
│   ├── AMM.sol            # ConstantProductAMM
│   ├── LPtoken.sol        # LPToken
│   ├── Vault.sol          # AMMVault (ERC-4626)
│   └── MockERC20.sol      # Mock token for tests/local
├── script/
│   ├── Deploy.s.sol       # DeployConstantProductAMM
│   └── HelperConfig.s.sol # Per-network token config + Anvil mocks
├── test/
│   └── AMM.t.sol          # AMMTest (add/remove liquidity, swap)
├── foundry.toml
└── remappings.txt
```

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `anvil`, `cast`)
- Git (dependencies are pulled in as submodules)

Dependencies (`lib/`):

- `forge-std`
- `openzeppelin-contracts`

## Setup

```bash
git submodule update --init --recursive   # if cloned without --recursive
forge build
```

## Test

```bash
forge test          # run the suite
forge test -vvv     # verbose, with console logs
forge test --gas-report
```

## Format

```bash
forge fmt           # apply formatting
forge fmt --check   # CI-style check
```

## Load .env

```bash
set -a; source <(sed 's/\r$//' .env); set +a
```

## Verify env
```bash
cast wallet address --private-key "$PRIVATE_KEY"
```

## Deploy

Deployment is driven by [script/Deploy.s.sol](script/Deploy.s.sol), which reads the token pair for the current chain from [script/HelperConfig.s.sol](script/HelperConfig.s.sol).

| Network | Chain ID | token0 / token1 |
| --- | --- | --- |
| Base Sepolia | 84532 | WETH / USDC (real testnet addresses) |
| Local Anvil | 31337 | Freshly deployed `MockERC20` WETH & USDC |

```bash
# Local: start a node, then deploy against it
anvil
forge script script/Deploy.s.sol:DeployConstantProductAMM --rpc-url http://localhost:8545 --broadcast --private-key <key>

# Base Sepolia
forge script script/Deploy.s.sol:DeployConstantProductAMM --rpc-url "$ETH_RPC_URL" --broadcast --verify --etherscan-api-key "$ETHERSCAN_API_KEY"

```