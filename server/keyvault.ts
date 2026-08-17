import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import { ENV } from "./_core/env";
import { execFileSync, execSync } from "child_process";
import { existsSync } from "fs";

let client: SecretClient | null = null;

function getClient(): SecretClient {
  if (!client) {
    if (!ENV.vaultUrl) {
      throw new Error("AZURE_KEYVAULT_URL não configurada no ambiente.");
    }
    const credential = new DefaultAzureCredential();
    client = new SecretClient(ENV.vaultUrl, credential);
  }
  return client;
}

export async function getSecret(secretName: string): Promise<string> {
  try {
    const vaultClient = getClient();
    const secret = await vaultClient.getSecret(secretName);
    if (!secret.value) {
      throw new Error(`O segredo ${secretName} foi encontrado mas está vazio.`);
    }
    return secret.value;
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    throw new Error(`Falha ao recuperar credenciais do Key Vault: ${msg}`);
  }
}

async function getTokenWithDefaultCredential(resourceId: string): Promise<string | null> {
  try {
    const credential = new DefaultAzureCredential();
    // Azure identity expects scopes; use resource/.default
    const scope = `${resourceId}/.default`;
    const token = await credential.getToken(scope);
    if (token && token.token) return token.token;
    return null;
  } catch (err: any) {
    console.warn("DefaultAzureCredential.getToken falhou:", err?.message ?? err);
    return null;
  }
}

function findAzCli(): string | null {
  const candidates = [
    "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.cmd",
    "C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin\\az.exe",
    "C:\\Program Files\\Microsoft\\Azure CLI\\wbin\\az.cmd",
    "C:\\Program Files\\Microsoft\\Azure CLI\\wbin\\az.exe",
    "az",
  ];
  for (const c of candidates) {
    try {
      // quick existence check
      if (c === "az") {
        const which = execFileSync(process.platform === "win32" ? "where.exe" : "which", [c], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
        if (which) return c;
      } else if (existsSync(c)) return c;
    } catch (_) {
      // ignore
    }
  }
  return null;
}

async function getTokenWithAzCli(resourceId: string): Promise<string | null> {
  const az = findAzCli();
  if (!az) return null;
  try {
    const args = ["account", "get-access-token", "--resource", resourceId, "--query", "accessToken", "-o", "tsv"];
    const out = process.platform === "win32" && az.toLowerCase().endsWith(".cmd")
      ? execSync(`call "${az}" ${args.join(" ")}`, { shell: process.env.ComSpec ?? "cmd.exe", encoding: "utf8" }).toString().trim()
      : execFileSync(az, args, { encoding: "utf8" }).toString().trim();
    if (out) return out;
    return null;
  } catch (err: any) {
    console.warn("az CLI get-access-token falhou:", err?.message ?? err);
    return null;
  }
}

export async function getDatabricksToken(): Promise<string> {
  const resourceId = "2ff814a6-3304-4ab8-85cb-cd0e6f879c1d"; // Databricks AAD resource

  // 1) tentar Key Vault se configurado
  if (ENV.vaultUrl) {
    try {
      const secret = await getSecret("Databricks-AccessToken");
      return secret;
    } catch (err: any) {
      console.warn("Leitura do Key Vault falhou, tentando fallback:", err?.message ?? err);
    }
  }

  // 2) tentar DefaultAzureCredential.getToken
  const tokenFromCredential = await getTokenWithDefaultCredential(resourceId);
  if (tokenFromCredential) return tokenFromCredential;

  // 3) tentar az CLI
  const tokenFromAz = await getTokenWithAzCli(resourceId);
  if (tokenFromAz) return tokenFromAz;

  throw new Error("Não foi possível obter token do Databricks (Key Vault, DefaultAzureCredential e az CLI falharam).");
}
