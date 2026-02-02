# 🛒 E-Commerce Web3 con Stablecoins

Sistema completo de comercio electrónico basado en blockchain que integra stablecoins, smart contracts y aplicaciones web modernas.

## 🚀 Inicio Rápido

```bash
# Opción 1: Script inteligente (recomendado)
./start.sh

# Opción 2: Reinicio completo
./restart-all.sh

# Opción 3: Verificar y reiniciar si es necesario
./quick-restart.sh
```

### 🔄 Persistencia Automática

El sistema ahora mantiene automáticamente el estado de la blockchain:
- **Contratos desplegados** se mantienen entre reinicios
- **Balances de cuentas** se preservan
- **Transacciones** se guardan en `.anvil-state/blockchain.json`

### 📱 Scripts Disponibles

- `./start.sh` - **Inicio inteligente** (detecta estado y actúa en consecuencia)
- `./restart-all.sh` - Reinicio completo del sistema
- `./quick-restart.sh` - Verificación y reinicio inteligente
- `./check-my-balances.sh` - Verificar balances de tus cuentas
- `./setup-dev-data.sh` - Configurar datos de prueba
- `./stop-anvil.sh` - Detener Anvil guardando estado
- `./verify-system.sh` - Verificar estado del sistema

## 🌐 Aplicaciones

- **Web Admin**: http://localhost:6003 - Panel de administración para empresas
- **Web Customer**: http://localhost:6004 - Tienda online para clientes  
- **Compra Stablecoin**: http://localhost:6001 - Compra tokens con Stripe
- **Pasarela de Pago**: http://localhost:6002 - Procesamiento de pagos crypto

## 🏗️ Arquitectura

### Smart Contracts
- **EuroToken** (EURT): Stablecoin respaldado por euros (6 decimales)
- **USDT**: Stablecoin respaldado por dólares (4 decimales)
- **Ecommerce**: Contrato principal con gestión de empresas, productos, carritos e invoices

### Frontend
- **Next.js 15** con TypeScript
- **Tailwind CSS** para estilos
- **Ethers.js v6** para interacción blockchain
- **Stripe** para pagos fiat

### Blockchain
- **Foundry/Forge** para desarrollo de contratos
- **Anvil** para blockchain local
- **OpenZeppelin** para contratos seguros

## 📋 Requisitos

- Node.js 18+
- Foundry (forge, anvil, cast)
- MetaMask u otra wallet compatible

## 🔧 Instalación Manual

```bash
# 1. Instalar dependencias de aplicaciones web
cd web-admin && npm install && cd ..
cd web-customer && npm install && cd ..
cd stablecoin/compra-stablecoin && npm install && cd ../..
cd stablecoin/pasarela-de-pago && npm install && cd ../..

# 2. Compilar contratos
cd sc-ecommerce && forge build && cd ..
cd stablecoin/sc && forge build && cd ../..

# 3. Ejecutar tests
cd sc-ecommerce && forge test && cd ..
cd stablecoin/sc && forge test && cd ../..
```

## 🧪 Testing

### Tests Automatizados
```bash
# Test completo del sistema
./test-complete-system.sh

# Solo tests de smart contracts
cd sc-ecommerce && forge test -vv
cd stablecoin/sc && forge test -vv
```

### Tests Manuales
1. Lee `GUIA_PRUEBAS.md` para instrucciones paso a paso
2. Usa las cuentas preconfiguradas
3. Sigue el flujo completo de compra

## 🔑 Cuentas de Prueba

### Empresa (Admin)
- **Dirección**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Clave**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Balance**: 10,000 EURT

### Cliente
- **Dirección**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`  
- **Clave**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **Balance**: 5,000 EURT

## 🛍️ Productos de Ejemplo

1. **Laptop Gaming** - €1,500 (Stock: 5)
2. **Mouse Gaming** - €75 (Stock: 20)
3. **Teclado Mecánico** - €120 (Stock: 15)
4. **Monitor 4K** - €350 (Stock: 8)
5. **Auriculares Gaming** - €95 (Stock: 12)

## 🔄 Flujo de Usuario

### Para Empresas (Web Admin)
1. Conectar MetaMask
2. Registrar empresa
3. Agregar productos
4. Gestionar inventario
5. Ver facturas y ventas

### Para Clientes (Web Customer)
1. Navegar catálogo
2. Agregar productos al carrito
3. Realizar checkout
4. Pagar con EURT en pasarela
5. Confirmar transacción

## 🛠️ Scripts Útiles

- `./restart-all.sh` - Inicia todo el sistema
- `./setup-dev-data.sh` - Configura datos de prueba
- `./verify-system.sh` - Verifica estado del sistema
- `./stop-system.sh` - Detiene todas las aplicaciones

## 📁 Estructura del Proyecto

```
├── sc-ecommerce/           # Smart contract principal
│   ├── src/
│   │   ├── Ecommerce.sol
│   │   └── libraries/      # Librerías modulares
│   ├── test/              # Tests unitarios e integración
│   └── script/            # Scripts de deploy
├── stablecoin/
│   ├── sc/                # Contratos de tokens
│   ├── compra-stablecoin/ # App para comprar tokens
│   └── pasarela-de-pago/  # Gateway de pagos
├── web-admin/             # Panel administrativo
├── web-customer/          # Tienda online
└── docs/                  # Documentación
```

## 🔍 Debugging

### Ver logs de blockchain
```bash
tail -f anvil.log
```

### Verificar balances
```bash
cast call $EURT_ADDR "balanceOf(address)" $ADDRESS --rpc-url http://localhost:8545
```

### Ver estado de producto
```bash
cast call $ECOMMERCE_ADDR "getProduct(uint256)" 1 --rpc-url http://localhost:8545
```

## 🚨 Solución de Problemas

### Error: "No company registered"
- Usa la cuenta correcta de empresa
- Verifica que la empresa esté registrada en el contrato

### Error: "Insufficient allowance"  
- Aprueba el gasto de tokens antes de pagar
- Verifica balance suficiente

### Aplicaciones no cargan
- Verifica que todas estén corriendo en sus puertos
- Revisa variables de entorno en archivos `.env.local`
- Confirma que Anvil esté funcionando

### MetaMask no conecta
- Configura red: localhost:8545, Chain ID: 31337
- Importa las claves privadas de prueba
- Resetea cuenta en MetaMask si es necesario

## 📚 Documentación

- `GUIA_PRUEBAS.md` - Guía paso a paso para pruebas
- `RESUMEN_SOLUCION.md` - Detalles técnicos y soluciones implementadas
- `ARCHITECTURE.md` - Documentación de arquitectura
- `PROYECTO_ESTUDIANTE.md` - Especificaciones originales del proyecto

## 🔐 Seguridad

### Smart Contracts
- Control de acceso con OpenZeppelin
- Validación de parámetros
- Protección contra reentrancy
- Tests de seguridad incluidos

### Aplicaciones Web
- Validación de variables de entorno
- Manejo seguro de claves privadas
- Verificación de red blockchain
- Timeouts y manejo de errores

## 🚀 Despliegue en Producción

### Preparación
1. Configurar claves reales de Stripe
2. Deploy en testnet (Sepolia/Goerli)
3. Configurar IPFS para imágenes
4. Setup de dominio y SSL

### Variables de Entorno Producción
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Ejecuta los tests: `./test-complete-system.sh`
4. Commit tus cambios
5. Push a la rama
6. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras problemas:

1. Revisa `RESUMEN_SOLUCION.md` para problemas conocidos
2. Ejecuta `./verify-system.sh` para diagnóstico
3. Revisa los logs en `anvil.log`
4. Abre un issue con detalles del error

---

**¡El sistema está listo para usar! 🎉**

Ejecuta `./restart-all.sh` y comienza a explorar el futuro del e-commerce descentralizado.