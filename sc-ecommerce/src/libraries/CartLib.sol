// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ProductLib.sol";

struct CartItem {
    uint256 productId;
    uint256 quantity;
}

library CartLib {
    struct CartStorage {
        // Customer Address => List of items
        mapping(address => CartItem[]) carts;
    }

    function addToCart(
        CartStorage storage self, 
        address customer, 
        uint256 productId, 
        uint256 quantity
    ) internal {
        // Verificar si ya existe para actualizar cantidad
        CartItem[] storage cart = self.carts[customer];
        bool found = false;
        
        for(uint i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                cart[i].quantity += quantity;
                found = true;
                break;
            }
        }
        
        if (!found) {
            cart.push(CartItem(productId, quantity));
        }
    }

    function getCart(CartStorage storage self, address customer) internal view returns (CartItem[] memory) {
        return self.carts[customer];
    }

    function clearCart(CartStorage storage self, address customer) internal {
        delete self.carts[customer];
    }
}
