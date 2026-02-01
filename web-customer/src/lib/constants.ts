export const ECOMMERCE_ABI = [
  "function getAllProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])",
  "function addToCart(uint256 productId, uint256 quantity) external",
  "function checkout(uint256 companyId) external returns (uint256)"
];
