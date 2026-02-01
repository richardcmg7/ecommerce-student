// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {USDT} from "../src/USDT.sol";

contract DeployUSDT is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        new USDT();
        vm.stopBroadcast();
    }
}
