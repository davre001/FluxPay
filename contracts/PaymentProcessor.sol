// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO: implement payment processor contract

contract PaymentProcessor {
    address public owner;

    event PaymentProcessed(address indexed payer, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function processPayment(uint256 amount) public payable {
        require(msg.value == amount, "Incorrect payment amount");
        emit PaymentProcessed(msg.sender, amount);
    }
}
