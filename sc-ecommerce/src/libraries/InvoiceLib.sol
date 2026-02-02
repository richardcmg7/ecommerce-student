// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct Invoice {
    uint256 invoiceId;
    address customerAddress;
    uint256 companyId; // Una invoice por compañia (si compra a varias, son varias invoices)
    uint256 totalAmount;
    uint256 timestamp;
    bool isPaid;
    // Productos incluidos (simplificado, podríamos guardar array de items)
    uint256[] productIds; 
    uint256[] quantities;
}

library InvoiceLib {
    event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 total);
    event InvoicePaid(uint256 indexed invoiceId);

    struct InvoiceStorage {
        mapping(uint256 => Invoice) invoices;
        uint256 invoiceCount;
        // Mapping Customer => Invoices
        mapping(address => uint256[]) customerInvoices;
        // Mapping Company => Invoices
        mapping(uint256 => uint256[]) companyInvoices;
    }

    function createInvoice(
        InvoiceStorage storage self,
        address customer,
        uint256 companyId,
        uint256 totalAmount,
        uint256[] memory productIds,
        uint256[] memory quantities
    ) internal returns (uint256) {
        self.invoiceCount++;
        uint256 newId = self.invoiceCount;

        self.invoices[newId] = Invoice({
            invoiceId: newId,
            customerAddress: customer,
            companyId: companyId,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            isPaid: false,
            productIds: productIds,
            quantities: quantities
        });

        self.customerInvoices[customer].push(newId);
        self.companyInvoices[companyId].push(newId);
        emit InvoiceCreated(newId, customer, totalAmount);
        
        return newId;
    }

    function markAsPaid(InvoiceStorage storage self, uint256 invoiceId) internal {
        require(!self.invoices[invoiceId].isPaid, "Invoice already paid");
        self.invoices[invoiceId].isPaid = true;
        emit InvoicePaid(invoiceId);
    }

    function getInvoice(InvoiceStorage storage self, uint256 invoiceId) internal view returns (Invoice memory) {
        return self.invoices[invoiceId];
    }

    function getCompanyInvoices(InvoiceStorage storage self, uint256 companyId) internal view returns (Invoice[] memory) {
        uint256[] memory invoiceIds = self.companyInvoices[companyId];
        Invoice[] memory companyInvoices = new Invoice[](invoiceIds.length);
        
        for (uint256 i = 0; i < invoiceIds.length; i++) {
            companyInvoices[i] = self.invoices[invoiceIds[i]];
        }
        
        return companyInvoices;
    }

    function getCustomerInvoices(InvoiceStorage storage self, address customer) internal view returns (Invoice[] memory) {
        uint256[] memory invoiceIds = self.customerInvoices[customer];
        Invoice[] memory customerInvoices = new Invoice[](invoiceIds.length);
        
        for (uint256 i = 0; i < invoiceIds.length; i++) {
            customerInvoices[i] = self.invoices[invoiceIds[i]];
        }
        
        return customerInvoices;
    }
}
