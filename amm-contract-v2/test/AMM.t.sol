//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "../src/AMM.sol";
import "../src/MockERC20.sol";
import "../script/HelperConfig.s.sol";
import "../src/LPtoken.sol";

contract AMMTest is Test {
    ConstantProductAMM amm;
    MockERC20 mockWETH;
    MockERC20 mockUSDC;
    LPToken mockPoolToken;

    address testUser = makeAddr("testUser");

    function setUp() public {
        HelperConfig helperConfig = new HelperConfig();
        HelperConfig.NetworkConfig memory config = helperConfig.getOrCreateAnvilConfig();

        mockWETH = MockERC20(config.token0);
        mockUSDC = MockERC20(config.token1);

        amm = new ConstantProductAMM(config.token0, config.token1);
        mockPoolToken = amm.poolToken();

        mockWETH.mint(testUser, 10000 * 10**18);
        mockUSDC.mint(testUser, 10000 * 10 ** 6);
    }

    function addLiquidity()
        public
        returns (uint256 shares, uint256 amount0, uint256 amount1)
    {
        amount0 = 10 * 1e18;
        amount1 = 10 * 10 ** 6;

        vm.startPrank(testUser);
        mockWETH.approve(address(amm), amount0);
        mockUSDC.approve(address(amm), amount1);

        shares = amm.addLiquidityToPool(amount0, amount1);

        vm.stopPrank();

    }

    function testAddLiquiditySuccess() public {
        (uint256 shares, , ) = addLiquidity();

        assertGt(shares, 0);
    }

    function testAddLiquidityZeroAmounts() public {
        vm.expectRevert("Invalid liquidity added");
        amm.addLiquidityToPool(0, 1000);

        vm.expectRevert("Invalid liquidity added");
        amm.addLiquidityToPool(1000, 0);
    }

    function testRemoveLiquiditySuccess() public {
        (
            uint256 shares,
            uint256 amount0Added,
            uint256 amount1Added
        ) = addLiquidity();

        vm.startPrank(testUser);
        (uint256 amount0Removed, uint256 amount1Removed) = amm.removeLiquidityfromPool(shares);
        vm.stopPrank();

        assertEq(amount0Added, amount0Removed);
        assertEq(amount1Added, amount1Removed);
    }

    function testSwapSuccess() public {
        addLiquidity();

        //SETTING UP SWAP IN HERE, USER IS SWAPPING 10USDC
        uint256 swapAmount = 10 * 10**18;
        uint256 testuserUSDCbefore = mockUSDC.balanceOf(testUser);

        vm.startPrank(testUser);
        mockWETH.approve(address(amm), swapAmount);

        uint256 amountOut = amm.swap(address(mockWETH), swapAmount);
        vm.stopPrank();

        uint256 userUSDCafterSwap = mockUSDC.balanceOf(testUser);

        assertGt(amountOut, 0, "Amount out should be greater than 0");
        assertEq(userUSDCafterSwap, testuserUSDCbefore + amountOut, "User USDC balance should increase");

        console.log("WETH Swapped:", swapAmount / 10**18);
        console.log("USDC Received (after 0.3% fee and slippage):", amountOut / 10**6);
    }
}
