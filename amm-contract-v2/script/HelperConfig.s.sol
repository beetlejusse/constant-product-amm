//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

abstract contract ConstantValues {
    uint256 public constant BASE_SEPOLIA_CHAIN_ID = 84532;
    uint256 public constant BASE_MAINNET_CHAIN_ID = 8453;
    uint256 public constant LOCAL_CHAIN_ID = 31337; // Local Foundry Anvil chain

    address public constant USDC_BASE_SEPOLIA_ADDRESS = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address public constant WETH_BASE_SEPOLIA_ADDRESS = 0x4200000000000000000000000000000000000006;
}

contract HelperConfig is Script, ConstantValues {
    error HelperConfig_InvalidChainId();

    struct NetworkConfig {
        address token0;
        address token1;
    }

    mapping(uint256 chainId => NetworkConfig) public networkConfigs;
    NetworkConfig public localNetworkConfig;

    constructor() {
        // Pre-loading the Base Sepolia config when the script starts
        networkConfigs[BASE_SEPOLIA_CHAIN_ID] = getBaseSepoliaConfig();
    }

    function getBaseSepoliaConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({token0: WETH_BASE_SEPOLIA_ADDRESS, token1: USDC_BASE_SEPOLIA_ADDRESS});
    }

    function getOrCreateAnvilConfig() public returns (NetworkConfig memory) {
        // If we already created the mocks, just return them so we don't waste gas deploying twice
        if (localNetworkConfig.token0 != address(0) && localNetworkConfig.token1 != address(0)) {
            return localNetworkConfig;
        }

        vm.startBroadcast();
        MockERC20 mockWETH = new MockERC20("Mock Wrapped Ether", "WETH", 18, 1000 * 10 ** 18);
        MockERC20 mockUSDC = new MockERC20("Mock USDC", "USDC", 6, 1000000 * 10 ** 6);
        vm.stopBroadcast();

        localNetworkConfig = NetworkConfig({token0: address(mockWETH), token1: address(mockUSDC)});

        return localNetworkConfig;
    }

    function getNetworkConfigByChainId(uint256 chainId) public returns (NetworkConfig memory) {
        if (networkConfigs[chainId].token0 != address(0) && networkConfigs[chainId].token1 != address(0)) {
            return networkConfigs[chainId];
        } else if (chainId == LOCAL_CHAIN_ID) {
            return getOrCreateAnvilConfig();
        } else {
            revert HelperConfig_InvalidChainId();
        }
    }

    // This is the main function our deploy script will call
    function getConfig() public returns (NetworkConfig memory) {
        return getNetworkConfigByChainId(block.chainid);
    }
}