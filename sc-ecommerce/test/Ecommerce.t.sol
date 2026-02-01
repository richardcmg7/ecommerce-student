// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock Token para pruebas
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**6);
    }
    function decimals() public pure override returns (uint8) { return 6; }
}

contract EcommerceTest is Test {
    Ecommerce ecommerce;
    MockToken eurt;
    MockToken usdt;

    address companyOwner = address(0x1);
    address customer = address(0x2);

    function setUp() public {
        eurt = new MockToken("EuroToken", "EURT");
        usdt = new MockToken("Tether", "USDT");
        
        ecommerce = new Ecommerce(address(eurt), address(usdt));

        // Dar tokens al cliente para pagar
        eurt.transfer(customer, 500 * 10**6); // 500 EUR
    }

    function testFullFlow() public {
        // 1. Registrar Empresa
        vm.startPrank(companyOwner);
        ecommerce.registerCompany("Tech Store", "ES12345678");
        
        // 2. Agregar Producto (Precio 10 EUR)
        ecommerce.addProduct("Laptop", "Gaming Laptop", 10000000, 5, "QmHash");
        vm.stopPrank();

        // 3. Cliente agrega al carrito
        vm.startPrank(customer);
        ecommerce.addToCart(1, 1); // ProductId 1, Qty 1

        // 4. Checkout (CompanyId 1)
        uint256 invoiceId = ecommerce.checkout(1);
        
        // Verificar invoice
        Invoice memory inv = ecommerce.getInvoice(invoiceId);
        assertEq(inv.totalAmount, 10000000);
        assertEq(inv.isPaid, false);

        // 5. Pagar
        eurt.approve(address(ecommerce), 10000000);
        ecommerce.processPayment(invoiceId, "EURT");
        
        // Verificar estado final
        inv = ecommerce.getInvoice(invoiceId);
        assertEq(inv.isPaid, true);
        
        // Verificar balance de empresa
        assertEq(eurt.balanceOf(companyOwner), 10000000);
        vm.stopPrank();
    }
}
