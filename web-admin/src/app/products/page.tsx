"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ECOMMERCE_ABI } from "@/lib/constants";
import { Package, Plus, ArrowLeft, Image as ImageIcon, Tag, Hash, Info, X, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const { address, isConnected } = useWallet();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<string>("Iniciando...");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageHash: "QmPlaceholder"
  });

  const fetchProducts = useCallback(async () => {
    if (!address || !window.ethereum) return;
    setStatus("Buscando productos...");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        provider
      );
      
      console.log("Cargando catálogo completo...");
      // Forzamos la carga de TODOS los productos del contrato para asegurar visibilidad
      const list = await contract.getAllProducts();

      const cleanList = list.map((p: any) => ({
          productId: p.productId,
          companyId: p.companyId,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          isActive: p.isActive
      }));

      setProducts(cleanList);
      setStatus("Sincronizado (" + cleanList.length + " productos)");
    } catch (err: any) {
      console.error("Error cargando productos:", err);
      setStatus("Error de sincronización");
    }
  }, [address]);

  useEffect(() => {
    if (isConnected) {
      fetchProducts();
    }
  }, [isConnected, fetchProducts]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    try {
      setLoading(true);
      setStatus("Enviando producto a la red...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        signer
      );

      const priceInUnits = ethers.parseUnits(formData.price, 6);

      const tx = await contract.addProduct(
        formData.name,
        formData.description,
        priceInUnits,
        Number(formData.stock),
        formData.imageHash
      );
      
      setStatus("Esperando confirmación (Block: " + tx.hash.slice(0,10) + ")...");
      await tx.wait();
      
      setShowForm(false);
      setFormData({ name: "", description: "", price: "", stock: "", imageHash: "QmPlaceholder" });
      fetchProducts();
      setStatus("¡Producto guardado!");
    } catch (err: any) {
      console.error(err);
      setStatus("Fallo al guardar: " + (err.reason || "Error de transacción"));
      alert("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return <div className="p-20 text-center font-bold text-slate-500">Conecta tu wallet.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-10 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-sm transition-all text-slate-600">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Package className="text-blue-600" /> Inventario
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span className={`w-2 h-2 rounded-full ${status.includes("Error") ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        {status}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={fetchProducts} className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm text-slate-400">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                    {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showForm ? "Cerrar" : "Nuevo Producto"}
                </button>
            </div>
        </header>

        {showForm && (
            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 mb-12">
                <h3 className="font-extrabold text-xl mb-6">Añadir Nuevo Producto</h3>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Nombre</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Stock</label>
                        <input required type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Descripción</label>
                        <textarea required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Precio (€)</label>
                        <input required type="number" step="0.01" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 font-mono font-bold" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div className="pt-4 col-span-2">
                        <button disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-xl shadow-slate-200 disabled:opacity-50">
                            {loading ? "Procesando..." : "Publicar Producto"}
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((p: any) => (
                <div key={p.productId} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 overflow-hidden">
                    <h3 className="font-black text-slate-800 text-xl mb-1">{p.name}</h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{p.description}</p>
                    <div className="flex justify-between items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Precio</p>
                            <p className="font-mono font-black text-xl">€{ethers.formatUnits(p.price, 6)}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stock</p>
                             <p className="font-mono font-bold">{p.stock.toString()} u.</p>
                        </div>
                    </div>
                </div>
            ))}
            {products.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <Package className="text-slate-200 w-16 h-16 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">No tienes productos todavía.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}