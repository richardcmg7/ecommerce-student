export const ECOMMERCE_ABI = [
  "function registerCompany(string name, string taxId) external",
  "function getMyCompany() external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))",
  "function addProduct(string name, string description, uint256 price, uint256 stock, string ipfsImageHash) external",
  "function getMyProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])"
];
