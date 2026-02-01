"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ECOMMERCE_ABI } from "@/lib/constants";
import { ShoppingCart, ShoppingBag, Wallet, ExternalLink } from "lucide-react";

export default function Home() {
  const { address, isConnected, connect } = useWallet();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      // Usar provider público (o Anvil) para ver productos sin wallet
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        provider
      );
      
      const list = await contract.getAllProducts();
      setProducts(list);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
        const existing = prev.find(item => item.productId === product.productId);
        if (existing) {
            return prev.map(item => item.productId === product.productId 
                ? {...item, quantity: item.quantity + 1} 
                : item
            );
        }
        return [...prev, {...product, quantity: 1}];
    });
  };

  const handleCheckout = async (companyId: number) => {
    if (!isConnected) {
        await connect();
        return;
    }

    try {
        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
            process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
            ECOMMERCE_ABI, 
            signer
        );

        // 1. Sincronizar carrito con Blockchain (llamadas addToCart)
        // En un ecommerce real, esto se optimizaría, pero seguimos el flujo del SC
        const companyItems = cart.filter(item => item.companyId === companyId);
        for(const item of companyItems) {
            const tx = await contract.addToCart(item.productId, item.quantity);
            await tx.wait();
        }

        // 2. Ejecutar Checkout para crear Invoice
        const txCheckout = await contract.checkout(companyId);
        const receipt = await txCheckout.wait();
        
        // Obtener InvoiceId del evento (simplificado: asumimos éxito)
        alert("¡Checkout exitoso! Redirigiendo a pasarela...");
        
        // 3. Redirigir a Pasarela (Parte 3)
        // Calculamos total para la URL
        const total = companyItems.reduce((acc, item) => acc + (Number(ethers.formatUnits(item.price, 6)) * item.quantity), 0);
        
        // Simulamos el ID de factura (en prod vendría del evento)
        const invoiceId = 1; 

        const gatewayUrl = `http://localhost:6002/?amount=${total}&merchant_address=0x_merchant&invoice=${invoiceId}&redirect=http://localhost:6004/success`;
        window.location.href = gatewayUrl;

    } catch (err) {
        console.error(err);
        alert("Error en el checkout");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-10 px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2">
            <ShoppingBag /> BLOCK-STORE
        </h1>
        <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-600 hover:text-indigo-600">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                )}
            </button>
            {!isConnected ? (
                <button onClick={connect} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Conectar
                </button>
            ) : (
                <div className="text-xs bg-gray-100 px-3 py-1 rounded-full font-mono">
                    {address?.slice(0,6)}...{address?.slice(-4)}
                </div>
            )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Catálogo */}
        <div className="lg:col-span-3">
            <h2 className="text-xl font-bold mb-6">Productos Destacados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((p: any) => (
                    <div key={p.productId} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl transition-all group">
                        <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                            <span className="text-gray-400">Imagen IPFS</span>
                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-[10px] font-bold">
                                STOCK: {p.stock.toString()}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                                <p className="font-mono font-bold text-xl text-indigo-600">€{ethers.formatUnits(p.price, 6)}</p>
                            </div>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2">{p.description}</p>
                            <button 
                                onClick={() => addToCart(p)}
                                disabled={Number(p.stock) === 0}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <PlusIcon className="w-4 h-4" /> Añadir al Carrito
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Sidebar Carrito */}
        <aside className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Mi Carrito
            </h2>
            {cart.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Tu carrito está vacío</p>
            ) : (
                <div className="space-y-4">
                    {cart.map((item) => (
                        <div key={item.productId} className="flex justify-between items-center text-sm border-b pb-2">
                            <div>
                                <p className="font-bold">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.quantity} x €{ethers.formatUnits(item.price, 6)}</p>
                            </div>
                            <p className="font-mono font-bold">€{(Number(ethers.formatUnits(item.price, 6)) * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                    <div className="pt-4 border-t-2">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-bold">Total</span>
                            <span className="text-2xl font-black text-indigo-600 font-mono">
                                €{cart.reduce((acc, item) => acc + (Number(ethers.formatUnits(item.price, 6)) * item.quantity), 0).toFixed(2)}
                            </span>
                        </div>
                        <button 
                            onClick={() => handleCheckout(Number(cart[0].companyId))}
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                        >
                            {loading ? "Procesando..." : "Realizar Pedido"} <ExternalLink className="w-4 h-4" />
                        </button>
                        <p className="text-[10px] text-gray-400 mt-4 text-center">
                            Al hacer checkout, se creará una factura en la blockchain y serás redirigido al pago.
                        </p>
                    </div>
                </div>
            )}
        </aside>
      </main>
    </div>
  );
}

function PlusIcon(props: any) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    )
}