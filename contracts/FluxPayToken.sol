// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: implement payment token contract

contract FluxPayToken {
    string public name = "FluxPay Token";
    string public symbol = "FPT";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
