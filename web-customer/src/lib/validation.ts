// Validaciones y utilidades para el sistema

export function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
  }

  return {
    ecommerceAddress: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS!,
    euroTokenAddress: process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS!
  };
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatError(error: any): string {
  if (error.reason) return error.reason;
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Error desconocido';
}

export function isContractError(error: any): boolean {
  return error.code === 'CALL_EXCEPTION' || 
         error.reason?.includes('execution reverted') ||
         error.message?.includes('execution reverted');
}