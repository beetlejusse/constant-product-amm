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
    function withdraw(uint256 assets, address receiver, address owner) public override nonReentrant returns(uint256 shares) {
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

        //checking weather slippage is within the acceptable range
        require(token0Out >= minToken0Out, "Slippage too high");

        uint256 token1Remaining = usdcAmount - usdcToSwap;
        shares = amm.addLiquidity(token0Out, token1Remaining);

        return shares;
    }

    //remove lp token, gets weth and usdc both and then swap weth back to usdc
    function removeLiquidityFromAMM(uint256 assets, address receiver) internal {
        (, , uint256 currReserve0, uint256 currReserve1, , , , ) = amm.getPoolState();
        require(currReserve0 > 0 && currReserve1 > 0, "Pool is unbalanced or drained, cannot remove liquidity proportionally.");

        uint256 totalAssetStored = totalAssets();
        uint256 lpBalance = lpToken.balanceOf(address(this));
        require(totalAssetStored > 0 && lpBalance > 0, "Vault is empty or has no LP tokens");

        // calculate how many LP tokens to remove based on the assets requested and the total assets in the vault
        // totalAssetsStored - 1 for round up, else it will round down use to integer division and give less assets than requested
        uint256 lpTokenBurn = (assets * lpBalance + (totalAssetStored - 1)) / totalAssetStored;
        
        //remove liquidity from the AMM, returns the amount of WETH and USDC removed
        (uint256 amount0, uint256 amount1) = amm.removeLiquidity(lpTokenBurn);
        if(amount0 > 0) {
            //get the min expected amount of USDC to be swapped for WETH with 1% slippage
            uint256 minToken1Out = (amm.getSwapEstimate(address(this), amount0) * (1000 - slippageBps)) / 10000;

            //swap weth for usdc
            uint256 token1Out = amm.swap(address(token0), amount0);

            //checking weather slippage is within the acceptable range
            require(token1Out >= minToken1Out, "Slippage too high");

            //add the swapped USDC to the amount of USDC removed from the AMM
            amount1 += token1Out;
        }

        // enforce ERC-4626 exactness: transfer exactly `assets` or revert
        require(amount1 >= assets, "Vault: Insufficient out");

        token1.safeTransfer(receiver, assets);

        // any surplus (amt1 - assets) remains in the vault and accrues to remaining depositors
    }

    //---------- ADDITIONAL FUNCTIONS FOR BETTER ERC4626 COMPLIANCE ----------

    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant returns (uint256 assets) {
        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }
        
        assets = previewRedeem(shares);
        _burn(owner, shares);
        removeLiquidityFromAMM(assets, receiver);(assets, receiver);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
        return assets;
    }

    function mint(uint256 shares, address receiver) public override nonReentrant returns (uint256 assets) {
        assets = previewMint(shares);
        
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
        addLiquidityToAMM(assets);
        _mint(receiver, shares);
        
        emit Deposit(msg.sender, receiver, assets, shares);
        return assets;
    }

    //---------- GETTERS (helpers) ----------

    function getAMM() external view returns (address) {
        return address(amm);
    }

    function getLPTokenBalance() external view returns(uint256){
        return lpToken.balanceOf(address(this));
    }

    function getTotalShares() external view returns(uint256){
       return totalSupply();// from the ERC20 vUSDC contract
    }

    function getUserShares(address user) external view returns (uint256) {
        return balanceOf(user);
    }

    function getUserAssetBalance(address user) external view returns (uint256) {
        return convertToAssets(balanceOf(user)); //convertToAssets is from ERC4626 and returns the amount of assets (USDC) for a given amount of shares
    }

    function getTotalAssetsManaged() external view returns (uint256) {
        return totalAssets();
    }

    // Current exchange rate: how many assets per 1 vUSDC share
    function getPricePerShare() external view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? 0 : (totalAssets() * 1e18) / supply;
    }

    function getLPToken() external view returns (address) {
        return address(lpToken);
    }

    function getToken0() external view returns (address) {
        return address(token0);
    }

    function getToken1() external view returns (address) {
        return address(token1);
    }

    function getSlippageBps() external view returns (uint256) {
        return slippageBps;
    }
}