import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import { ENV } from "./_core/env";

let client: SecretClient | null = null;

function getClient() {
  if (!client) {
    if (!ENV.vaultUrl) {
      throw new Error("AZURE_KEYVAULT_URL não configurada no ambiente.");
    }
    const credential = new DefaultAzureCredential();
    client = new SecretClient(ENV.vaultUrl, credential);
  }
  return client;
}

/**
 * Recupera um segredo do Azure Key Vault
 * @param secretName Nome do segredo (ex: "Databricks-AccessToken")
 */
export async function getSecret(secretName: string): Promise<string> {
  try {
    const client = getClient();
    const secret = await client.getSecret(secretName);
    if (!secret.value) {
      throw new Error(`O segredo ${secretName} foi encontrado mas está vazio.`);
    }
    return secret.value;
  } catch (error: any) {
    console.error(`Erro ao recuperar segredo ${secretName} do Key Vault:`, error.message);
    throw new Error(`Falha ao recuperar credenciais do Key Vault: ${error.message}`);
  }
}

/**
 * Recupera o token do Databricks configurado
 */
export async function getDatabricksToken(): Promise<string> {
  return getSecret("Databricks-AccessToken");
}
