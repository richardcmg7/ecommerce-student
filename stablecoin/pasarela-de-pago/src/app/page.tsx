"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";

// Componente interno que usa useSearchParams
function PaymentInterface() {
  const searchParams = useSearchParams();
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "approving" | "paying" | "success" | "error">("pending");
  const [errorMsg, setErrorMsg] = useState("");

  // Datos de la factura recibidos por URL
  const merchantAddress = searchParams.get("merchant_address");
  const amount = searchParams.get("amount");
  const invoiceId = searchParams.get("invoice");
  const redirectUrl = searchParams.get("redirect");
  const tokenType = searchParams.get("token") || "EURT"; // Default EURT

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const processPayment = async () => {
    if (!address || !merchantAddress || !amount) return;

    try {
      setStatus("approving");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 1. Obtener dirección del contrato del Token
      // NOTA: Estas direcciones vendrán de variables de entorno
      const tokenAddress = tokenType === "EURT" 
        ? process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS 
        : process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS;
      
      const ecommerceContractAddress = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS;

      if (!tokenAddress || !ecommerceContractAddress) {
        throw new Error("Contratos no configurados en el sistema");
      }

      // 2. Aprobar al contrato Ecommerce para gastar los tokens
      const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)", "function decimals() view returns (uint8)"];
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      const decimals = await tokenContract.decimals();
      const amountInUnits = ethers.parseUnits(amount, decimals);

      // Aprobar gasto
      const txApprove = await tokenContract.approve(ecommerceContractAddress, amountInUnits);
      await txApprove.wait();

      setStatus("paying");

      // 3. Ejecutar pago en contrato Ecommerce (Aún no existe, dejamos el placeholder)
      // const Ecommerce_ABI = ["function processPayment(address customer, uint256 amount, uint256 invoiceId)"];
      // const ecommerceContract = new ethers.Contract(ecommerceContractAddress, Ecommerce_ABI, signer);
      // const txPay = await ecommerceContract.processPayment(address, amountInUnits, invoiceId);
      // await txPay.wait();

      // SIMULACIÓN TEMPORAL (Solo transferencia directa para probar Parte 3 aislada si fuera necesario)
      // En la versión final, esto llamará a processPayment del contrato Ecommerce
      console.log("Pago simulado exitoso");
      
      setStatus("success");

      // Redirigir si existe URL
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = `${redirectUrl}?status=success&tx=0x_simulated`;
        }, 3000);
      }

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Error procesando el pago");
    }
  };

  if (!merchantAddress || !amount) {
    return <div className="p-10 text-center text-red-500">Error: Parámetros de pago inválidos (Falta merchant o amount)</div>;
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
      {/* Header Factura */}
      <div className="bg-gray-100 dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-sm text-gray-500 uppercase font-bold tracking-wider">Factura</h2>
                <p className="text-2xl font-bold font-mono">#{invoiceId || "BORRADOR"}</p>
            </div>
            <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-bold ${tokenType === 'EURT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {tokenType}
                </span>
            </div>
        </div>
        <div className="text-center py-4">
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                {tokenType === 'EURT' ? '€' : '$'}{amount}
            </p>
            <p className="text-sm text-gray-500 mt-1">A pagar a: {merchantAddress.slice(0,6)}...{merchantAddress.slice(-4)}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="p-6 space-y-4">
        {!address ? (
             <button 
                onClick={connectWallet}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
             >
                🦊 Conectar MetaMask
             </button>
        ) : (
            <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded text-sm flex justify-between items-center">
                    <span className="text-blue-700 dark:text-blue-300">Wallet:</span>
                    <span className="font-mono text-xs">{address.slice(0,8)}...{address.slice(-6)}</span>
                </div>

                {status === "success" ? (
                    <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <p className="text-green-600 font-bold text-lg">¡Pago Exitoso!</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Redirigiendo a la tienda...</p>
                    </div>
                ) : (
                    <button 
                        onClick={processPayment}
                        disabled={status !== "pending"}
                        className={`w-full font-bold py-4 px-4 rounded-lg transition-all text-white
                            ${status === 'error' ? 'bg-red-500' : 'bg-indigo-600 hover:bg-indigo-700'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {status === 'pending' && "Confirmar y Pagar"}
                        {status === 'approving' && "Aprobando Tokens..."}
                        {status === 'paying' && "Procesando Transacción..."}
                        {status === 'error' && "Reintentar"}
                    </button>
                )}
                
                {errorMsg && (
                    <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{errorMsg}</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div>Cargando pasarela...</div>}>
        <PaymentInterface />
      </Suspense>
    </div>
  );
}