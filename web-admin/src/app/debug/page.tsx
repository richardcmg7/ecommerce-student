"use client";

import { useState } from "react";
import { ethers } from "ethers";

const ECOMMERCE_ABI = [
  "function getMyCompany() external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))",
  "function registerCompany(string name, string taxId) external"
];

export default function DebugPage() {
  const [result, setResult] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAddress(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet", error);
      }
    }
  };

  const testGetMyCompany = async () => {
    if (!address || !window.ethereum) {
      setResult("Wallet not connected");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractAddr = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(contractAddr || "", ECOMMERCE_ABI, provider);
      
      console.log("Testing with address:", address);
      console.log("Contract address:", contractAddr);
      
      const comp = await contract.getMyCompany();
      
      console.log("Raw result:", comp);
      
      const formatted = {
        companyId: comp.companyId ? comp.companyId.toString() : "undefined",
        name: comp.name || "undefined",
        companyAddress: comp.companyAddress || "undefined", 
        taxId: comp.taxId || "undefined",
        isActive: comp.isActive !== undefined ? comp.isActive.toString() : "undefined"
      };
      
      setResult(JSON.stringify(formatted, null, 2));
      
    } catch (error: any) {
      console.error("Error:", error);
      setResult(`Error: ${error.reason || error.message}`);
    }
  };

  const testRegisterCompany = async () => {
    if (!address || !window.ethereum) {
      setResult("Wallet not connected");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddr = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(contractAddr || "", ECOMMERCE_ABI, signer);
      
      const tx = await contract.registerCompany("Debug Company", "DEBUG123");
      setResult("Transaction sent: " + tx.hash);
      
      const receipt = await tx.wait();
      setResult("Transaction confirmed: " + receipt.hash);
      
    } catch (error: any) {
      console.error("Error:", error);
      setResult(`Error: ${error.reason || error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={connectWallet}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
          >
            Connect Wallet
          </button>
          {address && (
            <span className="text-sm font-mono">{address}</span>
          )}
        </div>
        
        <div>
          <button 
            onClick={testGetMyCompany}
            className="bg-green-500 text-white px-4 py-2 rounded mr-4"
            disabled={!address}
          >
            Test getMyCompany
          </button>
          
          <button 
            onClick={testRegisterCompany}
            className="bg-orange-500 text-white px-4 py-2 rounded"
            disabled={!address}
          >
            Test registerCompany
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
        
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold mb-2">Environment:</h3>
          <p className="text-sm">Contract: {process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS}</p>
        </div>
      </div>
    </div>
  );
}