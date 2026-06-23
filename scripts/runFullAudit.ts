import 'dotenv/config';
import {
  testConnection,
  analyzeStructure,
  analyzeGlossary,
  analyzeTags,
  analyzeAccess,
  analyzeLineage,
  analyzeSecurity,
  computeGovernanceScore,
} from '../server/databricks';
import {
  createAuditSession,
  createAnalysisResult,
  updateAnalysisResult,
  updateAuditSession,
} from '../server/db';

async function run() {
  const host = process.env.DATABRICKS_HOST;
  const token = process.env.DATABRICKS_TOKEN;
  const catalog = process.env.DATABRICKS_CATALOG;

  if (!host || !token || !catalog) {
    console.error('Defina DATABRICKS_HOST, DATABRICKS_TOKEN e DATABRICKS_CATALOG no .env');
    process.exit(1);
  }

  const cfg = { host, token, catalog };

  console.log('Testando conexão com Databricks...');
  const conn = await testConnection(cfg as any);
  if (!conn.ok) {
    console.error('Falha na conexão:', conn.message);
    process.exit(1);
  }
  console.log('Conectado. Warehouse:', conn.warehouseId);

  // Usar userId 1 (ajuste se houver um usuário de aplicação específico)
  const userId = 1;

  console.log('Criando sessão de auditoria no banco...');
  const sessionId = await createAuditSession({
    userId,
    databricksHost: host,
    targetCatalog: catalog,
    status: 'running',
  } as any);
  console.log('Sessão criada id=', sessionId);

  const analysisTypes = ['structure', 'glossary', 'tags', 'access', 'lineage', 'security'] as const;
  const resultIds: Record<string, number> = {};

  for (const type of analysisTypes) {
    const rid = await createAnalysisResult({ sessionId: sessionId as any, analysisType: type, status: 'running' } as any);
    resultIds[type] = rid;
  }

  const results: any = {};
  const errors: Record<string, string> = {};

  // Structure
  try {
    console.log('Running structure analysis...');
    const t0 = Date.now();
    const data = await analyzeStructure(cfg as any);
    results.structure = data;
    await updateAnalysisResult(resultIds.structure, { status: 'completed', resultData: data as any, executionMs: Date.now() - t0, score: 100 } as any);
  } catch (e: any) {
    errors.structure = e.message;
    await updateAnalysisResult(resultIds.structure, { status: 'failed', errorMessage: e.message } as any);
  }

  // Glossary
  try {
    console.log('Running glossary analysis...');
    const t0 = Date.now();
    const data = await analyzeGlossary(cfg as any);
    results.glossary = data;
    await updateAnalysisResult(resultIds.glossary, { status: 'completed', resultData: data as any, executionMs: Date.now() - t0, score: data.summary.tableDocCoverage } as any);
  } catch (e: any) {
    errors.glossary = e.message;
    await updateAnalysisResult(resultIds.glossary, { status: 'failed', errorMessage: e.message } as any);
  }

  // Tags
  try {
    console.log('Running tags analysis...');
    const t0 = Date.now();
    const data = await analyzeTags(cfg as any);
    results.tags = data;
    await updateAnalysisResult(resultIds.tags, { status: 'completed', resultData: data as any, executionMs: Date.now() - t0 } as any);
  } catch (e: any) {
    errors.tags = e.message;
    await updateAnalysisResult(resultIds.tags, { status: 'failed', errorMessage: e.message } as any);
  }

  // Access
  try {
    console.log('Running access analysis...');
    const t0 = Date.now();
    const data = await analyzeAccess(cfg as any);
    results.access = data;
    await updateAnalysisResult(resultIds.access, { status: 'completed', resultData: data as any, executionMs: Date.now() - t0 } as any);
  } catch (e: any) {
    errors.access = e.message;
    await updateAnalysisResult(resultIds.access, { status: 'failed', errorMessage: e.message } as any);
  }

  // Lineage
  try {
    console.log('Running lineage analysis...');
    const t0 = Date.now();
    const data = await analyzeLineage(cfg as any);
    results.lineage = data;
    await updateAnalysisResult(resultIds.lineage, { status: 'completed', resultData: data as any, executionMs: Date.now() - t0 } as any);
  } catch (e: any) {
    errors.lineage = e.message;
    await updateAnalysisResult(resultIds.lineage, { status: 'failed', errorMessage: e.message } as any);
  }

  // Security
  try {
    console.log('Running security analysis...');
    const t0 = Date.now();
    const data = await analyzeSecurity(cfg as any);
    results.security = data;
    await updateAnalysisResult(resultIds.security, { status: 'completed', resultData: data as any, executionMs: Date.now() - t0 } as any);
  } catch (e: any) {
    errors.security = e.message;
    await updateAnalysisResult(resultIds.security, { status: 'failed', errorMessage: e.message } as any);
  }

  // Compute score
  let governanceScore = 0;
  let recommendations: string[] = [];
  let gaps: string[] = [];

  if (results.structure && results.glossary && results.tags && results.access && results.lineage && results.security) {
    const computed = computeGovernanceScore(results as any);
    governanceScore = computed.score;
    recommendations = computed.recommendations;
    gaps = computed.gaps;

    for (const type of analysisTypes) {
      if (resultIds[type]) {
        await updateAnalysisResult(resultIds[type], { recommendations: recommendations as any, gaps: gaps as any } as any);
      }
    }
  }

  const hasErrors = Object.keys(errors).length > 0;
  const allFailed = Object.keys(errors).length === analysisTypes.length;

  await updateAuditSession(sessionId as any, {
    status: allFailed ? 'failed' : 'completed',
    governanceScore,
    totalCatalogs: results.structure?.summary.totalCatalogs ?? 0,
    totalSchemas: results.structure?.summary.totalSchemas ?? 0,
    totalTables: results.structure?.summary.totalTables ?? 0,
    docCoverage: results.glossary?.summary.tableDocCoverage ?? 0,
    tagCoverage: results.tags?.summary.totalTableTags ?? 0,
    errorMessage: hasErrors ? JSON.stringify(errors) : null,
  } as any);

  console.log('Auditoria finalizada. SessionId=', sessionId, 'score=', governanceScore);
}

run().catch((e) => {
  console.error('Erro durante auditoria:', e);
  process.exit(1);
});
