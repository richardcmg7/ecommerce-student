import { ethers } from "ethers";

// ABIs mínimos necesarios para llamar a la función mint
const MINT_ABI = [
  "function mint(address to, uint256 amount) external",
  "function decimals() public view returns (uint8)"
];

export async function mintTokens(
  targetWallet: string,
  amount: number,
  tokenType: "EURT" | "USDT"
) {
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const contractAddress = tokenType === "EURT" 
    ? process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS 
    : process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS;

  if (!privateKey || !contractAddress) {
    throw new Error("Configuración de Wallet o Contrato faltante en el servidor");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, MINT_ABI, signer);

  // Obtener decimales del contrato para calcular el monto exacto
  const decimals = await contract.decimals();
  
  // Convertir el monto FIAT (ej: 10.50) al formato de la blockchain
  // Si EURT tiene 6 decimales, 10.50 -> 10,500,000
  const amountToMint = ethers.parseUnits(amount.toString(), decimals);

  console.log(`Iniciando mint de ${amount} ${tokenType} para ${targetWallet}...`);
  
  const tx = await contract.mint(targetWallet, amountToMint);
  const receipt = await tx.wait();

  return {
    success: true,
    txHash: receipt.hash,
  };
}
