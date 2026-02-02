import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [needsReconnection, setNeedsReconnection] = useState(false);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      console.log("🔌 Intentando conectar wallet...");
      
      // Forzar que MetaMask muestre el popup de selección de cuenta
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Usar eth_requestAccounts con parámetros para forzar popup
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
        params: []
      });
      
      console.log("📋 Cuentas disponibles:", accounts);
      
      if (accounts.length > 0) {
        console.log("✅ Conectando con:", accounts[0]);
        setAddress(accounts[0]);
        setIsConnected(true);
        setNeedsReconnection(false);
        setIsManuallyDisconnected(false);
        // Limpiar el flag de desconexión manual
        localStorage.removeItem('wallet_manually_disconnected');
      }
    } catch (error) {
      console.error("❌ Error connecting wallet:", error);
      
      // Si el usuario rechaza la conexión
      if (error.code === 4001) {
        console.log("👤 Usuario rechazó la conexión");
      }
    }
  };

  const revokePermissions = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      console.log("🔐 Revocando permisos de MetaMask...");
      
      // Revocar permisos usando wallet_revokePermissions
      await window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [
          {
            eth_accounts: {}
          }
        ]
      });
      
      console.log("✅ Permisos revocados exitosamente");
      
    } catch (error) {
      console.error("❌ Error revocando permisos:", error);
      
      if (error.code === -32601) {
        // Método no soportado, usar alternativa
        console.log("⚠️ Método no soportado, desconectando localmente");
      }
    } finally {
      // Siempre limpiar estado local
      setAddress(null);
      setIsConnected(false);
      setNeedsReconnection(false);
      setIsManuallyDisconnected(true);
      localStorage.setItem('wallet_manually_disconnected', 'true');
      console.log("🔌 Wallet desconectada y permisos revocados");
    }
  };

  useEffect(() => {
    // Verificar si fue desconectado manualmente al cargar
    const wasManuallyDisconnected = localStorage.getItem('wallet_manually_disconnected') === 'true';
    if (wasManuallyDisconnected) {
      setIsManuallyDisconnected(true);
      return; // No conectar automáticamente
    }

    if (typeof window !== "undefined" && window.ethereum && !isManuallyDisconnected) {
       // Check connection on load
       const provider = new ethers.BrowserProvider(window.ethereum);
       provider.listAccounts().then((accounts) => {
         if (accounts.length > 0) {
           setAddress(accounts[0].address);
           setIsConnected(true);
         }
       }).catch(console.error);

       // Verificar cuenta activa cada 2 segundos (solo si no está desconectado manualmente)
       const checkActiveAccount = async () => {
         if (isManuallyDisconnected) return;
         
         try {
           const provider = new ethers.BrowserProvider(window.ethereum);
           const accounts = await provider.listAccounts();
           if (accounts.length > 0) {
             const currentAccount = accounts[0].address;
             if (address && address.toLowerCase() !== currentAccount.toLowerCase()) {
               console.log("🔄 Cambio de cuenta detectado por polling:", currentAccount);
               setNeedsReconnection(true);
               setIsConnected(false);
             }
           }
         } catch (err) {
           console.error("Error checking account:", err);
         }
       };

       // Verificar cada 2 segundos
       const interval = setInterval(checkActiveAccount, 2000);

       // Listen for account changes (backup)
       const handleAccountsChanged = async (accounts: string[]) => {
          if (isManuallyDisconnected) return;
          
          console.log("🔄 Evento accountsChanged:", accounts);
          if (accounts.length > 0) {
             const newAddress = accounts[0];
             console.log("🔄 Nueva dirección por evento:", newAddress);
             
             if (address && address.toLowerCase() !== newAddress.toLowerCase()) {
               console.log("⚠️ Cambio de cuenta por evento, requiere reconexión");
               setNeedsReconnection(true);
               setIsConnected(false);
             } else {
               setAddress(newAddress);
               setIsConnected(true);
             }
          } else {
             setAddress(null);
             setIsConnected(false);
             setNeedsReconnection(false);
          }
       };

       window.ethereum.on('accountsChanged', handleAccountsChanged);

       // Cleanup
       return () => {
          clearInterval(interval);
          if (window.ethereum?.removeListener) {
             window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          }
       };
    }
  }, [address, isManuallyDisconnected]);

  const disconnect = async () => {
    // Primero revocar permisos
    await revokePermissions();
  };

  return { address, isConnected, connect, needsReconnection, disconnect, revokePermissions };
}
