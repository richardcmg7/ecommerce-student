import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error connecting wallet", error);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
       const provider = new ethers.BrowserProvider(window.ethereum);
       provider.listAccounts().then((accounts) => {
         if (accounts.length > 0) {
           setAddress(accounts[0].address);
           setIsConnected(true);
         }
       }).catch(console.error);

       window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
             setAddress(accounts[0]);
             setIsConnected(true);
          } else {
             setAddress(null);
             setIsConnected(false);
          }
       });
    }
  }, []);

  return { address, isConnected, connect };
}
