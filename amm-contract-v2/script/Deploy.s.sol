// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Script} from "forge-std/Script.sol";
import "../src/AMM.sol";
import "./HelperConfig.s.sol";

contract DeployConstantProductAMM is Script {

    function run() external returns(ConstantProductAMM, HelperConfig) {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        vm.startBroadcast();

        ConstantProductAMM amm = new ConstantProductAMM(config.token0, config.token1);
        vm.stopBroadcast();

        return (amm, helperConfig);
    }
}