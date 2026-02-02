"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ExternalLink, ShoppingBag } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const txHash = searchParams.get("tx");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-2">¡Compra Exitosa!</h1>
        <p className="text-slate-500 mb-8 font-medium">Tu pedido ha sido procesado y el pago se ha confirmado en la blockchain.</p>

        {txHash && (
          <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recibo de Transacción</p>
            <div className="flex items-center justify-between gap-2 overflow-hidden">
              <span className="font-mono text-[10px] text-slate-600 truncate flex-1">{txHash}</span>
              <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0" />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link 
            href="/" 
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" /> Volver a la Tienda
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-2">
        SISTEMA DE E-COMMERCE WEB3 SEGURO
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Cargando Recibo...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
