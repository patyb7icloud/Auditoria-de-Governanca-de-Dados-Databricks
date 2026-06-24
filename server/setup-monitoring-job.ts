import { createHeartbeatJob, listHeartbeatJobs } from "./_core/heartbeat";

/**
 * Este script deve ser chamado após a inicialização da aplicação
 * (ou por um botão no painel de admin) para registrar o cron job
 * no serviço de Heartbeat do WebDev.
 */
export async function setupWeeklyMonitoringJob(tenantCatalog: string, userSession: string) {
  const jobName = `weekly-metrics-${tenantCatalog}`;
  
  // 1. Verifica se já existe
  try {
    const existingJobs = await listHeartbeatJobs(userSession);
    const exists = existingJobs.jobs.find(j => j.name === jobName);
    if (exists) {
      console.log(`[Setup] Job ${jobName} já existe (taskUid: ${exists.taskUid})`);
      return exists.taskUid;
    }
  } catch (e) {
    console.log(`[Setup] Não foi possível listar jobs, assumindo que não existe: ${e}`);
  }

  // 2. Cria o novo job (toda segunda-feira às 00:00 UTC)
  try {
    const result = await createHeartbeatJob({
      name: jobName,
      cron: "0 0 0 * * 1", // Segundo, Minuto, Hora, Dia do Mês, Mês, Dia da Semana
      path: "/api/scheduled/weekly-metrics",
      method: "POST",
      payload: { tenantCatalog },
      description: "Geração de métricas semanais do Copiloto de Governança"
    }, userSession);
    
    console.log(`[Setup] Job criado com sucesso! TaskUid: ${result.taskUid}`);
    return result.taskUid;
  } catch (e) {
    console.error(`[Setup] Erro ao criar job de monitoramento:`, e);
    throw e;
  }
}
