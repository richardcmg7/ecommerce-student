#!/bin/bash

# Script para detener Anvil de forma segura guardando el estado

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Deteniendo Anvil...${NC}"

# Leer PID si existe
if [ -f ".anvil-state/anvil.pid" ]; then
    ANVIL_PID=$(cat .anvil-state/anvil.pid)
    if kill -0 $ANVIL_PID 2>/dev/null; then
        echo -e "Enviando señal de parada a proceso $ANVIL_PID..."
        kill -TERM $ANVIL_PID
        
        # Esperar a que termine gracefully
        for i in {1..10}; do
            if ! kill -0 $ANVIL_PID 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Si aún está corriendo, forzar
        if kill -0 $ANVIL_PID 2>/dev/null; then
            echo -e "Forzando cierre..."
            kill -KILL $ANVIL_PID
        fi
    fi
    rm -f .anvil-state/anvil.pid
fi

# También matar por puerto como backup
fuser -k 8545/tcp 2>/dev/null || true

echo -e "${GREEN}✓ Anvil detenido${NC}"
echo -e "Estado guardado en: .anvil-state/blockchain.json"