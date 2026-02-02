"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ECOMMERCE_ABI } from "@/lib/constants";
import { ShoppingCart, ShoppingBag, Wallet, ExternalLink, Plus, Package } from "lucide-react";

export default function Home() {
  const { address, isConnected, connect, needsReconnection, disconnect } = useWallet();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const fetchProducts = useCallback(async () => {
    try {
      setStatus("Cargando productos...");
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        provider
      );
      
      const list = await contract.getAllProducts();
      
      // Convertir cada producto a un objeto plano de JS para evitar problemas con proxies de ethers
      const validProducts = list.map((p: any) => ({
          productId: p.productId,
          companyId: p.companyId,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          isActive: p.isActive
      })).filter((p: any) => p.productId !== undefined && p.price !== undefined);
      
      setProducts(validProducts);
      setStatus("");
    } catch (err) {
      console.error("Error fetching products:", err);
      setStatus("Error al cargar productos");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product: any) => {
    if (!product || product.productId === undefined) return;
    
    setCart(prev => {
        const existing = prev.find(item => item.productId.toString() === product.productId.toString());
        if (existing) {
            return prev.map(item => item.productId.toString() === product.productId.toString() 
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

        const companyItems = cart.filter(item => Number(item.companyId) === companyId);
        
        setStatus("Registrando carrito...");
        for(const item of companyItems) {
            const tx = await contract.addToCart(item.productId, item.quantity);
            await tx.wait();
        }

        setStatus("Creando factura...");
        const txCheckout = await contract.checkout(companyId);
        const receipt = await txCheckout.wait();
        
        // Extraer InvoiceId de los logs de la transacción
        let invoiceId = 1; 
        try {
            // Buscamos el log que coincida con el evento InvoiceCreated
            const event = receipt.logs.find((log: any) => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed?.name === "InvoiceCreated";
                } catch(e) { return false; }
            });
            
            if (event) {
                const parsedLog = contract.interface.parseLog(event);
                invoiceId = Number(parsedLog?.args.invoiceId);
                console.log("ID de factura generado:", invoiceId);
            }
        } catch (e) {
            console.error("No se pudo extraer invoiceId, usando fallback:", e);
        }
        
        const total = companyItems.reduce((acc, item) => {
            const price = item.price ? ethers.formatUnits(item.price, 6) : "0";
            return acc + (Number(price) * item.quantity);
        }, 0);
        
        alert(`¡Checkout exitoso! Factura #${invoiceId} creada.`);
        
        // Añadimos un timestamp para evitar que el navegador cachee la redirección
        const now = Date.now();
        const gatewayUrl = `http://localhost:6002/?amount=${total}&merchant_address=0x_merchant&invoice=${invoiceId}&token=EURT&t=${now}&redirect=http://localhost:6004/success`;
        console.log("Redirigiendo a:", gatewayUrl);
        window.location.href = gatewayUrl;

    } catch (err) {
        console.error(err);
        alert("Error en el checkout");
    } finally {
        setLoading(false);
        setStatus("");
    }
  };

  const formatPrice = (price: any) => {
    if (price === undefined || price === null) return "0.00";
    try {
        return ethers.formatUnits(price, 6);
    } catch (e) {
        return "0.00";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900">
      {/* Navbar Mejorada */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-200">
                <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-800">
                BLOCK<span className="text-indigo-600">STORE</span>
            </h1>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                )}
            </button>
            {!isConnected || needsReconnection ? (
                <button onClick={connect} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                    <Wallet className="w-4 h-4" /> {needsReconnection ? 'Reconectar' : 'Conectar'}
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                            {address?.slice(0,6)}...{address?.slice(-4)}
                        </span>
                    </div>
                    <button 
                        onClick={disconnect}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
                        title="Desconectar y revocar permisos"
                    >
                        Desconectar
                    </button>
                </div>
            )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Catálogo */}
        <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Catálogo de Productos</h2>
                {status && <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest animate-pulse">{status}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.map((p: any) => (
                    <div key={p.productId.toString()} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden hover:border-indigo-300 transition-all group flex flex-col">
                        <div className="h-48 bg-slate-100 flex items-center justify-center relative border-b border-slate-50">
                            <Package className="w-12 h-12 text-slate-200 group-hover:scale-110 transition-transform" />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black border border-slate-100 shadow-sm">
                                STOCK: {p.stock.toString()}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-xl text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{p.name}</h3>
                            </div>
                            <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[40px] leading-relaxed">{p.description}</p>
                            
                            <div className="mt-auto flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Precio</p>
                                    <p className="font-mono font-black text-2xl text-slate-800">
                                        <span className="text-indigo-600 text-sm">€</span>{formatPrice(p.price)}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => addToCart(p)}
                                    disabled={Number(p.stock) === 0}
                                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-30 disabled:shadow-none"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && !status && (
                <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 mt-8">
                    <Package className="text-slate-200 w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-slate-800 font-bold text-xl">No hay productos disponibles</h3>
                    <p className="text-slate-400 mt-2 text-sm">Vuelve más tarde o contacta con el administrador.</p>
                </div>
            )}
        </div>

        {/* Sidebar Carrito Mejorada */}
        <aside className="lg:col-span-1 flex flex-col gap-6 h-fit sticky top-24">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-indigo-600" /> Mi Carrito
                </h2>
                
                {cart.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart className="text-slate-300 w-8 h-8" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">El carrito está vacío</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.map((item) => (
                                <div key={item.productId.toString()} className="flex justify-between items-center group">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-bold text-slate-700 truncate">{item.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {item.quantity} x €{formatPrice(item.price)}
                                        </p>
                                    </div>
                                    <p className="font-mono font-black text-slate-800 text-sm">
                                        €{(Number(formatPrice(item.price)) * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total</span>
                                <span className="text-3xl font-black text-indigo-600 font-mono tracking-tighter">
                                    €{cart.reduce((acc, item) => acc + (Number(formatPrice(item.price)) * item.quantity), 0).toFixed(2)}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => handleCheckout(Number(cart[0].companyId))}
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>Realizar Pedido <ExternalLink className="w-5 h-5" /></>
                                )}
                            </button>
                            
                            <div className="mt-6 flex items-start gap-2 bg-indigo-50 p-4 rounded-xl">
                                <div className="text-indigo-600 mt-0.5">
                                    <Package className="w-4 h-4" />
                                </div>
                                <p className="text-[10px] font-bold text-indigo-700 leading-tight">
                                    Se generará una factura oficial en la red y se solicitará el pago en EURT.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}
