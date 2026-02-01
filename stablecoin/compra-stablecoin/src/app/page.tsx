"use client";

import { useState, useEffect, useCallback } from "react";
import WalletConnect from "@/components/WalletConnect";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "@/components/CheckoutForm";
import { ethers } from "ethers";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export default function Home() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [tokenType, setTokenType] = useState<"EURT" | "USDT">("EURT");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [balances, setBalances] = useState<{ EURT: string; USDT: string }>({ EURT: "0", USDT: "0" });

  const fetchBalances = useCallback(async () => {
    if (!userAddress || !window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const eurtAddr = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS;
      const usdtAddr = process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS;

      let eurtBal = "0";
      let usdtBal = "0";

      if (eurtAddr && eurtAddr !== "0x...") {
        const contract = new ethers.Contract(eurtAddr, ERC20_ABI, provider);
        const bal = await contract.balanceOf(userAddress);
        const dec = await contract.decimals();
        eurtBal = ethers.formatUnits(bal, dec);
      }

      if (usdtAddr && usdtAddr !== "0x...") {
        const contract = new ethers.Contract(usdtAddr, ERC20_ABI, provider);
        const bal = await contract.balanceOf(userAddress);
        const dec = await contract.decimals();
        usdtBal = ethers.formatUnits(bal, dec);
      }

      setBalances({ EURT: eurtBal, USDT: usdtBal });
    } catch (err) {
      console.error("Error cargando balances:", err);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000); // Actualizar cada 10s
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const startCheckout = async () => {
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          currency: tokenType === "EURT" ? "eur" : "usd",
          walletAddress: userAddress,
          tokenType
        }),
      });
      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error("Error iniciando checkout:", err);
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] max-w-2xl mx-auto">
      <main className="flex flex-col gap-8 items-center sm:items-start w-full">
        <h1 className="text-3xl font-bold">Compra de Stablecoins</h1>
        
        <div className="w-full space-y-6">
          {/* Dashboard de Balances */}
          {userAddress && (
            <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-600 uppercase font-bold">Mi Saldo EURT</p>
                    <p className="text-2xl font-mono">{balances.EURT}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 uppercase font-bold">Mi Saldo USDT</p>
                    <p className="text-2xl font-mono">{balances.USDT}</p>
                </div>
            </div>
          )}

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Conecta tu Wallet</h2>
            <WalletConnect onAddressChange={setUserAddress} />
          </section>

          <section className={`space-y-4 ${!userAddress ? 'opacity-50 pointer-events-none' : ''}`}>
             <h2 className="text-xl font-semibold">2. Elige Cantidad</h2>
             <div className="flex gap-4 items-center p-4 border rounded-lg">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Monto a Comprar</label>
                    <input 
                        type="number" 
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full p-2 border rounded dark:bg-gray-800"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Token</label>
                    <select 
                        value={tokenType}
                        onChange={(e) => setTokenType(e.target.value as "EURT" | "USDT")}
                        className="w-full p-2 border rounded dark:bg-gray-800"
                    >
                        <option value="EURT">EuroToken (EURT)</option>
                        <option value="USDT">Tether USD (USDT)</option>
                    </select>
                </div>
             </div>
          </section>

          {userAddress && amount > 0 && (
             <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Realizar Pago</h2>
                {!clientSecret ? (
                    <button 
                        onClick={startCheckout}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-all"
                    >
                        Preparar Pago de {tokenType === "EURT" ? "€" : "$"}{amount}
                    </button>
                ) : (
                    <div className="p-6 border rounded-lg bg-white dark:bg-gray-900 shadow-xl">
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat' } }}>
                            <CheckoutForm amount={amount} tokenType={tokenType} />
                        </Elements>
                        <button 
                            onClick={() => setClientSecret(null)}
                            className="mt-4 text-xs text-gray-500 underline"
                        >
                            Cancelar y cambiar monto
                        </button>
                    </div>
                )}
             </section>
          )}
        </div>
      </main>
    </div>
  );
}
