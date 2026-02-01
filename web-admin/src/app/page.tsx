"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ECOMMERCE_ABI } from "@/lib/constants";
import { Building2, Wallet } from "lucide-react";

export default function Home() {
  const { address, isConnected, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", taxId: "" });

  const fetchCompany = async () => {
    if (!address || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        provider
      );
      
      const comp = await contract.getMyCompany();
      setCompany(comp);
    } catch (err) {
      // Si falla es probable que no tenga empresa (o error de red)
      console.log("No company found or error:", err);
      setCompany(null);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchCompany();
    }
  }, [isConnected, address]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        signer
      );

      const tx = await contract.registerCompany(formData.name, formData.taxId);
      await tx.wait();
      
      await fetchCompany(); // Recargar datos
    } catch (err) {
      console.error(err);
      alert("Error al registrar empresa");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <Building2 className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Panel de Administración</h1>
          <p className="text-gray-500 mb-6">Gestiona tu negocio en la Blockchain</p>
          <button 
            onClick={connect}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Wallet className="w-5 h-5" /> Conectar Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 /> Dashboard
            </h1>
            <div className="text-sm bg-white px-3 py-1 rounded border">
                {address?.slice(0,6)}...{address?.slice(-4)}
            </div>
        </header>

        {company ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-4">Mi Empresa</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase">Nombre</label>
                        <p className="text-lg font-medium">{company.name}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase">ID Fiscal</label>
                        <p className="text-lg font-medium">{company.taxId}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase">Estado</label>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold mt-1">
                            {company.isActive ? "ACTIVA" : "INACTIVA"}
                        </span>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t">
                    <h3 className="font-bold mb-4">Accesos Rápidos</h3>
                    <div className="flex gap-4">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                            Gestionar Productos
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50">
                            Ver Facturas
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg mx-auto">
                <h2 className="text-xl font-bold mb-6 text-center">Registra tu Negocio</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre de la Empresa</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-2 border rounded"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ID Fiscal (Tax ID)</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-2 border rounded"
                            value={formData.taxId}
                            onChange={e => setFormData({...formData, taxId: e.target.value})}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 font-bold disabled:opacity-50"
                    >
                        {loading ? "Registrando..." : "Crear Empresa"}
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}