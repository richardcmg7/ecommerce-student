"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ECOMMERCE_ABI } from "@/lib/constants";
import { Building2, Wallet, Package, FileText, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { address, isConnected, connect, needsReconnection, disconnect, revokePermissions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", taxId: "" });
  const [debugMsg, setDebugMsg] = useState<string>("");

  const fetchCompany = async () => {
    if (!address) return;
    const contractAddr = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS;
    setDebugMsg("🔍 Consultando blockchain...");
    
    try {
      // Usar provider directo para consultas de solo lectura
      const directProvider = new ethers.JsonRpcProvider("http://localhost:8545");
      
      // Verificar conexión con Anvil
      try {
        const blockNumber = await directProvider.getBlockNumber();
        console.log("🔗 Conectado a Anvil, bloque:", blockNumber);
      } catch (connectError) {
        setDebugMsg("❌ No se puede conectar a Anvil (puerto 8545)");
        return;
      }
      
      setDebugMsg("🔍 Buscando empresa...");
      const contract = new ethers.Contract(contractAddr || "", ECOMMERCE_ABI, directProvider);
      
      console.log("🔍 Buscando empresa para:", address);
      console.log("📄 Contrato:", contractAddr);
      
      // Usar call estático para evitar problemas de MetaMask
      const comp = await contract.getMyCompany.staticCall({ from: address });
      console.log("📋 Respuesta cruda del contrato:", comp);
      console.log("📋 Tipo de respuesta:", typeof comp);
      console.log("📋 Es array:", Array.isArray(comp));
      console.log("📋 Longitud si es array:", Array.isArray(comp) ? comp.length : 'N/A');
      
      // Parsing más robusto
      let companyData = null;
      
      if (comp) {
        try {
          // Ethers v6 devuelve arrays para structs
          if (Array.isArray(comp) && comp.length >= 5) {
            console.log("📋 Parseando como array:");
            console.log("  [0] companyId:", comp[0], typeof comp[0]);
            console.log("  [1] name:", comp[1], typeof comp[1]);
            console.log("  [2] address:", comp[2], typeof comp[2]);
            console.log("  [3] taxId:", comp[3], typeof comp[3]);
            console.log("  [4] isActive:", comp[4], typeof comp[4]);
            
            companyData = {
              companyId: Number(comp[0]),
              name: String(comp[1] || ""),
              companyAddress: String(comp[2] || ""),
              taxId: String(comp[3] || ""),
              isActive: Boolean(comp[4])
            };
          } 
          // Fallback para otros formatos
          else if (comp.companyId !== undefined) {
            companyData = {
              companyId: Number(comp.companyId),
              name: String(comp.name || ""),
              companyAddress: String(comp.companyAddress || ""),
              taxId: String(comp.taxId || ""),
              isActive: Boolean(comp.isActive)
            };
          }
        } catch (parseError) {
          console.error("❌ Error parseando respuesta:", parseError);
        }
      }
      
      console.log("📋 Datos parseados:", companyData);
      
      if (companyData && companyData.companyId > 0) {
          console.log("✅ Empresa encontrada:", companyData);
          setCompany(companyData);
          setDebugMsg(`✅ ${companyData.name} (ID: ${companyData.companyId})`);
      } else {
          console.log("❌ No se encontró empresa válida");
          setCompany(null);
          setDebugMsg("❌ Sin empresa registrada");
      }
    } catch (err: any) {
      console.error("❌ Error al buscar empresa:", err);
      
      if (err.reason?.includes("No company registered") || err.message?.includes("No company registered")) {
          setDebugMsg("❌ Sin empresa registrada");
          setCompany(null);
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('network')) {
          setDebugMsg("❌ Error de red - Verifica que Anvil esté corriendo");
      } else if (err.code === -32603) {
          setDebugMsg("❌ Error RPC - Verifica que Anvil esté corriendo");
      } else {
          setDebugMsg(`❌ Error: ${err.reason || err.message}`);
          setCompany(null);
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchCompany();
    }
  }, [isConnected, address]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !formData.name.trim() || !formData.taxId.trim()) return;

    try {
      setLoading(true);
      setDebugMsg("📤 Enviando transacción...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        signer
      );

      console.log("📤 Registrando empresa:", {
        name: formData.name,
        taxId: formData.taxId,
        from: address
      });
      
      const tx = await contract.registerCompany(formData.name, formData.taxId);
      setDebugMsg("⏳ Esperando confirmación...");
      console.log("📤 Transacción enviada:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("✅ Transacción confirmada:", receipt);
      
      setDebugMsg("🎉 ¡Empresa registrada!");
      
      // Limpiar formulario
      setFormData({ name: "", taxId: "" });
      
      // Esperar un momento y recargar empresa
      setTimeout(async () => {
        await fetchCompany();
      }, 2000);
      
    } catch (err: any) {
      console.error("❌ Error en registro:", err);
      
      if (err.reason?.includes("already has") || err.message?.includes("already has")) {
          setDebugMsg("⚠️ Ya tienes empresa - Cargando...");
          // Intentar cargar la empresa existente inmediatamente
          setTimeout(async () => {
            await fetchCompany();
          }, 500);
      } else {
          const errorMsg = err.reason || err.message || "Error desconocido";
          setDebugMsg(`❌ Error: ${errorMsg}`);
          alert(`Error al registrar empresa: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || needsReconnection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center p-12 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full mx-4">
          <div className="bg-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2 text-slate-800 tracking-tight">AdminPortal</h1>
          <p className="text-slate-600 text-sm mb-6">Para usar una cuenta diferente, primero autorízala en MetaMask</p>
          <div className="space-y-3">
            <button onClick={connect} className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-lg">
              <Wallet className="w-6 h-6" /> Conectar Wallet
            </button>
            <button 
              onClick={() => window.open('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#settings/networks', '_blank')}
              className="w-full text-blue-600 text-sm hover:underline"
            >
              ¿No aparece tu cuenta? Abre MetaMask para cambiar cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 text-slate-900">
      {/* Banner de reconexión persistente */}
      {needsReconnection && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white p-3 z-50 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-pulse">⚠️</div>
              <span className="font-bold">Cambio de cuenta detectado - Necesitas reconectar</span>
            </div>
            <button 
              onClick={connect}
              className="bg-white text-amber-600 px-4 py-1 rounded-lg font-bold hover:bg-amber-50 transition-colors"
            >
              Conectar Nueva Cuenta
            </button>
          </div>
        </div>
      )}
      
      <div className={`max-w-4xl mx-auto ${needsReconnection ? 'mt-16' : ''}`}>
        <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg"><Building2 className="text-white w-6 h-6" /></div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Admin<span className="text-blue-600">Portal</span></h1>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-mono font-medium text-slate-600">{address?.slice(0,6)}...{address?.slice(-4)}</span>
                    </div>
                    <button 
                        onClick={disconnect}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                        title="Desconectar y revocar permisos"
                    >
                        Desconectar
                    </button>
                </div>
                <button 
                    onClick={fetchCompany} 
                    className="text-[9px] uppercase font-bold text-blue-500 flex items-center gap-1 hover:underline"
                >
                    <RefreshCcw className="w-2 h-2" /> {debugMsg}
                </button>
                <a href="/debug" className="text-[8px] uppercase font-bold text-red-500 hover:underline">
                    DEBUG
                </a>
            </div>
        </header>

        {company ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
                            <p className="text-slate-500 text-sm">Empresa: <span className="font-bold text-slate-700">{company.name}</span></p>
                            <p className="text-slate-400 text-xs">ID: {company.companyId} | CIF: {company.taxId}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 uppercase">
                            {company.isActive ? "Activa" : "Inactiva"}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/products" className="group bg-blue-600 p-8 rounded-2xl text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                            <Package className="w-10 h-10 mb-4" />
                            <h3 className="text-xl font-bold">Gestionar Productos</h3>
                            <p className="text-blue-100 text-sm mt-1">Añade stock y cambia precios de tu inventario.</p>
                        </Link>
                        <div className="bg-slate-800 p-8 rounded-2xl text-white hover:bg-slate-700 transition-all">
                            <Link href="/invoices" className="block">
                                <FileText className="w-10 h-10 mb-4" />
                                <h3 className="text-xl font-bold">Facturación</h3>
                                <p className="text-slate-300 text-sm mt-1">Ver facturas y estado de pagos.</p>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="max-w-md mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">Registra tu Negocio</h2>
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Empresa</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Ej: Mi Tienda Digital" 
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">CIF / ID Fiscal</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Ej: ES12345678Z" 
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500" 
                                value={formData.taxId} 
                                onChange={e => setFormData({...formData, taxId: e.target.value})} 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || !formData.name.trim() || !formData.taxId.trim()} 
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Procesando..." : "Completar Registro"}
                        </button>
                    </form>
                    
                    {/* Debug info */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-600">
                            <strong>Debug:</strong> {debugMsg}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Wallet: {address?.slice(0, 10)}...{address?.slice(-6)}
                        </p>
                    </div>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase">
                    Abre la consola del navegador (F12) para ver logs detallados
                </p>
            </div>
        )}
      </div>
    </div>
  );
}