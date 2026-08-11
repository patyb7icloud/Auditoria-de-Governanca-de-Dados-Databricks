import { getSecret } from "../server/keyvault";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  console.log("--- Testando Conexão com Azure Key Vault ---");
  console.log(`Vault URL: ${process.env.AZURE_KEYVAULT_URL || "Não configurada"}`);
  
  try {
    const secretName = "Databricks-AccessToken";
    console.log(`Tentando recuperar segredo: ${secretName}...`);
    const token = await getSecret(secretName);
    console.log("✅ Sucesso! Segredo recuperado.");
    console.log(`Token (primeiros 5 caracteres): ${token.substring(0, 5)}...`);
  } catch (error: any) {
    console.error("❌ Falha ao recuperar segredo:");
    console.error(error.message);
    console.log("\nVerifique se:");
    console.log("1. A variável AZURE_KEYVAULT_URL está correta.");
    console.log("2. Você está autenticado no Azure (az login) ou configurou as variáveis de Service Principal.");
    console.log("3. O segredo 'Databricks-AccessToken' existe no Key Vault.");
  }
}

test();
