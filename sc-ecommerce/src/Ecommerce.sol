// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./libraries/CompanyLib.sol";
import "./libraries/ProductLib.sol";
import "./libraries/CartLib.sol";
import "./libraries/InvoiceLib.sol";

contract Ecommerce is Ownable {
    // Usamos las librerías para manejar el almacenamiento
    using CompanyLib for CompanyLib.CompanyStorage;
    using ProductLib for ProductLib.ProductStorage;
    using CartLib for CartLib.CartStorage;
    using InvoiceLib for InvoiceLib.InvoiceStorage;

    // Almacenamiento Principal
    CompanyLib.CompanyStorage private companies;
    ProductLib.ProductStorage private products;
    CartLib.CartStorage private carts;
    InvoiceLib.InvoiceStorage private invoices;

    // Tokens aceptados
    IERC20 public euroToken;
    IERC20 public usdtToken;

    event PaymentProcessed(uint256 indexed invoiceId, address indexed customer, uint256 amount);

    constructor(address _euroToken, address _usdtToken) Ownable(msg.sender) {
        euroToken = IERC20(_euroToken);
        usdtToken = IERC20(_usdtToken);
    }

    // --- Gestión de Empresas ---

    function registerCompany(string memory name, string memory taxId) external {
        companies.registerCompany(name, taxId, msg.sender);
    }

    function getMyCompany() external view returns (Company memory) {
        uint256 id = companies.getCompanyIdByOwner(msg.sender);
        require(id > 0, "No company registered");
        return companies.getCompany(id);
    }

    function getCompany(uint256 companyId) external view returns (Company memory) {
        return companies.getCompany(companyId);
    }

    // --- Gestión de Productos ---

    function addProduct(
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash
    ) external {
        uint256 companyId = companies.getCompanyIdByOwner(msg.sender);
        require(companyId > 0, "Only registered companies can add products");

        products.addProduct(companyId, name, description, price, stock, ipfsImageHash);
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        return products.getProduct(productId);
    }

    // --- Carrito de Compras ---

    function addToCart(uint256 productId, uint256 quantity) external {
        Product memory p = products.getProduct(productId);
        require(p.isActive, "Product not available");
        require(p.stock >= quantity, "Insufficient stock");
        
        carts.addToCart(msg.sender, productId, quantity);
    }

    function getMyCart() external view returns (CartItem[] memory) {
        return carts.getCart(msg.sender);
    }

    // --- Checkout y Pagos ---

    // Paso 1: Crear Invoice desde el carrito (para una empresa específica)
    // Simplificación: El frontend debe filtrar items por empresa y llamar esto por cada empresa
    function checkout(uint256 companyId) external returns (uint256) {
        CartItem[] memory cart = carts.getCart(msg.sender);
        require(cart.length > 0, "Cart is empty");

        uint256 total = 0;
        
        // Contadores para arrays dinámicos
        uint256 count = 0;
        for(uint i = 0; i < cart.length; i++) {
             Product memory p = products.getProduct(cart[i].productId);
             if (p.companyId == companyId) {
                 count++;
             }
        }
        require(count > 0, "No products for this company in cart");

        uint256[] memory productIds = new uint256[](count);
        uint256[] memory quantities = new uint256[](count);
        uint256 idx = 0;

        for(uint i = 0; i < cart.length; i++) {
            Product memory p = products.getProduct(cart[i].productId);
            if (p.companyId == companyId) {
                require(p.stock >= cart[i].quantity, "Stock changed during checkout");
                total += p.price * cart[i].quantity;
                
                productIds[idx] = p.productId;
                quantities[idx] = cart[i].quantity;
                idx++;
            }
        }

        uint256 invoiceId = invoices.createInvoice(msg.sender, companyId, total, productIds, quantities);
        
        // Limpiar carrito (simplificado: borra todo, idealmente borraría solo lo comprado)
        carts.clearCart(msg.sender);

        return invoiceId;
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices.getInvoice(invoiceId);
    }

    // Paso 2: Pagar la Invoice
    function processPayment(uint256 invoiceId, string memory tokenType) external {
        Invoice memory inv = invoices.getInvoice(invoiceId);
        require(inv.invoiceId != 0, "Invoice not found");
        require(!inv.isPaid, "Already paid");
        require(inv.customerAddress == msg.sender, "Not your invoice");

        IERC20 token;
        if (keccak256(bytes(tokenType)) == keccak256(bytes("EURT"))) {
            token = euroToken;
        } else if (keccak256(bytes(tokenType)) == keccak256(bytes("USDT"))) {
            token = usdtToken;
        } else {
            revert("Invalid token type");
        }

        // Verificar allowance
        require(token.allowance(msg.sender, address(this)) >= inv.totalAmount, "Insufficient allowance");
        
        // Transferir tokens del cliente a la empresa
        Company memory comp = companies.getCompany(inv.companyId);
        bool success = token.transferFrom(msg.sender, comp.companyAddress, inv.totalAmount);
        require(success, "Transfer failed");

        // Actualizar stock
        for(uint i = 0; i < inv.productIds.length; i++) {
            products.reduceStock(inv.productIds[i], inv.quantities[i]);
        }

        invoices.markAsPaid(invoiceId);
        emit PaymentProcessed(invoiceId, msg.sender, inv.totalAmount);
    }
}
