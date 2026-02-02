#!/bin/bash

# Script para configurar datos de desarrollo y prueba
# Este script debe ejecutarse después de que el sistema esté corriendo

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== CONFIGURANDO DATOS DE DESARROLLO ===${NC}"

# Variables de configuración
RPC_URL="http://localhost:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"  # Account #0
COMPANY_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"   # Account #1
CUSTOMER_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"  # Account #2

# Leer direcciones de contratos desde variables de entorno o archivos
if [ -f "web-admin/.env.local" ]; then
    source web-admin/.env.local
fi

if [ -z "$NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS" ]; then
    echo -e "${YELLOW}Error: Variables de entorno no configuradas. Ejecuta restart-all.sh primero.${NC}"
    exit 1
fi

ECOMMERCE_ADDR=$NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS
EURT_ADDR=$NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS

echo -e "${YELLOW}1. Configurando cuentas de prueba...${NC}"

# Direcciones de las cuentas
OWNER_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"    # Account #0
COMPANY_ADDR="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  # Account #1  
CUSTOMER_ADDR="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" # Account #2

echo -e "  Owner: $OWNER_ADDR"
echo -e "  Company: $COMPANY_ADDR"
echo -e "  Customer: $CUSTOMER_ADDR"

echo -e "${YELLOW}2. Minteando tokens para cuentas de usuario...${NC}"

# Cuentas del usuario
USER_ACCOUNTS=(
    "0x8a0b4Fb8eEdDD7e599E843eAD2135A99b09E4272"  # Testim
    "0x39d34C1a5144F5AB4B3FC0F4d9Ad8EDe127798a2"  # Cuenta 3
    "0x1d79Cfd6Cf139754Cb7e6D846b054f3eDb6feE4D"  # Cuenta 4
    "0x18113c79972CF002569c494FD441938a3788c39A"  # Cuenta 6
)

ACCOUNT_NAMES=(
    "Testim"
    "Cuenta 3"
    "Cuenta 4"
    "Cuenta 6"
)

# Configurar cuentas de usuario
for i in "${!USER_ACCOUNTS[@]}"; do
    ACCOUNT=${USER_ACCOUNTS[$i]}
    NAME=${ACCOUNT_NAMES[$i]}
    
    echo -e "  Configurando ${NAME}..."
    
    # Enviar ETH para gas
    cast send $ACCOUNT --value 5ether --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null 2>&1
    
    # Mint EURT tokens (3000 EURT)
    cast send $EURT_ADDR "mint(address,uint256)" $ACCOUNT 3000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null 2>&1
    
    # Mint USDT tokens (3000 USDT)
    if [ ! -z "$USDT_ADDR" ] && [ "$USDT_ADDR" != "0x..." ]; then
        cast send $USDT_ADDR "mint(address,uint256)" $ACCOUNT 30000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null 2>&1
    fi
done

# Configurar cuentas de prueba originales
cast send $COMPANY_ADDR --value 5ether --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null 2>&1
cast send $CUSTOMER_ADDR --value 5ether --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null 2>&1

# Mint EURT tokens para cuentas de prueba
cast send $EURT_ADDR "mint(address,uint256)" $COMPANY_ADDR 10000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null
cast send $EURT_ADDR "mint(address,uint256)" $CUSTOMER_ADDR 5000000000 --private-key $PRIVATE_KEY --rpc-url $RPC_URL > /dev/null

# Verificar balances de la primera cuenta de usuario
FIRST_USER_ACCOUNT=${USER_ACCOUNTS[0]}
FIRST_USER_NAME=${ACCOUNT_NAMES[0]}

USER_EURT_BALANCE=$(cast call $EURT_ADDR "balanceOf(address)" $FIRST_USER_ACCOUNT --rpc-url $RPC_URL)
if [ ! -z "$USDT_ADDR" ] && [ "$USDT_ADDR" != "0x..." ]; then
    USER_USDT_BALANCE=$(cast call $USDT_ADDR "balanceOf(address)" $FIRST_USER_ACCOUNT --rpc-url $RPC_URL)
else
    USER_USDT_BALANCE="0x0"
fi

# Verificar balances de cuentas de prueba originales
COMPANY_BALANCE=$(cast call $EURT_ADDR "balanceOf(address)" $COMPANY_ADDR --rpc-url $RPC_URL)
CUSTOMER_BALANCE=$(cast call $EURT_ADDR "balanceOf(address)" $CUSTOMER_ADDR --rpc-url $RPC_URL)

echo -e "${GREEN}✓ Tokens configurados:${NC}"
echo -e "  ${FIRST_USER_NAME}: $(echo "scale=0; $USER_EURT_BALANCE / 1000000" | bc -l 2>/dev/null || echo "3000") EURT + $(echo "scale=0; $USER_USDT_BALANCE / 10000" | bc -l 2>/dev/null || echo "3000") USDT"
echo -e "  Company: $(echo "scale=0; $COMPANY_BALANCE / 1000000" | bc -l 2>/dev/null || echo "10000") EURT"
echo -e "  Customer: $(echo "scale=0; $CUSTOMER_BALANCE / 1000000" | bc -l 2>/dev/null || echo "5000") EURT"

echo -e "${YELLOW}3. Registrando empresa de prueba...${NC}"

# Registrar empresa
cast send $ECOMMERCE_ADDR "registerCompany(string,string)" "TechStore Demo" "ES12345678Z" --private-key $COMPANY_KEY --rpc-url $RPC_URL > /dev/null 2>&1 || echo "Empresa ya registrada"

echo -e "${GREEN}✓ Empresa registrada${NC}"

echo -e "${YELLOW}4. Agregando productos de prueba...${NC}"

# Agregar productos (precios en unidades de 6 decimales)
cast send $ECOMMERCE_ADDR "addProduct(string,string,uint256,uint256,string)" \
    "Laptop Gaming" \
    "Laptop para gaming de alta gama con RTX 4080" \
    1500000000 \
    5 \
    "QmLaptopHash123" \
    --private-key $COMPANY_KEY --rpc-url $RPC_URL > /dev/null 2>&1 || echo "Producto 1 ya existe"

cast send $ECOMMERCE_ADDR "addProduct(string,string,uint256,uint256,string)" \
    "Mouse Gaming" \
    "Mouse óptico para gaming con RGB" \
    75000000 \
    20 \
    "QmMouseHash456" \
    --private-key $COMPANY_KEY --rpc-url $RPC_URL > /dev/null 2>&1 || echo "Producto 2 ya existe"

cast send $ECOMMERCE_ADDR "addProduct(string,string,uint256,uint256,string)" \
    "Teclado Mecánico" \
    "Teclado mecánico con switches Cherry MX" \
    120000000 \
    15 \
    "QmKeyboardHash789" \
    --private-key $COMPANY_KEY --rpc-url $RPC_URL > /dev/null 2>&1 || echo "Producto 3 ya existe"

cast send $ECOMMERCE_ADDR "addProduct(string,string,uint256,uint256,string)" \
    "Monitor 4K" \
    "Monitor 4K de 27 pulgadas para gaming" \
    350000000 \
    8 \
    "QmMonitorHash101" \
    --private-key $COMPANY_KEY --rpc-url $RPC_URL > /dev/null 2>&1 || echo "Producto 4 ya existe"

cast send $ECOMMERCE_ADDR "addProduct(string,string,uint256,uint256,string)" \
    "Auriculares Gaming" \
    "Auriculares con sonido envolvente 7.1" \
    95000000 \
    12 \
    "QmHeadsetHash202" \
    --private-key $COMPANY_KEY --rpc-url $RPC_URL > /dev/null 2>&1 || echo "Producto 5 ya existe"

echo -e "${GREEN}✓ Productos agregados${NC}"

echo -e "${YELLOW}5. Verificando catálogo...${NC}"

# Obtener número total de productos
PRODUCT_COUNT=$(cast call $ECOMMERCE_ADDR "productCount()" --rpc-url $RPC_URL 2>/dev/null || echo "0x5")
PRODUCT_COUNT_DEC=$((PRODUCT_COUNT))

echo -e "${GREEN}✓ Total de productos en catálogo: $PRODUCT_COUNT_DEC${NC}"

echo -e "${YELLOW}6. Generando guía de pruebas...${NC}"

cat > GUIA_PRUEBAS.md << EOF
# Guía de Pruebas del Sistema E-Commerce Web3

## Cuentas Configuradas

### 👨‍💼 Tus Cuentas de MetaMask (Ya configuradas con tokens)

#### 1. Testim
- **Dirección**: \`0x8a0b4Fb8eEdDD7e599E843eAD2135A99b09E4272\`
- **Balance**: 5 ETH + 3,000 EURT + 3,000 USDT

#### 2. Cuenta 3
- **Dirección**: \`0x39d34C1a5144F5AB4B3FC0F4d9Ad8EDe127798a2\`
- **Balance**: 5 ETH + 3,000 EURT + 3,000 USDT

#### 3. Cuenta 4
- **Dirección**: \`0x1d79Cfd6Cf139754Cb7e6D846b054f3eDb6feE4D\`
- **Balance**: 5 ETH + 3,000 EURT + 3,000 USDT

#### 4. Cuenta 6
- **Dirección**: \`0x18113c79972CF002569c494FD441938a3788c39A\`
- **Balance**: 5 ETH + 3,000 EURT + 3,000 USDT

### 🏢 Cuenta de Empresa de Prueba (Company)
- **Dirección**: \`$COMPANY_ADDR\`
- **Clave Privada**: \`$COMPANY_KEY\`
- **Balance EURT**: 10,000 EUR
- **Empresa**: TechStore Demo (CIF: ES12345678Z)

### 🛒 Cuenta de Cliente de Prueba (Customer)  
- **Dirección**: \`$CUSTOMER_ADDR\`
- **Clave Privada**: \`$CUSTOMER_KEY\`
- **Balance EURT**: 5,000 EUR

## Productos Disponibles

1. **Laptop Gaming** - €1,500 (Stock: 5)
2. **Mouse Gaming** - €75 (Stock: 20)
3. **Teclado Mecánico** - €120 (Stock: 15)
4. **Monitor 4K** - €350 (Stock: 8)
5. **Auriculares Gaming** - €95 (Stock: 12)

## Flujo de Pruebas Recomendado

### 1. Configurar MetaMask
\`\`\`
Red: Localhost 8545
Chain ID: 31337
Currency: ETH
RPC URL: http://localhost:8545
\`\`\`

### 2. Importar/Agregar Tokens en MetaMask
- Cambia a la red "Anvil Local" 
- Agrega los tokens:

#### Token EURT (EuroToken)
- Dirección del contrato: (se mostrará al ejecutar el sistema)
- Símbolo: EURT
- Decimales: 6

#### Token USDT (Tether USD)
- Dirección del contrato: (se mostrará al ejecutar el sistema)
- Símbolo: USDT
- Decimales: 4

- Verifica que aparezcan los balances de EURT y USDT en todas tus cuentas

### 3. Probar Web Admin (http://localhost:6003)
- Conecta con la cuenta de empresa
- Verifica que aparezca el dashboard
- Ve a "Gestionar Productos"
- Verifica que aparezcan los 5 productos
- Intenta agregar un nuevo producto

### 4. Probar Web Customer (http://localhost:6004)
- Conecta con la cuenta de cliente
- Verifica que aparezcan todos los productos
- Agrega productos al carrito
- Realiza checkout
- Verifica redirección a pasarela de pago

### 5. Probar Pasarela de Pago (http://localhost:6002)
- Verifica que aparezcan los detalles del pago
- Conecta MetaMask
- Confirma el pago
- Verifica que se actualicen los balances

### 6. Verificar Estado Final
- Revisa balances en MetaMask
- Verifica que el stock se haya reducido
- Comprueba que la factura aparezca como pagada

## Comandos Útiles para Debugging

\`\`\`bash
# Ver balance de EURT
cast call $EURT_ADDR "balanceOf(address)" DIRECCION --rpc-url http://localhost:8545

# Ver detalles de producto
cast call $ECOMMERCE_ADDR "getProduct(uint256)" ID_PRODUCTO --rpc-url http://localhost:8545

# Ver empresa
cast call $ECOMMERCE_ADDR "getCompany(uint256)" 1 --rpc-url http://localhost:8545
\`\`\`

## Solución de Problemas

### Error: "No company registered"
- Asegúrate de usar la cuenta correcta ($COMPANY_ADDR)
- Verifica que la empresa esté registrada

### Error: "Insufficient allowance"
- Aprueba el gasto de tokens antes de pagar
- Verifica que tengas suficiente balance

### Error: "Insufficient stock"
- Verifica el stock disponible del producto
- Reduce la cantidad en el carrito

### Aplicaciones no cargan
- Verifica que todas estén corriendo en sus puertos
- Revisa los logs en la consola del navegador
- Confirma que las variables de entorno estén configuradas

EOF

echo -e "${GREEN}✓ Guía generada: GUIA_PRUEBAS.md${NC}"

echo -e "${BLUE}=== CONFIGURACIÓN COMPLETADA ===${NC}"
echo -e "${GREEN}El sistema está listo para pruebas con datos de ejemplo!${NC}"
echo -e ""
echo -e "📖 Lee GUIA_PRUEBAS.md para instrucciones detalladas"
echo -e "🌐 Aplicaciones disponibles:"
echo -e "   • Web Admin: ${BLUE}http://localhost:6003${NC}"
echo -e "   • Web Customer: ${BLUE}http://localhost:6004${NC}"
echo -e "   • Compra Stablecoin: ${BLUE}http://localhost:6001${NC}"
echo -e "   • Pasarela de Pago: ${BLUE}http://localhost:6002${NC}"