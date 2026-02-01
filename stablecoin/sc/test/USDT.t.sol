// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {USDT} from "../src/USDT.sol";

contract USDTTest is Test {
    USDT token;
    address owner = address(this);
    address bob = address(0xB0B);

    function setUp() public {
        token = new USDT();
    }

    function testDecimalsIsFour() public {
        assertEq(token.decimals(), 4);
    }

    function testOwnerCanMint() public {
        token.mint(bob, 5555);
        assertEq(token.balanceOf(bob), 5555);
    }

    function testNonOwnerCannotMint() public {
        vm.prank(bob);
        vm.expectRevert();
        token.mint(bob, 1);
    }
}
