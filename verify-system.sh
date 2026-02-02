#!/bin/bash

# Script de verificación rápida del sistema
# Verifica que todos los componentes estén funcionando correctamente

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== VERIFICACIÓN DEL SISTEMA E-COMMERCE WEB3 ===${NC}"

# 1. Verificar Anvil
echo -n "🔗 Blockchain (Anvil): "
if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Funcionando${NC}"
else
    echo -e "${RED}✗ No responde${NC}"
fi

# 2. Verificar aplicaciones web
for port in 6001 6002 6003 6004; do
    app_name=""
    case $port in
        6001) app_name="Compra Stablecoin" ;;
        6002) app_name="Pasarela de Pago" ;;
        6003) app_name="Web Admin" ;;
        6004) app_name="Web Customer" ;;
    esac
    
    echo -n "🌐 $app_name (puerto $port): "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port | grep -q "200"; then
        echo -e "${GREEN}✓ Funcionando${NC}"
    else
        echo -e "${RED}✗ No responde${NC}"
    fi
done

# 3. Verificar contratos desplegados
if [ -f "web-admin/.env.local" ]; then
    source web-admin/.env.local
    echo -n "📄 Contratos desplegados: "
    if [ ! -z "$NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS" ] && [ ! -z "$NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS" ]; then
        echo -e "${GREEN}✓ Configurados${NC}"
        echo "   • EuroToken: $NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS"
        echo "   • Ecommerce: $NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS"
    else
        echo -e "${RED}✗ No configurados${NC}"
    fi
else
    echo -e "${RED}✗ Archivo .env.local no encontrado${NC}"
fi

# 4. Verificar balances de prueba (si cast está disponible)
if command -v cast &> /dev/null && [ ! -z "$NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS" ]; then
    echo -n "💰 Balances de prueba: "
    CUSTOMER_ADDR="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    BALANCE=$(cast call $NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS "balanceOf(address)" $CUSTOMER_ADDR --rpc-url http://localhost:8545 2>/dev/null)
    if [ ! -z "$BALANCE" ] && [ "$BALANCE" != "0x0" ]; then
        echo -e "${GREEN}✓ Configurados${NC}"
    else
        echo -e "${RED}✗ Sin tokens de prueba${NC}"
    fi
fi

# 5. Verificar archivos de configuración
echo -n "📋 Archivos de configuración: "
config_files=("GUIA_PRUEBAS.md" "RESUMEN_SOLUCION.md" "setup-dev-data.sh" "test-complete-system.sh")
all_exist=true
for file in "${config_files[@]}"; do
    if [ ! -f "$file" ]; then
        all_exist=false
        break
    fi
done

if $all_exist; then
    echo -e "${GREEN}✓ Todos presentes${NC}"
else
    echo -e "${RED}✗ Algunos archivos faltantes${NC}"
fi

echo ""
echo -e "${BLUE}=== RESUMEN ===${NC}"
echo "🚀 Para usar el sistema:"
echo "   1. Configura MetaMask con red localhost:8545"
echo "   2. Importa las cuentas de GUIA_PRUEBAS.md"
echo "   3. Visita http://localhost:6003 (Admin) o http://localhost:6004 (Customer)"
echo ""
echo "📖 Lee GUIA_PRUEBAS.md para instrucciones detalladas"
echo "🔧 Lee RESUMEN_SOLUCION.md para detalles técnicos"