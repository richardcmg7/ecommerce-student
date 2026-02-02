"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ECOMMERCE_ABI } from "@/lib/constants";
import { FileText, ArrowLeft, Eye, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function InvoicesPage() {
  const { address, isConnected } = useWallet();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider("http://localhost:8545");
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || "", 
        ECOMMERCE_ABI, 
        provider
      );

      // Obtener la empresa
      const company = await contract.getMyCompany.staticCall({ from: address });
      const companyId = Number(company[0]);
      
      console.log("🏢 Empresa encontrada:", { companyId, address });
      
      if (companyId === 0) {
        console.log("❌ No company found");
        return;
      }

      // Obtener eventos de facturas creadas para esta empresa
      console.log("🔍 Buscando eventos de facturas...");
      const filter = contract.filters.InvoiceCreated();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      console.log("📋 Eventos encontrados:", events.length);
      
      const processedInvoices = [];
      for (const event of events) {
        try {
          // Verificar que es un EventLog y no un Log
          if ('args' in event) {
            const invoiceId = Number(event.args.invoiceId);
            console.log("🔍 Procesando factura ID:", invoiceId);
            
            // Obtener detalles completos de la factura
            const invoice = await contract.getInvoice(invoiceId);
            console.log("📄 Detalles de factura:", {
              invoiceId: Number(invoice.invoiceId),
              companyId: Number(invoice.companyId),
              customer: invoice.customerAddress,
              ourCompanyId: companyId
            });
            
            // Solo incluir facturas de nuestra empresa
            if (Number(invoice.companyId) === companyId) {
              console.log("✅ Factura incluida:", invoiceId);
              processedInvoices.push({
                invoiceId: Number(invoice.invoiceId),
                companyId: Number(invoice.companyId),
                customer: invoice.customerAddress,
                totalAmount: invoice.totalAmount,
                isPaid: invoice.isPaid,
                createdAt: Number(invoice.timestamp),
                items: invoice.productIds || []
              });
            } else {
              console.log("❌ Factura excluida (empresa diferente):", invoiceId);
            }
          }
        } catch (err) {
          console.error("❌ Error processing invoice event:", err);
        }
      }
      
      console.log("📊 Total facturas procesadas:", processedInvoices.length);
      
      setInvoices(processedInvoices);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchInvoices();
    }
  }, [isConnected, address]);

  const formatPrice = (price: any) => {
    try {
      return ethers.formatUnits(price, 6);
    } catch (e) {
      return "0.00";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (isPaid: boolean) => {
    return isPaid ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <Clock className="w-5 h-5 text-yellow-500" />
    );
  };

  const getStatusText = (isPaid: boolean) => {
    return isPaid ? "Pagada" : "Pendiente";
  };

  const getStatusColor = (isPaid: boolean) => {
    return isPaid ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Conecta tu wallet</h1>
          <p className="text-slate-600">Necesitas conectar tu wallet para ver las facturas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Facturación
              </h1>
              <p className="text-slate-600 mt-1">Gestiona las facturas de tu empresa</p>
            </div>
          </div>
          <button 
            onClick={fetchInvoices}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        {/* Lista de Facturas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Lista */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Facturas Recientes</h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No hay facturas disponibles</p>
                <p className="text-slate-400 text-sm mt-1">Las facturas aparecerán cuando los clientes realicen pedidos</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {invoices.map((invoice) => (
                  <div 
                    key={invoice.invoiceId}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-blue-300 ${
                      selectedInvoice?.invoiceId === invoice.invoiceId 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">
                          #{invoice.invoiceId.toString().padStart(4, '0')}
                        </span>
                        {getStatusIcon(invoice.isPaid)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(invoice.isPaid)}`}>
                        {getStatusText(invoice.isPaid)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">
                          Cliente: {invoice.customer.slice(0, 8)}...{invoice.customer.slice(-6)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-slate-800">
                          €{formatPrice(invoice.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel de Detalles */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Detalles de Factura</h2>
            
            {!selectedInvoice ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Selecciona una factura para ver los detalles</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header de la factura */}
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-800">
                      Factura #{selectedInvoice.invoiceId.toString().padStart(4, '0')}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(selectedInvoice.isPaid)}`}>
                      {getStatusText(selectedInvoice.isPaid)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 font-medium">Cliente</p>
                      <p className="font-mono text-slate-800">{selectedInvoice.customer}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Fecha</p>
                      <p className="text-slate-800">{formatDate(selectedInvoice.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Total</span>
                    <span className="text-2xl font-bold text-slate-800">
                      €{formatPrice(selectedInvoice.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <p><strong>ID de Empresa:</strong> {selectedInvoice.companyId}</p>
                  <p><strong>Estado de Pago:</strong> {selectedInvoice.isPaid ? 'Completado' : 'Pendiente'}</p>
                  <p><strong>Timestamp:</strong> {selectedInvoice.createdAt}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}