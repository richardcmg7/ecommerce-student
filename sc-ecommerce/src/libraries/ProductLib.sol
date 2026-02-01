// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct Product {
    uint256 productId;
    uint256 companyId;
    string name;
    string description;
    uint256 price; // En unidad mínima del token (ej: centavos)
    uint256 stock;
    string ipfsImageHash;
    bool isActive;
}

library ProductLib {
    event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name);
    event ProductUpdated(uint256 indexed productId, uint256 price, uint256 stock);
    event StockReduced(uint256 indexed productId, uint256 newStock);

    struct ProductStorage {
        mapping(uint256 => Product) products;
        uint256 productCount;
        // Mapping companyId => array de productIds
        mapping(uint256 => uint256[]) companyProducts;
    }

    function addProduct(
        ProductStorage storage self,
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) internal returns (uint256) {
        require(companyId > 0, "Invalid company ID");
        require(price > 0, "Price must be greater than 0");

        self.productCount++;
        uint256 newId = self.productCount;

        self.products[newId] = Product({
            productId: newId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            ipfsImageHash: ipfsImageHash,
            isActive: true
        });

        self.companyProducts[companyId].push(newId);

        emit ProductAdded(newId, companyId, name);
        return newId;
    }

    function updateProduct(
        ProductStorage storage self,
        uint256 productId,
        uint256 price,
        uint256 stock
    ) internal {
        require(self.products[productId].isActive, "Product not active");
        
        self.products[productId].price = price;
        self.products[productId].stock = stock;
        
        emit ProductUpdated(productId, price, stock);
    }

    function reduceStock(ProductStorage storage self, uint256 productId, uint256 quantity) internal {
        require(self.products[productId].stock >= quantity, "Insufficient stock");
        self.products[productId].stock -= quantity;
        emit StockReduced(productId, self.products[productId].stock);
    }

    function getProduct(ProductStorage storage self, uint256 productId) internal view returns (Product memory) {
        return self.products[productId];
    }
}
