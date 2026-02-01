"use client";

import { useState } from "react";
import WalletConnect from "@/components/WalletConnect";

export default function Home() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(10);
  const [tokenType, setTokenType] = useState<"EURT" | "USDT">("EURT");

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] max-w-2xl mx-auto">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <h1 className="text-3xl font-bold">Compra de Stablecoins</h1>
        
        <div className="w-full space-y-6">
          {/* Paso 1: Conectar Wallet */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Conecta tu Wallet</h2>
            <WalletConnect onAddressChange={setUserAddress} />
          </section>

          {/* Paso 2: Seleccionar Monto */}
          <section className="space-y-4 opacity-100 transition-opacity disabled:opacity-50">
             <h2 className="text-xl font-semibold">2. Elige Cantidad</h2>
             <div className="flex gap-4 items-center p-4 border rounded-lg">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Monto a Comprar</label>
                    <input 
                        type="number" 
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Token</label>
                    <select 
                        value={tokenType}
                        onChange={(e) => setTokenType(e.target.value as "EURT" | "USDT")}
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    >
                        <option value="EURT">EuroToken (EURT)</option>
                        <option value="USDT">Tether USD (USDT)</option>
                    </select>
                </div>
             </div>
             <div className="text-right font-bold text-lg">
                Total a pagar: {tokenType === "EURT" ? "€" : "$"}{amount.toFixed(2)}
             </div>
          </section>

          {/* Paso 3: Pago (Placeholder) */}
          {userAddress && amount > 0 && (
             <section className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                <p className="mb-4">
                    Aquí se cargará la pasarela de Stripe para procesar el pago de 
                    <strong> {tokenType === "EURT" ? "€" : "$"}{amount}</strong> y enviar los tokens a:
                </p>
                <code className="block text-xs md:text-sm bg-white dark:bg-black p-2 rounded mb-4 overflow-hidden text-ellipsis">
                    {userAddress}
                </code>
                <button disabled className="bg-gray-400 text-white px-6 py-2 rounded cursor-not-allowed">
                    Proceder al Pago (Próximamente)
                </button>
             </section>
          )}
        </div>
      </main>
    </div>
  );
}