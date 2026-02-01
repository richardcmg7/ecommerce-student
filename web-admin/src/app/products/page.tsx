"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ECOMMERCE_ABI } from "@/lib/constants";
import { Package, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const { address, isConnected } = useWallet();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageHash: "QmPlaceholder" // Simplificado por ahora
  });

  const fetchProducts = async () => {
    if (!address || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        provider
      );
      
      const list = await contract.getMyProducts();
      setProducts(list);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchProducts();
    }
  }, [isConnected, address]);

  const handleAddProduct = async (e: React.FormEvent) => {
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

      // Convertir precio a formato contrato (asumimos 6 decimales como el EuroToken)
      // Ejemplo: input "10.50" -> 10500000
      const priceInUnits = ethers.parseUnits(formData.price, 6);

      const tx = await contract.addProduct(
        formData.name,
        formData.description,
        priceInUnits,
        Number(formData.stock),
        formData.imageHash
      );
      
      await tx.wait();
      
      // Reset y recargar
      setShowForm(false);
      setFormData({ name: "", description: "", price: "", stock: "", imageHash: "QmPlaceholder" });
      fetchProducts();
      
    } catch (err) {
      console.error(err);
      alert("Error al crear producto");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <div className="p-8 text-center">Conecta tu wallet primero.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-gray-200 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Package /> Gestión de Productos
                </h1>
            </div>
            <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
            >
                <Plus className="w-5 h-5" /> {showForm ? "Cancelar" : "Nuevo Producto"}
            </button>
        </header>

        {showForm && (
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-indigo-100">
                <h3 className="font-bold mb-4 text-lg">Agregar Producto</h3>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs uppercase text-gray-500 mb-1">Nombre</label>
                        <input required className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs uppercase text-gray-500 mb-1">Stock</label>
                        <input required type="number" className="w-full p-2 border rounded" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                         <label className="block text-xs uppercase text-gray-500 mb-1">Descripción</label>
                         <textarea required className="w-full p-2 border rounded" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-xs uppercase text-gray-500 mb-1">Precio (€)</label>
                         <input required type="number" step="0.01" className="w-full p-2 border rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-xs uppercase text-gray-500 mb-1">Imagen (IPFS Hash)</label>
                         <input className="w-full p-2 border rounded bg-gray-100" value={formData.imageHash} readOnly title="Placeholder" />
                    </div>
                    <div className="col-span-2 mt-2">
                        <button disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 w-full disabled:opacity-50">
                            {loading ? "Guardando en Blockchain..." : "Guardar Producto"}
                        </button>
                    </div>
                </form>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p: any) => (
                <div key={p.productId} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{p.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {p.isActive ? "ACTIVO" : "INACTIVO"}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{p.description}</p>
                    <div className="flex justify-between items-end border-t pt-4">
                        <div>
                            <p className="text-xs text-gray-400">Precio</p>
                            <p className="font-mono font-bold text-xl">€{ethers.formatUnits(p.price, 6)}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-gray-400">Stock</p>
                             <p className="font-mono font-bold">{p.stock.toString()} u.</p>
                        </div>
                    </div>
                </div>
            ))}
            {products.length === 0 && !loading && (
                <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                    No tienes productos registrados aún.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
