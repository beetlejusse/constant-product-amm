//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LPtoken.sol";

contract ConstantProductAMM is ReentrancyGuard {
    event LiquidityAdded(address indexed sender, uint256 sharesMinted);
    event LiquidityRemoved(address indexed sender, uint256 sharesBurned);
    event ReserveUpdated(uint256 reserve0, uint256 reserve1);
    event Swapped(address indexed user, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    IERC20 private immutable token0;
    IERC20 private immutable token1;
    LPToken public immutable poolToken;

    uint256 private reserve0;
    uint256 private reserve1;

    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        poolToken = new LPToken();
    }

    function addLiquidityToPool(uint256 _reserveAdded0, uint256 _reserveAdded1)
        external
        nonReentrant
        returns (uint256 shares)
    {
        require(_reserveAdded0 > 0 && _reserveAdded1 > 0, "Invalid liquidity added");

        token0.transferFrom(msg.sender, address(this), _reserveAdded0);
        token1.transferFrom(msg.sender, address(this), _reserveAdded1);

        if (poolToken.totalSupply() == 0) {
            shares = sqrt(_reserveAdded0 * _reserveAdded1);
        } else {
            //enforcing a 1% check here
            uint256 left = reserve0 * _reserveAdded1;
            uint256 right = reserve1 * _reserveAdded0;
            uint256 diff = left > right ? left - right : right - left;
            require(diff * 1000 <= left * 100, "Invalid Ratio of Token--1% tolerence");

            shares = min(
                (_reserveAdded0 * poolToken.totalSupply()) / reserve0,
                (_reserveAdded1 * poolToken.totalSupply()) / reserve1
            );
        }

        require(shares > 0, "Invalid Shares!!!!!");
        poolToken.mint(msg.sender, shares);
        updateReserves();

        emit LiquidityAdded(msg.sender, shares);
        return shares;
    }

    function removeLiquidityfromPool(uint256 _shares)
        external
        nonReentrant
        returns (uint256 reserveAmountRemoved0, uint256 reserveAmountRemoved1)
    {
        require(_shares > 0, "Error: Invalid Shares");
        require(poolToken.balanceOf(msg.sender) >= _shares, "Insufficient Shares");

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        //calculating propotional reserves to return
        reserveAmountRemoved0 = (_shares * balance0) / poolToken.totalSupply();
        reserveAmountRemoved1 = (_shares * balance1) / poolToken.totalSupply();

        require(reserveAmountRemoved0 > 0 && reserveAmountRemoved1 > 0, "Invalid Reserves");

        //burn the LP shares and return tokens
        poolToken.burn(msg.sender, _shares);
        token0.transfer(msg.sender, reserveAmountRemoved0);
        token1.transfer(msg.sender, reserveAmountRemoved1);

        updateReserves();
        emit LiquidityRemoved(msg.sender, _shares);
        return (reserveAmountRemoved0, reserveAmountRemoved1);
    }

    function swap(address _tokenIn, uint256 _amountIn) external nonReentrant returns (uint256 amountOut) {
        require(_tokenIn == address(token0) || _tokenIn == address(token1), "Invalid Token Address");
        require(_amountIn > 0, "Invalid Amount");

        bool isToken0 = (_tokenIn == address(token0));
        (IERC20 tokenIn, IERC20 tokenOut, uint256 reserveIn, uint256 reserveOut) =
            isToken0 ? (token0, token1, reserve0, reserve1) : (token1, token0, reserve1, reserve0);

        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        // calculating amountOut with 0.3% fee for slippage
        uint256 amountInWithFee = (_amountIn * 997) / 1000;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

        require(amountOut > 0, "Invalid Amount");
        tokenOut.transfer(msg.sender, amountOut);

        updateReserves();

        emit Swapped(msg.sender, _tokenIn, _amountIn, isToken0 ? address(token1) : address(token0), amountOut);
        return amountOut;
    }

    function sqrt(uint256 x) internal pure returns (uint256 z) {
        if (x == 0) {
            return 0;
        } else if (x == 1) {
            return 1;
        } else {
            z = x;
            uint256 y = (x / 2) + 1;
            while (y < z) {
                z = y;
                y = ((x / y) + y) / 2;
            }
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function updateReserves() internal {
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
        emit ReserveUpdated(reserve0, reserve1);
    }

    // vault getter functions
    function getSwapEstimate(address _tokenIn, uint256 _amountIn) external view returns (uint256 amountOut) {
        require(_tokenIn == address(token0) || _tokenIn == address(token1), "Invalid Token Address");
        require(_amountIn > 0, "Invalid Amount");

        bool isToken0 = (_tokenIn == address(token0));
        (uint256 reserveIn, uint256 reserveOut) = isToken0 ? (reserve0, reserve1) : (reserve1, reserve0);

        uint256 amountInWithFee = (_amountIn * 997) / 1000;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

        return amountOut;
    }

    // The Vault will call this massive state function to figure out how to balance deposits
    function getpoolState()
        external
        view
        returns (
            address token0address,
            address token1address,
            uint256 reserve_0,
            uint256 reserve_1,
            uint256 ratio,
            uint256 totalLPSupply,
            uint256 token0ExchangeRate,
            uint256 token1ExchangeRate
        )
    {
        token0address = address(token0);
        token1address = address(token1);
        reserve_0 = reserve0;
        reserve_1 = reserve1;
        ratio = reserve0 / reserve1;
        totalLPSupply = poolToken.totalSupply();

        if (reserve_0 > 0 && reserve_1 > 0) {
            ratio = (reserve_1 * 1e18) / reserve_0;
            token0ExchangeRate = (reserve_1 * 1e18) / reserve_0; //price of token 0 in token 1
            token1ExchangeRate = (reserve_0 * 1e18) / reserve_1; //price of token 1 in token 0
        }

        return (
            token0address,
            token1address,
            reserve_0,
            reserve_1,
            ratio,
            totalLPSupply,
            token0ExchangeRate,
            token1ExchangeRate
        );
    }

    function getLPTokenAddress() external view returns (address) {
        return address(poolToken);
    }
}
