//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

contract LPToken {
    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);

    string public name = "WETH-USDC TAC-LP";
    string public symbol = "TAC-LP"; 
    uint8 public decimals = 18;

    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public balanceOf;

    uint256 private _totalSupply;
    address private immutable ammDeployer;

    constructor() {
        ammDeployer = msg.sender;
    }

    modifier onlyAMMcanCall() {
        require(msg.sender == ammDeployer, "Unauthorised!! Only AMM can call this function");
        _;
    }

    function approveAmount(address spender, uint256 amount) public returns(bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function totalSupply () public view returns(uint256) {
        return _totalSupply;
    }

    function transferFundFrom(address from, address to, uint256 amount) public returns(bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        if(from != msg.sender && allowance[from][msg.sender] != type(uint256).max) {
            require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
            allowance[from][msg.sender] -= amount;
        }

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
        return true;
    }

    function transferToReceiver(address receiver, uint256 amount) public returns(bool) {
        return transferFundFrom(msg.sender, receiver, amount);
    }

    function mint(address to, uint256 amount) external onlyAMMcanCall {
        balanceOf[to] += amount;
        _totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyAMMcanCall {
        require(balanceOf[from] >= amount, "Insufficient funds!!!!!");
        balanceOf[from] -= amount;
        _totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
}