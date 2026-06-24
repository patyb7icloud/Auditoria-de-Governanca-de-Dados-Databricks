/**
 * Debug script to check for dynamic security (masking/filters)
 */
import { analyzeSecurity } from "../server/databricks";

interface DatabricksConfig {
  host: string;
  token: string;
  catalog: string;
}

async function debugSecurity(config: DatabricksConfig) {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🔍 DEBUG: Analisando políticas de mascaramento/filtros");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // Executar análise de segurança
    console.log("🔄 Executando análise de segurança...\n");
    const securityAnalysis = await analyzeSecurity(config);
    
    console.log(`📊 RESULTADO DA ANÁLISE:`);
    console.log(`  • Total de funções encontradas: ${securityAnalysis.summary.totalFunctions}`);
    console.log(`  • Filtros de linha detectados: ${securityAnalysis.summary.rowFilterCount}`);
    console.log(`  • Máscaras de coluna detectadas: ${securityAnalysis.summary.columnMaskCount}`);
    console.log(`  • Tabelas verificadas: ${securityAnalysis.summary.tablesChecked}\n`);

    // Funções encontradas
    console.log(`📋 TODAS AS ${securityAnalysis.maskingFunctions.length} FUNÇÕES ENCONTRADAS:\n`);
    securityAnalysis.maskingFunctions.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.routine_schema}.${f.routine_name}`);
      const def = (f.routine_definition ?? "").substring(0, 150);
      console.log(`     └─ ${def}${def.length === 150 ? "..." : ""}\n`);
    });

    // Row Filters detectados
    if (securityAnalysis.rowFilters.length > 0) {
      console.log(`\n✅ ROW FILTERS DETECTADOS (${securityAnalysis.rowFilters.length}):\n`);
      securityAnalysis.rowFilters.forEach((rf, idx) => {
        console.log(`  ${idx + 1}. Função: ${rf.table}`);
        const def = rf.definition.substring(0, 200);
        console.log(`     Definição: ${def}${def.length === 200 ? "..." : ""}\n`);
      });
    } else {
      console.log("\n⚠️  NENHUM ROW FILTER DETECTADO");
    }

    // Column Masks detectadas
    if (securityAnalysis.columnMasks.length > 0) {
      console.log(`\n✅ COLUMN MASKS DETECTADAS (${securityAnalysis.columnMasks.length}):\n`);
      securityAnalysis.columnMasks.forEach((cm, idx) => {
        console.log(`  ${idx + 1}. Tabela: ${cm.table}, Coluna: ${cm.column}`);
        const def = cm.definition.substring(0, 200);
        console.log(`     Definição: ${def}${def.length === 200 ? "..." : ""}\n`);
      });
    } else {
      console.log("\n⚠️  NENHUMA COLUMN MASK DETECTADA");
    }

    // Análise e sugestões
    console.log("\n💡 ANÁLISE E SUGESTÕES:\n");
    const totalSecurityPolicies = securityAnalysis.summary.rowFilterCount + securityAnalysis.summary.columnMaskCount;
    
    if (totalSecurityPolicies === 0) {
      console.log("  ⚠️  PROBLEMA: Nenhuma política de mascaramento/filtro foi detectada.");
      console.log("\n  📝 POSSÍVEIS CAUSAS:");
      console.log("     1. As funções podem estar em schemas diferentes");
      console.log("     2. O token pode não ter permissões para ver essas funções");
      console.log("     3. As funções podem estar nomeadas sem keywords detectáveis");
      console.log("     4. Políticas podem estar em Unity Catalog de forma diferente");
      console.log("\n  ✨ SOLUÇÕES:");
      console.log("     • Verifique os nomes das funções de mascaramento");
      console.log("     • Adicione palavras-chave: 'mask', 'filter', 'rls', 'row_filter', etc");
      console.log("     • Verifique permissões do token Databricks");
      console.log("     • Execute manualmente: DESCRIBE EXTENDED [table_name]");
    } else {
      console.log(`  ✅ SUCESSO: ${totalSecurityPolicies} política(s) de segurança detectada(s)!`);
      console.log("     Estas devem aparecer no score de governança.");
    }

    console.log("\n═══════════════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("❌ ERRO ao executar análise:", error);
    process.exit(1);
  }
}

// Main execution
const host = process.env.DATABRICKS_HOST || "";
const token = process.env.DATABRICKS_TOKEN || "";
const catalog = process.env.DATABRICKS_CATALOG || "unity";

if (!host || !token) {
  console.error(
    "❌ ERRO: Configure as variáveis de ambiente:"
  );
  console.error("   • DATABRICKS_HOST");
  console.error("   • DATABRICKS_TOKEN");
  console.error("   • DATABRICKS_CATALOG (padrão: unity)");
  process.exit(1);
}

debugSecurity({ host, token, catalog });
