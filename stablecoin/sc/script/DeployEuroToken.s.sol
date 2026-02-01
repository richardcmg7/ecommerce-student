// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract DeployEuroToken is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        new EuroToken();
        vm.stopBroadcast();
    }
}
