export const ECOMMERCE_ABI = [
  "function registerCompany(string name, string taxId) external",
  "function getMyCompany() external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))",
  "function addProduct(string name, string description, uint256 price, uint256 stock, string ipfsImageHash) external",
  "function getMyProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])",
  "function getAllProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])",
  "function addToCart(uint256 productId, uint256 quantity) external",
    "function checkout(uint256 companyId) external returns (uint256)",
    "function processPayment(uint256 invoiceId, string tokenType) external",
    "event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 total)"
  ];
  