export const ECOMMERCE_ABI = [
  "function registerCompany(string name, string taxId) external",
  "function getMyCompany() external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))",
  "function getCompany(uint256 companyId) external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))",
  "function addProduct(string name, string description, uint256 price, uint256 stock, string ipfsImageHash) external",
  "function getMyProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])",
  "function getAllProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, bool isActive)[])",
  "function addToCart(uint256 productId, uint256 quantity) external",
  "function checkout(uint256 companyId) external returns (uint256)",
  "function getInvoice(uint256 invoiceId) external view returns (tuple(uint256 invoiceId, address customerAddress, uint256 companyId, uint256 totalAmount, uint256 timestamp, bool isPaid, uint256[] productIds, uint256[] quantities))",
  "function processPayment(uint256 invoiceId, string tokenType) external",
  "event CompanyRegistered(uint256 indexed companyId, string name, address indexed owner)",
  "event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 total)"
];
  