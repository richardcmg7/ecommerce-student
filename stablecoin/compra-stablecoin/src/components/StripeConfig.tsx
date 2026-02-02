"use client";

import { useState } from "react";

export default function StripeConfig() {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    secretKey: process.env.STRIPE_SECRET_KEY || ""
  });

  const isConfigured = config.publishableKey.startsWith("pk_test_") && 
                      config.secretKey.startsWith("sk_test_");

  if (isConfigured) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-yellow-800">⚠️ Configuración de Stripe Requerida</h3>
          <p className="text-sm text-yellow-700">
            Para usar pagos con tarjeta, configura tus claves de Stripe.
          </p>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="text-yellow-600 hover:text-yellow-800 font-bold text-sm"
        >
          {showConfig ? "Ocultar" : "Configurar"}
        </button>
      </div>
      
      {showConfig && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-yellow-700 mb-1">
              Publishable Key (pk_test_...)
            </label>
            <input 
              type="text"
              placeholder="pk_test_..."
              className="w-full p-2 text-xs border border-yellow-300 rounded"
              value={config.publishableKey}
              onChange={(e) => setConfig({...config, publishableKey: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-yellow-700 mb-1">
              Secret Key (sk_test_...)
            </label>
            <input 
              type="password"
              placeholder="sk_test_..."
              className="w-full p-2 text-xs border border-yellow-300 rounded"
              value={config.secretKey}
              onChange={(e) => setConfig({...config, secretKey: e.target.value})}
            />
          </div>
          <div className="text-xs text-yellow-600">
            <p>1. Crea una cuenta en <a href="https://stripe.com" target="_blank" className="underline">stripe.com</a></p>
            <p>2. Ve a Developers → API Keys</p>
            <p>3. Copia las claves de prueba aquí</p>
            <p>4. Actualiza tu archivo .env.local</p>
          </div>
        </div>
      )}
    </div>
  );
}