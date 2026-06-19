//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAMM{
    function getPoolState() external view returns (
        address token0address,
        address token1address,
        uint256 reserve_0,
        uint256 reserve_1,
        uint256 ratio,
        uint256 totalLPSupply,
        uint256 token0ExchangeRate,
        uint256 token1ExchangeRate
    );
    function addLiquidity(uint256 _reserveAdded0, uint256 _reserveAdded1) external returns (uint256 shares);
    function removeLiquidity(uint256 _shares) external returns (uint256 reserveRemoved0, uint256 reserveRemoved1);
    function getSwapEstimate(address _tokenIn, uint256 _amountIn) external view returns (uint256 amountOut);
    function swap(address _tokenIn, uint256 _amountIn) external returns(uint256 amountOut);
    function getLPTokenAddress() external view returns (address);
}

contract AMMVault is ERC4626, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IAMM public immutable amm; 
    IERC20 public immutable lpToken; 
    IERC20 public immutable token0;
    IERC20 public immutable token1; 

    uint256 public slippageBps = 100; //1%, Slippage protection for when the vault swaps tokens automatically 

    //settingup vault to accept usdc as its base asset
    constructor(address _amm) ERC4626(IERC20(_getAMMtoken1address(_amm))) ERC20("AMM vault USDC shares: ", "vUSDC") {
        amm = IAMM(_amm);
        (address t0_address, address t1_address, , , , , , ) = amm.getPoolState();
        token0 = IERC20(t0_address);
        token1 = IERC20(t1_address);
        lpToken = IERC20(amm.getLPTokenAddress());

        token0.forceApprove(_amm, type(uint256).max);
        token1.forceApprove(_amm, type(uint256).max);
        lpToken.forceApprove(_amm, type(uint256).max);
    }

    //override the totalAssets function to return the value of the assets in the vault(total usdc the vault is managing)
    function totalAssets() public view override returns(uint256) {
        uint256 lpBalance = lpToken.balanceOf(address(this));
        if(lpBalance == 0) return 0;

        (, , uint256 currReserve0, uint256 currReserve1, , uint256 currtotalLPSupply, uint256 currToken0ExchangeRate, ) = amm.getPoolState();

        if(currtotalLPSupply == 0 || currReserve0 == 0 || currReserve1 == 0) return 0;

        // Calculate the vault's proportional share of each reserve
        // lpBalance / currTotalLPSupply gives the vault's share of the total pool
        uint256 token0Value = (lpBalance * currReserve0) / currtotalLPSupply;
        uint256 token1Value = (lpBalance * currReserve1) / currtotalLPSupply;

        uint256 token0ValueInToken1 = (token0Value * currToken0ExchangeRate) / 10**18;

        return token0ValueInToken1 + token1Value;
    }

    //override the previewDeposit function to return the amount of shares the user will receive for depositing a certain amount of usdc
    function deposit(uint256 assets, address receiver) public override nonReentrant returns(uint256 shares) {
        require(assets > 0, "Deposit amount must be greater than 0");

        shares = previewWithdraw(assets);  // Calculate shares before transferring assets and adding liquidity to get correct pricing
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);

        addLiquidityToAMM(assets);  //turn USDC into LP token
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
        return shares;
    }

    //function by which user withdraws USDC
    function withdraw(uint256 assets, uint256 receiver, uint256 owner) public override nonReentrant returns(uint256 shares) {
        shares = previewWithdraw(assets);  //amount of shares getting burned to get amountOUT
        
        if(msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }
        _burn(owner, shares);

        //turning lp token back to USDC
        removeLiquidityFromAMM(assets, receiver);

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        return shares;
    }

    // helper function to get the token1 address from the AMM contract(ZAPPING)
    function _getAMMtoken1address(address _amm) internal view returns (address) {
        (, address token_1, , , , , , ) = IAMM(_amm).getPoolState();
        return token_1;
    }

    //function which takes USDC swap half of it WETH and adds liquidity
    function addLiquidityToAMM(uint256 usdcAmount) internal returns(uint256 shares){
        (, , uint256 currReserve0, uint256 currReserve1, , , , ) = amm.getPoolState();
        require(currReserve0 > 0 && currReserve1 > 0, "Pool is unbalanced or drained, cannot add liquidity proportionally.");

        //amount of usdc to be swapped to weth so than it can be added to liquidity pool
        uint256 usdcToSwap = (usdcAmount * currReserve0) / (currReserve0 + currReserve1);

        //gets a min expected amount with 1% slippage
        uint256 minToken0Out = amm.getSwapEstimate(address(token1), usdcToSwap) * (10000 - slippageBps) / 10000;
        
        //swap USDC for WETH
        uint256 token0Out = amm.swap(address(token1), usdcToSwap);
        
    }

    //remove lp token, gets weth and usdc both and then swap weth back to usdc
    function removeLiquidityFromAMM() {}
}