import {
  analyzeAccess,
  analyzeGlossary,
  analyzeLineage,
  analyzeSecurity,
  analyzeStructure,
  analyzeTags,
  executeStatement,
  testConnection,
} from "../server/databricks";
import { getDatabricksToken } from "../server/keyvault";

async function main() {
  try {
    const host = "https://adb-3226187933874518.18.azuredatabricks.net";
    console.log("Obtendo token (fallbacks: KeyVault -> DefaultAzureCredential -> az CLI)...");
    const token = await getDatabricksToken();
    console.log("Token obtido (exibindo primeiros 8 chars):", token ? `${token.slice(0,8)}...` : "<vazio>");
    console.log("Executando testConnection()...");
    const catalog = "nexa_dho_dev";
    const config = { host, token, catalog };
    const res = await testConnection(config);
    console.log("Resultado:", res);
    if (!res.ok) process.exit(1);

    console.log(`Validando acesso de leitura ao catalog ${catalog}...`);
    const catalogCheck = await executeStatement(
      config,
      `SHOW SCHEMAS IN ${catalog}`,
      res.warehouseId,
    );
    console.log("Resultado do catalog:", {
      ok: true,
      catalog,
      schemasEncontrados: catalogCheck.rows.length,
    });

    console.log("Executando análise estrutural do catalog...");
    const structure = await analyzeStructure(config);
    console.log("Estrutura:", structure.summary);

    const analyses = [
      ["glossary", analyzeGlossary],
      ["tags", analyzeTags],
      ["access", analyzeAccess],
      ["lineage", analyzeLineage],
      ["security", analyzeSecurity],
    ] as const;
    for (const [name, analysis] of analyses) {
      console.log(`Executando análise ${name}...`);
      const result = await analysis(config);
      console.log(`Análise ${name} concluída:`, result.summary);
    }
  } catch (err: any) {
    console.error("Erro ao testar conexão:", err?.message ?? err);
    if (err?.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
