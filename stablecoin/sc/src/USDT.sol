// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDT is ERC20, Ownable {
    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("Tether USD", "USDT") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 4;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}
