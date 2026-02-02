// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MOCK") {}
    function decimals() public pure override returns (uint8) { return 6; }
}

contract CompanyTest is Test {
    Ecommerce ecommerce;
    MockToken eurt;
    MockToken usdt;

    address testUser = address(0x8a0b4Fb8eEdDD7e599E843eAD2135A99b09E4272);

    function setUp() public {
        eurt = new MockToken();
        usdt = new MockToken();
        ecommerce = new Ecommerce(address(eurt), address(usdt));
    }

    function testRegisterAndGetCompany() public {
        // Registrar empresa
        vm.prank(testUser);
        ecommerce.registerCompany("Test Company", "CIF123");

        // Obtener empresa
        vm.prank(testUser);
        Company memory comp = ecommerce.getMyCompany();

        // Verificar datos
        assertEq(comp.companyId, 1);
        assertEq(comp.name, "Test Company");
        assertEq(comp.companyAddress, testUser);
        assertEq(comp.taxId, "CIF123");
        assertTrue(comp.isActive);
    }

    function testGetCompanyById() public {
        // Registrar empresa
        vm.prank(testUser);
        ecommerce.registerCompany("Test Company", "CIF123");

        // Obtener empresa por ID
        Company memory comp = ecommerce.getCompany(1);

        // Verificar datos
        assertEq(comp.companyId, 1);
        assertEq(comp.name, "Test Company");
        assertEq(comp.companyAddress, testUser);
        assertEq(comp.taxId, "CIF123");
        assertTrue(comp.isActive);
    }

    function testGetMyCompanyWithoutRegistration() public {
        vm.prank(testUser);
        vm.expectRevert("No company registered");
        ecommerce.getMyCompany();
    }
}