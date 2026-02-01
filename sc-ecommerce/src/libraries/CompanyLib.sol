// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct Company {
    uint256 companyId;
    string name;
    address companyAddress; // Wallet donde recibe pagos
    string taxId;
    bool isActive;
}

library CompanyLib {
    event CompanyRegistered(uint256 indexed companyId, string name, address indexed owner);

    struct CompanyStorage {
        mapping(uint256 => Company) companies;
        mapping(address => uint256) ownerToCompanyId; // 1 owner -> 1 company (simplificación)
        uint256 companyCount;
    }

    function registerCompany(
        CompanyStorage storage self,
        string memory name,
        string memory taxId,
        address owner
    ) internal returns (uint256) {
        require(self.ownerToCompanyId[owner] == 0, "Address already has a company");
        
        self.companyCount++;
        uint256 newId = self.companyCount;

        self.companies[newId] = Company({
            companyId: newId,
            name: name,
            companyAddress: owner,
            taxId: taxId,
            isActive: true
        });

        self.ownerToCompanyId[owner] = newId;

        emit CompanyRegistered(newId, name, owner);
        return newId;
    }

    function getCompany(CompanyStorage storage self, uint256 companyId) internal view returns (Company memory) {
        return self.companies[companyId];
    }
    
    function getCompanyIdByOwner(CompanyStorage storage self, address owner) internal view returns (uint256) {
        return self.ownerToCompanyId[owner];
    }
}
