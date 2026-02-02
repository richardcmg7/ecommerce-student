// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock tokens for integration testing
contract MockEuroToken is ERC20 {
    constructor() ERC20("EuroToken", "EURT") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MockUSDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {}
    function decimals() public pure override returns (uint8) { return 4; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract IntegrationTest is Test {
    Ecommerce ecommerce;
    MockEuroToken eurt;
    MockUSDT usdt;

    address owner = address(this);
    address company1 = address(0x1);
    address company2 = address(0x2);
    address customer1 = address(0x3);
    address customer2 = address(0x4);

    function setUp() public {
        // Deploy tokens
        eurt = new MockEuroToken();
        usdt = new MockUSDT();
        
        // Deploy ecommerce
        ecommerce = new Ecommerce(address(eurt), address(usdt));

        // Mint tokens to customers
        eurt.mint(customer1, 1000 * 10**6); // 1000 EURT
        eurt.mint(customer2, 500 * 10**6);  // 500 EURT
        usdt.mint(customer1, 1000 * 10**4); // 1000 USDT
    }

    function testCompleteEcommerceFlow() public {
        // 1. Register companies
        vm.prank(company1);
        ecommerce.registerCompany("Tech Store", "ES12345678");
        
        vm.prank(company2);
        ecommerce.registerCompany("Fashion Store", "ES87654321");

        // 2. Add products
        vm.startPrank(company1);
        ecommerce.addProduct("Laptop", "Gaming Laptop", 500 * 10**6, 10, "QmHash1");
        ecommerce.addProduct("Mouse", "Gaming Mouse", 50 * 10**6, 20, "QmHash2");
        vm.stopPrank();

        vm.startPrank(company2);
        ecommerce.addProduct("T-Shirt", "Cotton T-Shirt", 25 * 10**6, 50, "QmHash3");
        vm.stopPrank();

        // 3. Customer adds to cart and buys from company1
        vm.startPrank(customer1);
        ecommerce.addToCart(1, 1); // Laptop
        ecommerce.addToCart(2, 2); // 2 Mice
        
        uint256 invoiceId1 = ecommerce.checkout(1);
        
        // Verify invoice
        Invoice memory inv1 = ecommerce.getInvoice(invoiceId1);
        assertEq(inv1.totalAmount, 600 * 10**6); // 500 + 50*2
        assertEq(inv1.companyId, 1);
        assertEq(inv1.customerAddress, customer1);
        assertFalse(inv1.isPaid);

        // Pay invoice
        eurt.approve(address(ecommerce), 600 * 10**6);
        ecommerce.processPayment(invoiceId1, "EURT");
        
        // Verify payment
        inv1 = ecommerce.getInvoice(invoiceId1);
        assertTrue(inv1.isPaid);
        
        // Verify balances
        assertEq(eurt.balanceOf(customer1), 400 * 10**6); // 1000 - 600
        assertEq(eurt.balanceOf(company1), 600 * 10**6);
        
        // Verify stock reduction
        Product memory laptop = ecommerce.getProduct(1);
        Product memory mouse = ecommerce.getProduct(2);
        assertEq(laptop.stock, 9);  // 10 - 1
        assertEq(mouse.stock, 18);  // 20 - 2
        vm.stopPrank();

        // 4. Customer2 buys from company2 with USDT
        vm.startPrank(customer2);
        ecommerce.addToCart(3, 3); // 3 T-Shirts
        
        uint256 invoiceId2 = ecommerce.checkout(2);
        
        // Convert EURT to USDT equivalent (simplified 1:1 for test)
        usdt.mint(customer2, 75 * 10**4); // 75 USDT for 75 EUR worth
        usdt.approve(address(ecommerce), 75 * 10**4);
        
        // This should fail because invoice was created with EURT pricing
        // but we're trying to pay with USDT - this tests the token validation
        vm.expectRevert();
        ecommerce.processPayment(invoiceId2, "USDT");
        vm.stopPrank();
    }

    function testMultipleCustomersAndCompanies() public {
        // Register multiple companies
        vm.prank(company1);
        ecommerce.registerCompany("Store A", "A123");
        
        vm.prank(company2);
        ecommerce.registerCompany("Store B", "B456");

        // Add products to both stores
        vm.prank(company1);
        ecommerce.addProduct("Product A1", "Description A1", 100 * 10**6, 5, "HashA1");
        
        vm.prank(company2);
        ecommerce.addProduct("Product B1", "Description B1", 200 * 10**6, 3, "HashB1");

        // Customer1 buys from both stores (separate transactions)
        vm.startPrank(customer1);
        
        // Buy from store A
        ecommerce.addToCart(1, 1);
        uint256 invoiceA = ecommerce.checkout(1);
        eurt.approve(address(ecommerce), 100 * 10**6);
        ecommerce.processPayment(invoiceA, "EURT");
        
        // Buy from store B
        ecommerce.addToCart(2, 1);
        uint256 invoiceB = ecommerce.checkout(2);
        eurt.approve(address(ecommerce), 200 * 10**6);
        ecommerce.processPayment(invoiceB, "EURT");
        
        vm.stopPrank();

        // Verify final balances
        assertEq(eurt.balanceOf(customer1), 700 * 10**6); // 1000 - 100 - 200
        assertEq(eurt.balanceOf(company1), 100 * 10**6);
        assertEq(eurt.balanceOf(company2), 200 * 10**6);
    }

    function testErrorCases() public {
        // Try to add product without registering company
        vm.prank(company1);
        vm.expectRevert("Only registered companies can add products");
        ecommerce.addProduct("Product", "Desc", 100, 1, "Hash");

        // Register company and add product
        vm.prank(company1);
        ecommerce.registerCompany("Store", "123");
        
        vm.prank(company1);
        ecommerce.addProduct("Product", "Desc", 100 * 10**6, 1, "Hash");

        // Try to buy more than stock
        vm.prank(customer1);
        vm.expectRevert("Insufficient stock");
        ecommerce.addToCart(1, 2); // Only 1 in stock

        // Try to checkout empty cart
        vm.prank(customer1);
        vm.expectRevert("Cart is empty");
        ecommerce.checkout(1);

        // Add to cart and checkout
        vm.prank(customer1);
        ecommerce.addToCart(1, 1);
        
        vm.prank(customer1);
        uint256 invoiceId = ecommerce.checkout(1);

        // Try to pay without approval
        vm.prank(customer1);
        vm.expectRevert("Insufficient allowance");
        ecommerce.processPayment(invoiceId, "EURT");

        // Try to pay someone else's invoice
        vm.prank(customer2);
        eurt.approve(address(ecommerce), 100 * 10**6);
        vm.expectRevert("Not your invoice");
        ecommerce.processPayment(invoiceId, "EURT");
    }
}