#!/bin/bash

# Script simple para iniciar el sistema
# Detecta automáticamente si necesita configuración completa o solo reinicio

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 INICIANDO SISTEMA E-COMMERCE WEB3${NC}"

# Verificar si Anvil está corriendo
if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Anvil ya está corriendo${NC}"
    
    # Verificar si las cuentas tienen tokens
    if [ -f "CUENTAS_CONFIGURADAS.md" ]; then
        EURT_ADDR=$(grep "EuroToken (EURT)" CUENTAS_CONFIGURADAS.md | grep -o "0x[a-fA-F0-9]\{40\}")
        TEST_BALANCE=$(cast call $EURT_ADDR "balanceOf(address)" 0x8a0b4Fb8eEdDD7e599E843eAD2135A99b09E4272 --rpc-url http://localhost:8545 2>/dev/null)
        
        if [ ! -z "$TEST_BALANCE" ] && [ "$TEST_BALANCE" != "0x0" ]; then
            echo -e "${GREEN}✓ Cuentas ya configuradas${NC}"
            echo -e "${GREEN}✓ Sistema listo para usar${NC}"
            echo -e ""
            echo -e "🌐 Aplicaciones:"
            echo -e "  • Web Admin: ${BLUE}http://localhost:6003${NC}"
            echo -e "  • Web Customer: ${BLUE}http://localhost:6004${NC}"
            echo -e "  • Compra Stablecoin: ${BLUE}http://localhost:6001${NC}"
            echo -e "  • Pasarela de Pago: ${BLUE}http://localhost:6002${NC}"
            echo -e ""
            echo -e "📋 Ejecuta ${YELLOW}./check-my-balances.sh${NC} para ver tus balances"
            exit 0
        fi
    fi
    
    echo -e "${YELLOW}⚠ Configurando cuentas...${NC}"
    ./setup-dev-data.sh
else
    echo -e "${YELLOW}🔄 Iniciando sistema completo...${NC}"
    ./restart-all.sh
fi