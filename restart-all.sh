#!/bin/bash

# Colores para la consola
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando Sistema E-Commerce Web3 ===${NC}"

# 1. Limpieza de procesos anteriores
echo -e "Limpiando procesos en puertos 8545, 6001, 6002, 6003, 6004..."
fuser -k 8545/tcp 6001/tcp 6002/tcp 6003/tcp 6004/tcp 2>/dev/null

# 2. Iniciar Anvil
echo -e "Iniciando Anvil (Blockchain Local)..."
anvil > /dev/null 2>&1 &
sleep 3 # Esperar a que arranque

# Clave privada por defecto de Anvil #0
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL="http://localhost:8545"

# 3. Desplegar Stablecoins
echo -e "Desplegando EuroToken..."
cd stablecoin/sc
DEPLOY_EURT=$(forge script script/DeployEuroToken.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}EuroToken desplegado en: $DEPLOY_EURT${NC}"

echo -e "Desplegando USDT..."
DEPLOY_USDT=$(forge script script/DeployUSDT.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}USDT desplegado en: $DEPLOY_USDT${NC}"

# 4. Desplegar Ecommerce
echo -e "Desplegando Ecommerce Contract..."
cd ../../sc-ecommerce
export EUROTOKEN_ADDRESS=$DEPLOY_EURT
export USDT_ADDRESS=$DEPLOY_USDT
DEPLOY_ECOMMERCE=$(forge script script/DeployEcommerce.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}Ecommerce desplegado en: $DEPLOY_ECOMMERCE${NC}"

cd ..

# 5. Actualizar Variables de Entorno (.env.local)

# App 1: Compra Stablecoin
echo "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$DEPLOY_EURT" > stablecoin/compra-stablecoin/.env.local
echo "NEXT_PUBLIC_USDT_CONTRACT_ADDRESS=$DEPLOY_USDT" >> stablecoin/compra-stablecoin/.env.local
echo "WALLET_PRIVATE_KEY=$PRIVATE_KEY" >> stablecoin/compra-stablecoin/.env.local
echo "RPC_URL=$RPC_URL" >> stablecoin/compra-stablecoin/.env.local
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51" >> stablecoin/compra-stablecoin/.env.local
echo "STRIPE_SECRET_KEY=sk_test_51" >> stablecoin/compra-stablecoin/.env.local

# App 2: Pasarela de Pago
echo "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=$DEPLOY_EURT" > stablecoin/pasarela-de-pago/.env.local
echo "NEXT_PUBLIC_USDT_CONTRACT_ADDRESS=$DEPLOY_USDT" >> stablecoin/pasarela-de-pago/.env.local
echo "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$DEPLOY_ECOMMERCE" >> stablecoin/pasarela-de-pago/.env.local

# App 3: Web Admin
echo "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$DEPLOY_ECOMMERCE" > web-admin/.env.local

# App 4: Web Customer
echo "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$DEPLOY_ECOMMERCE" > web-customer/.env.local

echo -e "${BLUE}=== Configuración de Entorno Completada ===${NC}"

# 6. Iniciar Aplicaciones
echo -e "Iniciando Aplicaciones Web..."

cd stablecoin/compra-stablecoin && npm run dev -- -p 6001 > /dev/null 2>&1 &
echo -e "${GREEN}✔ Compra Stablecoin: http://localhost:6001${NC}"

cd ../pasarela-de-pago && npm run dev -- -p 6002 > /dev/null 2>&1 &
echo -e "${GREEN}✔ Pasarela de Pago: http://localhost:6002${NC}"

cd ../../web-admin && npm run dev -- -p 6003 > /dev/null 2>&1 &
echo -e "${GREEN}✔ Web Admin: http://localhost:6003${NC}"

cd ../web-customer && npm run dev -- -p 6004 > /dev/null 2>&1 &
echo -e "${GREEN}✔ Web Customer: http://localhost:6004${NC}"

echo -e "${BLUE}Sistema listo. Presiona Ctrl+C para detener (pero las apps seguirán en segundo plano)${NC}"
