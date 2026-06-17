# constant-product-amm
This repository consists of 2 methods of creating or understanding a Automated Market Maker

1. using Uniswap v2
2. using Uniswap v4

frontend is being operated by the v4 contract but you can also interact with v2 contract using the foundry scripts

## how to run the frontend
```bash
npm install
npm run dev
```

## how to run the contracts

1. for Uniswap v2
```bash
cd amm-contract-v2
forge script script/AMM.s.sol:AMMScript --rpc-url <rpc_url> --private-key <private_key>
```

## how to run the tests
```bash
cd amm-contract-v2
forge test
``` 

2. for uniswap v4
```bash
cd amm-contract-v4
forge script script/AMM.s.sol:AMMScript --rpc-url <rpc_url> --private-key <private_key>
```

## how to run the tests
```bash
cd amm-contract-v4
forge test
``` 