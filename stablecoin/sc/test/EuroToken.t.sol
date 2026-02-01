// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken token;
    address owner = address(this);
    address alice = address(0xA11CE);

    function setUp() public {
        token = new EuroToken();
    }

    function testDecimalsIsSix() public {
        assertEq(token.decimals(), 6);
    }

    function testOwnerCanMint() public {
        token.mint(alice, 123);
        assertEq(token.balanceOf(alice), 123);
    }

    function testNonOwnerCannotMint() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 1);
    }
}
