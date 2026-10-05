-- Consultas de auditoria do RadarIA / AI Governance.
-- Todas são SELECTs. Substitua catalog/schema se o ambiente usar nomes diferentes.
-- Nenhuma consulta altera tags ou ativos Databricks.

-- 1) Resumo de conformidade e alertas por status.
SELECT
  compliance_status,
  COUNT(*) AS total_assets,
  SUM(CASE WHEN homologated_flag THEN 1 ELSE 0 END) AS homologated_assets,
  SUM(CASE WHEN compliance_status <> 'CONFORME'
            AND COALESCE(notified_admin, FALSE) = FALSE THEN 1 ELSE 0 END) AS pending_alerts,
  SUM(CASE WHEN COALESCE(notified_admin, FALSE) THEN 1 ELSE 0 END) AS delivered_alerts,
  MAX(last_seen_at) AS most_recent_observation
FROM governance.ai_inventory.solution_mapping
GROUP BY compliance_status
ORDER BY total_assets DESC;

-- 2) Findings não conformes que ainda estão pendentes de entrega.
SELECT
  agent_id,
  agent_name,
  agent_type,
  workspace_id,
  workspace_name,
  ai_project_id,
  ai_solution,
  compliance_status,
  compliance_reasons,
  tag_read_status,
  last_seen_at,
  DATEDIFF(CURRENT_DATE(), CAST(last_seen_at AS DATE)) AS days_since_observed
FROM governance.ai_inventory.solution_mapping
WHERE COALESCE(compliance_status, 'NÃO_HOMOLOGADO') <> 'CONFORME'
  AND COALESCE(notified_admin, FALSE) = FALSE
ORDER BY last_seen_at DESC;

-- 3) Motivos de não conformidade mais frequentes.
SELECT
  compliance_status,
  reason,
  COUNT(*) AS affected_assets
FROM governance.ai_inventory.solution_mapping
LATERAL VIEW EXPLODE(compliance_reasons) exploded_reasons AS reason
WHERE COALESCE(compliance_status, 'NÃO_HOMOLOGADO') <> 'CONFORME'
GROUP BY compliance_status, reason
ORDER BY affected_assets DESC, compliance_status, reason;

-- 4) Último resultado conhecido da varredura por workspace.
WITH ranked_workspace_status AS (
  SELECT
    scan_run_id,
    scanned_at,
    workspace_id,
    workspace_name,
    phase,
    status,
    error_message,
    ROW_NUMBER() OVER (
      PARTITION BY workspace_id
      ORDER BY scanned_at DESC, scan_run_id DESC
    ) AS row_num
  FROM governance.ai_inventory.radar_scan_workspace_status
  WHERE workspace_id IS NOT NULL
)
SELECT
  scan_run_id,
  scanned_at,
  workspace_id,
  workspace_name,
  phase,
  status,
  error_message
FROM ranked_workspace_status
WHERE row_num = 1
ORDER BY status DESC, workspace_name;

-- 5) Ativos sem observação recente: triagem de atualidade, não prova de remoção.
-- Combine este resultado com a query 4; uma varredura ERROR/PARTIAL não comprova ausência.
SELECT
  agent_id,
  agent_name,
  agent_type,
  workspace_id,
  workspace_name,
  compliance_status,
  last_seen_at,
  DATEDIFF(CURRENT_DATE(), CAST(last_seen_at AS DATE)) AS days_since_observed
FROM governance.ai_inventory.solution_mapping
WHERE last_seen_at < CURRENT_TIMESTAMP() - INTERVAL 24 HOURS
ORDER BY last_seen_at ASC;

-- 6) Duplicidades de declarações aprovadas para a mesma tupla das 12 tags.
-- O DDL é referência e não impõe unicidade automaticamente.
SELECT
  ai_project_id,
  ai_solution,
  ai_component,
  environment,
  business_unit,
  owner_team,
  cost_center,
  data_classification,
  risk_tier,
  criticality,
  lifecycle,
  chargeback_model,
  COUNT(*) AS duplicate_rows
FROM governance.ai_inventory.ai_solution_registry
WHERE approved = TRUE
GROUP BY
  ai_project_id,
  ai_solution,
  ai_component,
  environment,
  business_unit,
  owner_team,
  cost_center,
  data_classification,
  risk_tier,
  criticality,
  lifecycle,
  chargeback_model
HAVING COUNT(*) > 1
ORDER BY duplicate_rows DESC, ai_project_id, ai_solution;

-- 7) Declarações aprovadas de projeto/solução sem ativo observado correspondente.
-- A comparação por par projeto/solução é para descoberta; não valida a tupla completa.
SELECT
  r.ai_project_id,
  r.ai_solution,
  r.registry_owner,
  r.approved_at,
  r.updated_at
FROM governance.ai_inventory.ai_solution_registry r
WHERE r.approved = TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM governance.ai_inventory.solution_mapping m
    WHERE m.ai_project_id = r.ai_project_id
      AND m.ai_solution = r.ai_solution
  )
ORDER BY r.ai_project_id, r.ai_solution;

-- 8) Revalidar linhas marcadas CONFORME contra o conteúdo ATUAL do Registry.
-- Resultado pode aparecer se a aprovação foi alterada/removida após a última varredura.
SELECT
  m.agent_id,
  m.agent_name,
  m.agent_type,
  m.workspace_id,
  m.ai_project_id,
  m.ai_solution,
  m.last_seen_at,
  m.observed_tags
FROM governance.ai_inventory.solution_mapping m
WHERE m.compliance_status = 'CONFORME'
  AND NOT EXISTS (
    SELECT 1
    FROM governance.ai_inventory.ai_solution_registry r
    WHERE r.approved = TRUE
      AND r.ai_project_id = m.ai_project_id
      AND r.ai_solution = m.ai_solution
      AND r.ai_component = m.observed_tags['ai_component']
      AND r.environment = m.observed_tags['environment']
      AND r.business_unit = m.observed_tags['business_unit']
      AND r.owner_team = m.observed_tags['owner_team']
      AND r.cost_center = m.observed_tags['cost_center']
      AND r.data_classification = m.observed_tags['data_classification']
      AND r.risk_tier = m.observed_tags['risk_tier']
      AND r.criticality = m.observed_tags['criticality']
      AND r.lifecycle = m.observed_tags['lifecycle']
      AND r.chargeback_model = m.observed_tags['chargeback_model']
  )
ORDER BY m.last_seen_at DESC;

-- 9) Histórico de observações de um ativo específico; substitua os dois valores.
SELECT
  scan_run_id,
  scanned_at,
  agent_id,
  agent_name,
  agent_type,
  workspace_id,
  endpoint_name,
  observed_tags,
  tag_read_status,
  tag_error
FROM governance.ai_inventory.radar_scan_history
WHERE agent_id = '<agent_id>'
  AND workspace_id = '<workspace_id>'
ORDER BY scanned_at DESC;
