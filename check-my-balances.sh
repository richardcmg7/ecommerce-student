#!/bin/bash

# Script para verificar balances de tus cuentas de MetaMask

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== VERIFICANDO BALANCES DE TUS CUENTAS ===${NC}"

# Leer direcciones de contratos
if [ -f "CUENTAS_CONFIGURADAS.md" ]; then
    EURT_ADDR=$(grep "EuroToken (EURT)" CUENTAS_CONFIGURADAS.md | grep -o "0x[a-fA-F0-9]\{40\}")
    USDT_ADDR=$(grep "USDT" CUENTAS_CONFIGURADAS.md | grep -o "0x[a-fA-F0-9]\{40\}" | tail -1)
else
    echo -e "${RED}Error: Archivo CUENTAS_CONFIGURADAS.md no encontrado${NC}"
    exit 1
fi

RPC_URL="http://localhost:8545"

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

echo -e "Contratos:"
echo -e "  EURT: $EURT_ADDR"
echo -e "  USDT: $USDT_ADDR"
echo -e ""

for i in "${!USER_ACCOUNTS[@]}"; do
    ACCOUNT=${USER_ACCOUNTS[$i]}
    NAME=${ACCOUNT_NAMES[$i]}
    
    echo -e "${YELLOW}${NAME} (${ACCOUNT:0:10}...):${NC}"
    
    # Verificar ETH
    ETH_BALANCE=$(cast balance $ACCOUNT --rpc-url $RPC_URL 2>/dev/null)
    if [ ! -z "$ETH_BALANCE" ]; then
        ETH_READABLE=$(echo "scale=4; $ETH_BALANCE / 1000000000000000000" | bc -l 2>/dev/null || echo "Error")
        echo -e "  ETH: ${GREEN}$ETH_READABLE${NC}"
    else
        echo -e "  ETH: ${RED}Error${NC}"
    fi
    
    # Verificar EURT
    EURT_BALANCE=$(cast call $EURT_ADDR "balanceOf(address)" $ACCOUNT --rpc-url $RPC_URL 2>/dev/null)
    if [ ! -z "$EURT_BALANCE" ]; then
        EURT_READABLE=$(echo "scale=2; $((EURT_BALANCE)) / 1000000" | bc -l 2>/dev/null || echo "Error")
        echo -e "  EURT: ${GREEN}$EURT_READABLE${NC}"
    else
        echo -e "  EURT: ${RED}Error${NC}"
    fi
    
    # Verificar USDT
    USDT_BALANCE=$(cast call $USDT_ADDR "balanceOf(address)" $ACCOUNT --rpc-url $RPC_URL 2>/dev/null)
    if [ ! -z "$USDT_BALANCE" ]; then
        USDT_READABLE=$(echo "scale=2; $((USDT_BALANCE)) / 10000" | bc -l 2>/dev/null || echo "Error")
        echo -e "  USDT: ${GREEN}$USDT_READABLE${NC}"
    else
        echo -e "  USDT: ${RED}Error${NC}"
    fi
    
    echo ""
done

echo -e "${BLUE}=== CONFIGURACIÓN PARA METAMASK ===${NC}"
echo -e "Red: Anvil Local"
echo -e "RPC: http://localhost:8545"
echo -e "Chain ID: 31337"
echo -e ""
echo -e "Tokens a agregar:"
echo -e "  EURT: $EURT_ADDR (decimales: 6)"
echo -e "  USDT: $USDT_ADDR (decimales: 4)"