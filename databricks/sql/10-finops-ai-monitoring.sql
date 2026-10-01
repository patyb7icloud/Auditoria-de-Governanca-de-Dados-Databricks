-- Monitoramento FinOps de IA conforme a documentação de governança.
-- Execute em um SQL Warehouse com acesso às tabelas de sistema necessárias.

-- 1) DBUs por solução/componente/ambiente/centro de custo.
SELECT
  usage_date,
  custom_tags['ai_project_id'] AS ai_project_id,
  custom_tags['ai_solution'] AS ai_solution,
  custom_tags['ai_component'] AS ai_component,
  custom_tags['environment'] AS environment,
  custom_tags['business_unit'] AS business_unit,
  custom_tags['owner_team'] AS owner_team,
  custom_tags['cost_center'] AS cost_center,
  billing_origin_product,
  usage_metadata.endpoint_name AS endpoint_name,
  SUM(usage_quantity) AS dbus
FROM system.billing.usage
WHERE usage_unit = 'DBU'
  AND billing_origin_product IN (
    'MODEL_SERVING',
    'VECTOR_SEARCH',
    'AI_FUNCTIONS',
    'AGENT_EVALUATION',
    'GENIE',
    'JOBS',
    'APPS',
    'ALL_PURPOSE'
  )
GROUP BY
  usage_date,
  custom_tags['ai_project_id'],
  custom_tags['ai_solution'],
  custom_tags['ai_component'],
  custom_tags['environment'],
  custom_tags['business_unit'],
  custom_tags['owner_team'],
  custom_tags['cost_center'],
  billing_origin_product,
  usage_metadata.endpoint_name
ORDER BY dbus DESC;

-- 2) Consumo do AI Gateway por request tags, endpoint e modelo.
-- request_tags recomendadas: ai_project_id, use_case, consumer_application,
-- channel, request_type, evaluation_flag e experiment_id.
SELECT
  DATE(event_time) AS event_date,
  request_tags['ai_project_id'] AS ai_project_id,
  request_tags['use_case'] AS use_case,
  request_tags['consumer_application'] AS consumer_application,
  request_tags['channel'] AS channel,
  request_tags['request_type'] AS request_type,
  request_tags['evaluation_flag'] AS evaluation_flag,
  request_tags['experiment_id'] AS experiment_id,
  endpoint_name,
  destination_model,
  COUNT(*) AS requests,
  SUM(total_tokens) AS total_tokens,
  AVG(latency_ms) AS avg_latency_ms,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS errors
FROM system.ai_gateway.usage
WHERE request_tags['ai_project_id'] IS NOT NULL
GROUP BY
  DATE(event_time),
  request_tags['ai_project_id'],
  request_tags['use_case'],
  request_tags['consumer_application'],
  request_tags['channel'],
  request_tags['request_type'],
  request_tags['evaluation_flag'],
  request_tags['experiment_id'],
  endpoint_name,
  destination_model
ORDER BY total_tokens DESC;

-- 3) Resumo do dashboard de inventário/conformidade.
SELECT
  compliance_status,
  COUNT(*) AS assets,
  SUM(CASE WHEN homologated_flag THEN 1 ELSE 0 END) AS homologated_assets,
  SUM(CASE WHEN COALESCE(notified_admin, FALSE) THEN 1 ELSE 0 END) AS notified_assets,
  MAX(last_seen_at) AS most_recent_observation
FROM governance.ai_inventory.solution_mapping
GROUP BY compliance_status
ORDER BY assets DESC;
