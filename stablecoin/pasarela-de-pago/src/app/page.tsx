"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { ECOMMERCE_ABI } from "@/lib/constants";

function PaymentInterface() {
  const searchParams = useSearchParams();
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "approving" | "paying" | "success" | "error">("pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);

  const amount = searchParams.get("amount");
  const invoiceId = searchParams.get("invoice");
  const redirectUrl = searchParams.get("redirect");
  const tokenType = searchParams.get("token") || "EURT";

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      console.log("🔌 Intentando conectar wallet...");
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
        params: []
      });
      
      console.log("📋 Cuentas disponibles:", accounts);
      
      if (accounts.length > 0) {
        console.log("✅ Conectando con:", accounts[0]);
        setAddress(accounts[0]);
        setIsManuallyDisconnected(false);
        localStorage.removeItem('wallet_manually_disconnected');
      }
    } catch (err) {
      console.error("❌ Error connecting wallet:", err);
    }
  };

  const revokePermissions = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      console.log("🔐 Revocando permisos de MetaMask...");
      
      await window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [
          {
            eth_accounts: {}
          }
        ]
      });
      
      console.log("✅ Permisos revocados exitosamente");
      
    } catch (error) {
      console.error("❌ Error revocando permisos:", error);
      
      if (error.code === -32601) {
        console.log("⚠️ Método no soportado, desconectando localmente");
      }
    } finally {
      setAddress(null);
      setIsManuallyDisconnected(true);
      localStorage.setItem('wallet_manually_disconnected', 'true');
      console.log("🔌 Wallet desconectada y permisos revocados");
    }
  };

  const disconnect = async () => {
    await revokePermissions();
  };

  // Detectar cambios de cuenta automáticamente
  useEffect(() => {
    // Verificar si fue desconectado manualmente al cargar
    const wasManuallyDisconnected = localStorage.getItem('wallet_manually_disconnected') === 'true';
    if (wasManuallyDisconnected) {
      setIsManuallyDisconnected(true);
      return;
    }

    if (typeof window !== "undefined" && window.ethereum && !isManuallyDisconnected) {
      // Función para obtener la cuenta actual
      const getCurrentAccount = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const currentAddress = accounts[0].address;
            console.log("🔍 Cuenta actual detectada:", currentAddress);
            setAddress(currentAddress);
          }
        } catch (err) {
          console.error("Error obteniendo cuenta actual:", err);
        }
      };

      // Obtener cuenta actual inmediatamente
      getCurrentAccount();

      // Escuchar cambios de cuenta
      const handleAccountsChanged = (accounts: string[]) => {
        if (isManuallyDisconnected) return;
        
        console.log("🔄 Cuenta cambiada en pasarela:", accounts);
        if (accounts.length > 0) {
          const newAddress = accounts[0];
          console.log("🔄 Nueva dirección en pasarela:", newAddress);
          setAddress(newAddress);
          // Resetear estado si estaba en error
          if (status === "error") {
            setStatus("pending");
            setErrorMsg("");
          }
        } else {
          setAddress(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Cleanup
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [isManuallyDisconnected, status]); // Remover dependencia de status

  const processPayment = async () => {
    if (!amount || !invoiceId) return;

    try {
      // FORZAR reconexión para asegurar cuenta correcta
      console.log("🔄 Forzando reconexión de MetaMask...");
      if (typeof window !== "undefined" && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const currentAccount = accounts[0];
        console.log("🔍 Cuenta confirmada:", currentAccount);
        setAddress(currentAccount);
      }

      if (!address) {
        alert("Por favor conecta tu wallet primero");
        return;
      }

      setStatus("approving");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Forzamos el uso de 127.0.0.1 para evitar problemas de DNS local
      const readProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

      const tokenAddress = tokenType === "EURT" 
        ? process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS 
        : process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS;
      
      const ecommerceAddr = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS;

      if (!tokenAddress || !ecommerceAddr) {
        throw new Error("Configuración de contratos incompleta en .env.local");
      }

      console.log("--- INICIANDO PAGO ---");
      console.log("Token:", tokenAddress);
      console.log("Ecommerce:", ecommerceAddr);
      console.log("User:", address);

      const ERC20_ABI = [
          "function approve(address spender, uint256 amount) public returns (bool)", 
          "function decimals() view returns (uint8)",
          "function allowance(address owner, address spender) view returns (uint256)"
      ];

      const tokenRead = new ethers.Contract(tokenAddress, ERC20_ABI, readProvider);
      const tokenWrite = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Obtener decimales (Paso 1)
      let decimals = 6;
      try {
          decimals = await tokenRead.decimals();
      } catch (e) {
          console.warn("No se pudo leer decimales, usando default 6");
      }

      const amountInUnits = ethers.parseUnits(amount, decimals);

      // Verificar Allowance (Paso 2) con manejo de error robusto
      let needsApproval = true;
      try {
          const currentAllowance = await tokenRead.allowance(address, ecommerceAddr);
          console.log("Allowance actual:", currentAllowance.toString());
          if (currentAllowance >= amountInUnits) {
              needsApproval = false;
          }
      } catch (e) {
          console.error("Error leyendo allowance, forzando aprobación:", e);
      }

      if (needsApproval) {
          console.log("Solicitando transacción de aprobación...");
          const txApprove = await tokenWrite.approve(ecommerceAddr, amountInUnits);
          await txApprove.wait();
      }

      setStatus("paying");

      // Pago Final (Paso 3)
      const ecommerceContract = new ethers.Contract(ecommerceAddr, ECOMMERCE_ABI, signer);
      console.log(`Ejecutando processPayment(${invoiceId}, ${tokenType})`);
      
      const txPay = await ecommerceContract.processPayment(invoiceId, tokenType);
      const receipt = await txPay.wait();

      console.log("Pago confirmado:", receipt.hash);
      setStatus("success");

      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = `${redirectUrl}?status=success&tx=${receipt.hash}`;
        }, 2000);
      }

    } catch (err: any) {
      console.error("Fallo crítico:", err);
      setStatus("error");
      setErrorMsg(err.reason || err.message || "Error en la transacción");
    }
  };

  if (!amount || !invoiceId) {
    return <div className="p-10 text-center text-red-500 font-bold">Error: Datos de factura incompletos.</div>;
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      <div className="bg-slate-900 p-8 text-white">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Pago Seguro</h2>
        <p className="text-2xl font-black mb-6">Invoice #{invoiceId}</p>
        <div className="text-center py-4">
            <p className="text-5xl font-black font-mono">€{amount}</p>
            <span className="inline-block mt-4 bg-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">{tokenType}</span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {!address ? (
             <button onClick={connectWallet} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3">
                🦊 Conectar MetaMask
             </button>
        ) : (
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Wallet</span>
                        <button 
                            onClick={disconnect}
                            className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-600 transition-colors"
                            title="Desconectar y revocar permisos"
                        >
                            Desconectar
                        </button>
                    </div>
                    <span className="font-mono text-xs font-bold">{address.slice(0,10)}...</span>
                </div>

                {status === "success" ? (
                    <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-100">
                        <p className="text-green-700 font-black text-xl">¡Pago Confirmado!</p>
                    </div>
                ) : (
                    <button 
                        onClick={processPayment}
                        disabled={status !== "pending" && status !== "error"}
                        className={`w-full font-black py-5 rounded-2xl text-white text-lg shadow-xl transition-all ${
                            status === 'error' ? 'bg-red-500' : 'bg-indigo-600 hover:bg-indigo-700'
                        } disabled:opacity-50`}
                    >
                        {status === 'pending' ? "Confirmar Pago" : "Procesando..."}
                    </button>
                )}
                
                {errorMsg && <p className="text-red-500 text-[10px] font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</p>}
            </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <PaymentInterface />
      </Suspense>
    </div>
  );
}