"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface WalletConnectProps {
  onAddressChange: (address: string | null) => void;
}

export default function WalletConnect({ onAddressChange }: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask no está instalado. Por favor instálalo para continuar.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        onAddressChange(accounts[0]);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError("Error al conectar la wallet.");
    }
  };

  useEffect(() => {
    // Verificar si ya está conectado al cargar
    if (typeof window !== "undefined" && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        provider.listAccounts().then((accounts) => {
            if (accounts.length > 0) {
                setAddress(accounts[0].address);
                onAddressChange(accounts[0].address);
            }
        }).catch(console.error);
    }
  }, [onAddressChange]);

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      {address ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Wallet Conectada:</span>
          <code className="text-sm font-mono bg-gray-200 dark:bg-gray-900 px-2 py-1 rounded break-all">
            {address}
          </code>
          <button
            onClick={() => {
                setAddress(null);
                onAddressChange(null);
            }}
            className="text-xs text-red-500 hover:text-red-700 underline mt-1 self-start"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors w-full"
        >
          🦊 Conectar MetaMask
        </button>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
