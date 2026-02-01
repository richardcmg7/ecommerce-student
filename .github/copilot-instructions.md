# AI Coding Agent Guidelines

## System Overview
- Monorepo provides blockchain-backed ecommerce with stablecoin purchase, payment gateway, admin, and customer frontends coordinated through Foundry contracts.
- EuroToken (6 decimals) and USDT (4 decimals) live in stablecoin/sc alongside Foundry scripts and tests; Ecommerce.sol aggregates library modules for companies, products, carts, invoices, and payments.
- Frontends (Next.js 15 + TypeScript + Tailwind) live under web-admin, web-customer, stablecoin/compra-stableboin, and stablecoin/pasarela-de-pago, each consuming the smart contracts via ethers v6 hooks.
- External services include Stripe for fiat onboarding, IPFS/Pinata for product media, and RPC providers (Anvil locally, Infura/Alchemy remotely); persist corresponding keys in .env files.

## Critical Workflows
- Use Foundry: forge build, forge test (-vvv for logs), forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast for deployments, cast call/send for contract inspection.
- Bring the stack up with restart-all.sh (stops prior apps, launches Anvil, deploys contracts, updates env files, starts all Next.js apps on ports 6001-6004).
- Run individual frontends via npm run dev inside each web-* app; ensure NEXT_PUBLIC_* contract addresses match latest deployment output.
- Stripe purchase flow: frontend creates PaymentIntent, backend webhook mints tokens via owner key; guard mint endpoints so only verified payments trigger mint.
- Payment gateway expects URL params (merchant_address, amount, invoice, date, redirect); validate presence and amounts before calling processPayment on chain.

## Architectural Patterns
- Contracts split concerns into libraries (CompanyLib, ProductLib, CartLib, InvoiceLib, PaymentLib) that the main Ecommerce contract wires together; follow this modular style when extending logic.
- EuroToken/USDT contracts inherit OpenZeppelin ERC20, override decimals, and restrict mint to owner; mirror access control and event conventions for new tokens.
- Frontend hooks (useWallet, useContract, useCompany, useProducts, useCart) encapsulate ethers providers, network checks (localhost/31337), and state management; prefer extending hooks over ad-hoc provider usage.
- Carrito and invoice flows rely on on-chain persistence—calculate totals via contract view functions before charging tokens to stay consistent with PaymentLib checks.

## Environment & Testing
- Default local RPC: http://localhost:8545 (Anvil); verify MetaMask targets chain id 31337 before testing UI flows.
- Required env keys per app: Stripe publishable/secret, wallet private key for minting, EuroToken and Ecommerce contract addresses; keep sensitive keys out of client bundles unless prefixed with NEXT_PUBLIC_.
- Scenario validation: follow the documented end-to-end test (buy tokens → register company → add products → checkout → pay via gateway → verify invoices) to confirm integrations.
- When troubleshooting, inspect tenderly/log outputs for contract events (mint, invoice created, processPayment) to trace cross-component issues quickly.
