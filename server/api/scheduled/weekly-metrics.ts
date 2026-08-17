import { Request, Response } from "express";
import { generateWeeklyMetrics } from "../../monitoring";

/**
 * Este endpoint será chamado automaticamente pelo HeartbeatJob
 * toda semana para gerar e consolidar as métricas do Copiloto.
 * 
 * Path esperado: /api/scheduled/weekly-metrics
 */
export default async function weeklyMetricsHandler(req: Request, res: Response) {
  // A payload deve conter o tenantCatalog
  const tenantCatalog = req.body?.tenantCatalog;
  
  if (!tenantCatalog) {
    return res.status(400).json({ error: "tenantCatalog is required in payload" });
  }

  try {
    console.log(`[HeartbeatJob] Iniciando geração de métricas semanais para o catálogo: ${tenantCatalog}`);
    const metrics = await generateWeeklyMetrics(tenantCatalog);
    console.log(`[HeartbeatJob] Métricas semanais geradas com sucesso para ${tenantCatalog}. Custo: $${metrics.totalCostUSD}`);
    
    return res.status(200).json({ success: true, metrics });
  } catch (error) {
    console.error(`[HeartbeatJob] Erro ao gerar métricas semanais para ${tenantCatalog}:`, error);
    return res.status(500).json({ error: String(error) });
  }
}
