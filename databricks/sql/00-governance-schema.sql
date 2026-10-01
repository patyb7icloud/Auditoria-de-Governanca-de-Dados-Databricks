-- RadarIA / n8n Databricks AI Governance
-- Adapt the catalog/schema names to the organization's Unity Catalog.
-- The AI Registry is a declared source of truth: populate it only with
-- records formally approved by the registry owner.

CREATE SCHEMA IF NOT EXISTS governance.ai_inventory;

CREATE TABLE IF NOT EXISTS governance.ai_inventory.ai_solution_registry (
  ai_project_id STRING NOT NULL,
  ai_solution STRING NOT NULL,
  ai_component STRING NOT NULL,
  environment STRING NOT NULL,
  business_unit STRING NOT NULL,
  owner_team STRING NOT NULL,
  cost_center STRING NOT NULL,
  data_classification STRING NOT NULL,
  risk_tier STRING NOT NULL,
  criticality STRING NOT NULL,
  lifecycle STRING NOT NULL,
  chargeback_model STRING NOT NULL,
  approved BOOLEAN NOT NULL,
  registry_owner STRING,
  approved_at TIMESTAMP,
  updated_at TIMESTAMP
)
USING DELTA
COMMENT 'AI Registry de referência: um registro aprovado por combinação de tags canônicas declaradas.';

CREATE TABLE IF NOT EXISTS governance.ai_inventory.radar_scan_history (
  scan_run_id STRING NOT NULL,
  scanned_at TIMESTAMP NOT NULL,
  agent_id STRING,
  agent_name STRING,
  agent_type STRING,
  workspace_id STRING,
  workspace_name STRING,
  workspace_url STRING,
  endpoint_name STRING,
  observed_tags MAP<STRING, STRING>,
  tag_read_status STRING,
  tag_error STRING
)
USING DELTA
COMMENT 'Histórico append-only de ativos de IA observados pelo radarIA via APIs Databricks.';

CREATE TABLE IF NOT EXISTS governance.ai_inventory.radar_scan_workspace_status (
  scan_run_id STRING NOT NULL,
  scanned_at TIMESTAMP NOT NULL,
  workspace_id STRING,
  workspace_name STRING,
  phase STRING,
  status STRING,
  error_message STRING
)
USING DELTA
COMMENT 'Resultado por workspace/fase, incluindo workspaces ignorados por falha de acesso.';

CREATE TABLE IF NOT EXISTS governance.ai_inventory.solution_mapping (
  agent_id STRING NOT NULL,
  agent_name STRING,
  agent_type STRING,
  workspace_id STRING,
  workspace_name STRING,
  observed_tags MAP<STRING, STRING>,
  ai_project_id STRING,
  ai_solution STRING,
  homologated_flag BOOLEAN,
  compliance_status STRING COMMENT 'CONFORME, PARCIAL ou NÃO_HOMOLOGADO',
  compliance_reasons ARRAY<STRING>,
  first_seen_at TIMESTAMP COMMENT 'Primeira observação conhecida do ativo pelo RadarIA.',
  last_seen_at TIMESTAMP COMMENT 'Horário da varredura mais recente que observou o ativo; não é horário de notificação.',
  notified_admin BOOLEAN COMMENT 'TRUE após HTTP 2xx para finding não conforme; FALSE para ativos conformes ou alerta pendente.',
  updated_by STRING,
  alert_signature STRING COMMENT 'SHA-256 do ativo, status, tags observadas e motivos; identifica mudança no finding.',
  tag_read_status STRING
)
USING DELTA
COMMENT 'Tabela De-Para para homologação do inventário observado contra o AI Registry declarado.';

-- Exemplo de declaração APROVADA (substitua os valores e nunca reutilize o exemplo):
-- INSERT INTO governance.ai_inventory.ai_solution_registry VALUES (
--   'AI-EXEMPLO-001', 'exemplo', 'genie_agent', 'prod', 'area-exemplo',
--   'team-exemplo', 'CC-0001', 'internal', 'low', 'medium', 'production',
--   'allocated', true, 'grupo-governanca', current_timestamp(), current_timestamp()
-- );
