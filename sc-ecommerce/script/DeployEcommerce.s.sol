// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {Ecommerce} from "../src/Ecommerce.sol";

contract DeployEcommerce is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address eurt = vm.envAddress("EUROTOKEN_ADDRESS");
        address usdt = vm.envAddress("USDT_ADDRESS");

        vm.startBroadcast(pk);
        new Ecommerce(eurt, usdt);
        vm.stopBroadcast();
    }
}
