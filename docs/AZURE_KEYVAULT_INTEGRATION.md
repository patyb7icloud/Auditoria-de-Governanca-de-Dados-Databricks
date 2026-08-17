# Guia de Integração: Recuperação de Token do Databricks via Azure Key Vault

Este documento apresenta a arquitetura e as instruções práticas para a recuperação segura do Token de Acesso Pessoal do Databricks armazenado no **Azure Key Vault** (utilizando o nome de segredo `Databricks-AccessToken`), conforme solicitado pela equipe de engenharia e governança.

---

## 1. Visão Geral da Arquitetura

Para garantir a conformidade com as diretrizes de segurança (Zero Trust) e evitar o armazenamento de credenciais em texto plano no código-fonte ou em arquivos de configuração locais, o sistema foi integrado ao **Azure Key Vault** utilizando as bibliotecas oficiais do SDK do Azure para Node.js (`@azure/keyvault-secrets` e `@azure/identity`) [1].

```
+------------------+         +----------------------+         +------------------------+
|  Sistema Web /   | ------->| @azure/identity      | ------->| Azure Key Vault        |
|  Aplicação Node  |         | (DefaultCredential)  |         | Secret:                |
+------------------+         +----------------------+         | Databricks-AccessToken |
        |                                                     +------------------------+
        | (Token recuperado em tempo de execução)                         |
        v                                                                 v
+----------------------------------------------------------------------------------+
|                           Databricks REST API / Unity Catalog                    |
|                        (Execução de Consultas e Linhagem de Dados)               |
+----------------------------------------------------------------------------------+
```

---

## 2. Configuração do Ambiente

Para que a aplicação consiga interagir com o Azure Key Vault, as seguintes variáveis de ambiente devem ser configuradas no servidor ou no arquivo `.env`:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `AZURE_KEYVAULT_URL` | URL do seu Azure Key Vault | `https://seu-cofre-vault.vault.azure.net/` |
| `AZURE_CLIENT_ID` *(Opcional)* | ID do Cliente (Service Principal) | `12345678-abcd-...` |
| `AZURE_TENANT_ID` *(Opcional)* | ID do Inquilino do Azure Active Directory | `87654321-dcba-...` |
| `AZURE_CLIENT_SECRET` *(Opcional)* | Chave secreta do Service Principal | `sua-chave-secreta` |

> **Nota sobre Autenticação (`DefaultAzureCredential`):** O SDK do Azure tenta autenticar automaticamente utilizando a credencial disponível no ambiente, priorizando variáveis de ambiente (Service Principal), identidade gerenciada (Managed Identity) no Azure App Service / AKS, ou a CLI do Azure (`az login`) durante o desenvolvimento local [2].

---

## 3. Implementação do Código de Recuperação

O módulo responsável pela comunicação com o Key Vault foi implementado em `server/keyvault.ts`:

```typescript
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
 * Recupera o segredo do Azure Key Vault com o nome padrão 'Databricks-AccessToken'
 */
export async function getDatabricksToken(): Promise<string> {
  const secretName = "Databricks-AccessToken";
  try {
    const vaultClient = getClient();
    const secret = await vaultClient.getSecret(secretName);
    if (!secret.value) {
      throw new Error(`O segredo ${secretName} foi encontrado mas está vazio.`);
    }
    return secret.value;
  } catch (error: any) {
    console.error(`Erro ao recuperar segredo ${secretName} do Key Vault:`, error.message);
    throw new Error(`Falha ao recuperar credenciais do Key Vault: ${error.message}`);
  }
}
```

---

## 4. Integração com a API de Auditoria e Linhagem

No roteador tRPC (`server/routers.ts`), a verificação de conexão e a execução de auditorias completas (incluindo a extração de linhagem em `system.access.table_lineage`) foram atualizadas para aceitar a flag `useVault` ou buscar automaticamente o token caso nenhum token manual seja fornecido [3]:

```typescript
    testConnection: protectedProcedure
      .input(databricksConfigSchema)
      .mutation(async ({ input }) => {
        let config = { ...input };
        if (input.useVault || !input.token) {
          config.token = await getDatabricksToken();
        }
        return testConnection(config as any);
      }),
```

---

## 5. Validação e Testes Locais

Para testar a recuperação do token diretamente no ambiente de desenvolvimento:

1. Certifique-se de estar autenticado no Azure via CLI (caso utilize credencial de desenvolvedor):
   ```bash
   az login
   ```
2. Defina a variável de ambiente do Key Vault:
   ```bash
   export AZURE_KEYVAULT_URL="https://seu-cofre.vault.azure.net/"
   ```
3. Execute o script de teste incluído no repositório:
   ```bash
   npx tsx scripts/testKeyVault.ts
   ```

---

## Referências

[1] Microsoft Learn. *Quickstart: Azure Key Vault secret client library for JavaScript*. Disponível em: <https://learn.microsoft.com/en-us/azure/key-vault/secrets/quick-create-node>.  
[2] Microsoft Learn. *How to Authenticate with Azure Using @azure/identity SDK in Node.js*.  
[3] Databricks Documentation. *Secret management in Azure Databricks*. Disponível em: <https://learn.microsoft.com/en-us/azure/databricks/security/secrets/>.
