# RadarIA + n8n — governança de soluções de IA no Databricks

Projeto importável no n8n para inventariar os agentes dos workspaces Databricks, confrontar as tags observadas com um AI Registry declarado, notificar divergências e bloquear promoções a produção que não cumpram o contrato de governança.

## Arquitetura

```text
Schedule / execução manual no n8n
  └─ OAuth do Service Principal do workspace
      └─ Jobs API: dispara e acompanha o job radarIA
          └─ Notebook executado dentro do Databricks
              ├─ API da conta → enumeração de workspaces
              ├─ OAuth por workspace → Supervisor Agent, Genie Agent, Knowledge Assistant
              ├─ Leitura de tags nativas (endpoints serving / Genie)
              ├─ Delta: radar_scan_history + solution_mapping
              └─ Comparação com ai_solution_registry aprovado

n8n após o job
  ├─ Consulta findings ainda não notificados
  ├─ Webhook Teams (Adaptive Card) ou Slack (text)
  └─ Só após HTTP 2xx: notified_admin = TRUE

Pipeline CI/CD → Webhook do gate n8n
  ├─ Valida as 12 tags e exige environment=prod/lifecycle=production
  ├─ Consulta correspondência exata aprovada no AI Registry
  └─ Responde allow=true (200), inválido (422) ou não homologado (403)
```

A varredura dos agentes e as chamadas para a conta/workspaces acontecem **dentro do Databricks**. O n8n agenda e acompanha o job, lê o estado Delta, entrega notificações e serve como gate síncrono de CI/CD. A lógica de avaliação é determinística e não chama modelos ou serviços de LLM externos.

## Garantia de preservação das tags existentes

O RadarIA é **somente leitura para os ativos e tags nativos do Databricks**, inclusive soluções já em produção como `marteco`. A coleta usa `GET` para listar agentes/endpoints e ler tags de serving endpoints/Genie. O projeto não chama `POST`, `PUT`, `PATCH` ou `DELETE` para criar, substituir, atribuir ou remover tags, nem altera agentes, endpoints ou configurações de produção.

As gravações são restritas às tabelas Delta de governança (`radar_scan_history`, `radar_scan_workspace_status` e `solution_mapping`) e, após entrega de alerta, à coluna `notified_admin` dessa última tabela. O `MERGE` atualiza apenas o **snapshot observado** em `solution_mapping`; ele não envia valores de volta ao Databricks nem substitui tags nativas. Se houver diferença, o sistema registra a divergência, alerta e/ou bloqueia a promoção; a correção da tag nativa permanece manual, sob o processo de mudança da equipe responsável.

Os `POST` presentes nos workflows são usados para OAuth, `jobs/run-now` e para transportar instruções à SQL Statement API. Essas instruções são consultas `SELECT` ou uma atualização restrita aos marcadores de notificação da tabela Delta; não executam atribuição, substituição nem remoção de tags nativas.

Para produção, conceda à identidade do scanner apenas leitura nos workspaces/ativos/tags e escrita limitada ao schema Delta de governança. Não conceda permissões de edição de agentes, serving endpoints ou atribuições de tags para executar este projeto.

## Artefatos

- `workflows/01-radaria-inventory-alerts.json` — agendamento diário, disparo do job Databricks, polling com timeout, alertas e atualização `notified_admin`.
- `workflows/02-production-tag-gate.json` — endpoint autenticado para pipeline CI/CD; falha em modo **fail-closed**.
- `../databricks/radar_ia_inventory.py` — notebook/job Databricks que coleta, persiste e atualiza o De-Para.
- `../databricks/radar_ia_core.py` — cliente REST e validação de tags, separado para testes.
- `../databricks/GOVERNANCE_DATA_MODEL.md` — dicionário das tabelas Delta, chaves lógicas e ciclo de atualização.
- `../databricks/job-template.json` — template do Job com `max_concurrent_runs=1` e parâmetros sem segredos.
- `../databricks/sql/00-governance-schema.sql` — contrato de referência para tabelas Delta.
- `../databricks/sql/10-finops-ai-monitoring.sql` — consultas para DBUs, AI Gateway e resumo do dashboard de conformidade.
- `tests/test_radar_ia_core.py` — testes unitários sem conexão ou credenciais Databricks.
- `docker-compose.yml` e `.env.example` — ambiente local opcional para n8n.
- `REFERENCES.md` — documentação oficial n8n/Databricks usada nas decisões de implementação.

## Contrato das tags

O contrato implementa as 12 tags obrigatórias:

`ai_project_id`, `ai_solution`, `ai_component`, `environment`, `business_unit`, `owner_team`, `cost_center`, `data_classification`, `risk_tier`, `criticality`, `lifecycle`, `chargeback_model`.

Domínios controlados implementados a partir da documentação:

- `ai_component`: `supervisor_agent`, `genie_agent`, `knowledge_assistant`, `model_serving`, `vector_search`, `rag`, `tool`, `evaluator`.
- `environment`: `dev`, `qa`, `staging`, `prod`.
- `data_classification`: `public`, `internal`, `confidential`, `restricted`.
- `risk_tier`: `low`, `medium`, `high`, `critical`.
- `criticality`: `low`, `medium`, `high`, `mission_critical`.
- `lifecycle`: `design`, `pilot`, `production`, `retired`.
- `chargeback_model`: `direct`, `shared`, `allocated`.

Além disso, `ai_solution` deve ser slug minúsculo, `owner_team` não pode ser e-mail pessoal, `ai_component` precisa corresponder ao tipo de agente observado e `environment=prod` exige `lifecycle=production` (ou `retired` para um ativo já desativado). O gate de promoção aceita apenas `prod` + `production`.

Para chamadas via AI Gateway, a documentação recomenda as request tags `ai_project_id`, `use_case`, `consumer_application`, `channel`, `request_type`, `evaluation_flag` e `experiment_id` quando endpoints são compartilhados, há múltiplos casos de uso, a atribuição precisa ser feita por aplicação/canal ou avaliações/experimentos coexistem com produção. Essas tags são contexto da requisição e não substituem as 12 tags canônicas do endpoint/ativo.

Status gravados em `solution_mapping`:

| Status | Regra |
|---|---|
| `CONFORME` | 12 tags presentes/válidas e combinação exata aprovada no AI Registry. |
| `PARCIAL` | Solução declarada, mas há tag ausente, inválida ou divergente. |
| `NÃO_HOMOLOGADO` | ID/slug ausente ou solução sem declaração aprovada no AI Registry. |

## Pré-requisitos de configuração

1. Um workspace Databricks Azure com Jobs API, SQL Statement API e SQL Warehouse habilitados.
2. Um Service Principal técnico, sem dependência de usuário pessoal.
3. A identidade que executa o job deve poder listar workspaces na conta, acessar cada workspace relevante, ler os três tipos de agente e ler endpoints/tags.
4. Um Secret Scope no Databricks com as chaves do Service Principal de conta usadas pelo notebook. Os nomes padrão são `radaria-client-id` e `radaria-client-secret`; ambos são configuráveis por widgets. **Não** coloque esses valores no notebook, no n8n JSON, no repositório ou em parâmetros de job.
5. Uma declaração aprovada por ativo/combinação de tags na tabela AI Registry. O schema de referência incluído é `governance.ai_inventory.ai_solution_registry`; se o AI Registry corporativo já existir com outro catálogo/schema/nomes, adapte os widgets/tabela e o SQL de lookup ao contrato oficial antes de ativar.
6. Um Databricks Workflow/Job que execute `radar_ia_inventory.py` com `radar_ia_core.py` ao lado, usando o parâmetro `account_id` e os demais widgets mostrados no notebook.
7. Um webhook de entrada do Slack ou Teams e uma chave de autenticação para o webhook de gate CI/CD.

O documento recebido não informa o endereço físico nem o esquema da tabela corporativa do AI Registry. Por isso, o projeto inclui uma tabela Delta de referência, sem linhas de aprovação fictícias. Até que declarações válidas sejam cadastradas, o resultado correto é `NÃO_HOMOLOGADO`/bloqueado.

## Preparar o n8n local

```bash
cd n8n
cp .env.example .env
# Edite os valores do workspace, Job ID, SQL Warehouse e webhook no .env.
docker compose up -d
```

Abra `http://localhost:5678`. O volume Docker `n8n_data` mantém workflows e credenciais entre reinícios. O mapeamento de porta é somente `127.0.0.1`; para produção, publique atrás de HTTPS/reverse proxy, ajuste `N8N_PUBLIC_WEBHOOK_URL`, `N8N_HOST`, `N8N_PROTOCOL` e mantenha cookies seguros.

`N8N_BLOCK_ENV_ACCESS_IN_NODE=false` é necessário porque os workflows leem `$env`. A chave de criptografia do n8n é gerada no primeiro início e fica no volume persistente `n8n_data`; proteja esse volume e seus backups. Use uma instância n8n dedicada e mantenha restrito o acesso de edição: editores de workflows podem ler as variáveis do processo, inclusive o URL secreto do webhook. Não inclua outros segredos alheios ao projeto no mesmo processo.

## Preparar Databricks

1. Ajuste os três-partes `catalog.schema.table` no SQL se o Unity Catalog não usar os nomes de referência.
2. Execute `databricks/sql/00-governance-schema.sql` ou deixe o notebook criar as tabelas de controle. O catálogo pai (padrão `governance`) precisa existir e a identidade do job precisa de `USE CATALOG`, `USE SCHEMA`, `CREATE TABLE`, `SELECT`, `MODIFY` e escrita Delta adequados.
3. Popule `ai_solution_registry` a partir do AI Registry oficial, com **uma declaração aprovada e as 12 tags esperadas** por combinação provisionável. Não use os valores ilustrativos do comentário SQL.
4. Publique `radar_ia_inventory.py` e `radar_ia_core.py` no mesmo diretório de um Databricks Repo/Workspace. Configure os widgets do notebook (`account_id`, `secret_scope`, `registry_table`, `history_table`, `workspace_status_table`, `mapping_table`, `report_output_path`) no task do Job.
5. Use uma identidade de Job com autorização de leitura em cada workspace alvo. A execução não altera agentes nem endpoints; faz chamadas GET para o inventário e grava apenas as tabelas de governança Delta.
6. Crie o Workflow/Job a partir de `databricks/job-template.json`, substituindo o cluster existente, o caminho do notebook, o account ID e os catálogos necessários. O template configura `max_concurrent_runs=1`.
7. Execute o Job uma vez manualmente, confira quantidade de workspaces/erros/tags e verifique `radar_scan_history` e `solution_mapping` antes de ativar o cron.
8. Se o n8n atingir o limite de polling de 15 minutos, ele envia alerta operacional, mas não cancela a execução no Databricks; verifique o estado do run antes de reiniciá-lo.

Se nenhum workspace for lido com sucesso, o notebook interrompe a execução antes de gravar o mapeamento. Falhas isoladas por workspace ou endpoint são registradas em `radar_scan_workspace_status`, e a varredura continua nos demais.

Para gerar um XLSX, configure `report_output_path` no task para um diretório já existente e autorizado em Unity Catalog Volumes (`/Volumes/<catalog>/<schema>/<volume>/...`) ou DBFS (`dbfs:/...`). Deixe vazio para desativar. O job template fixa `openpyxl==3.1.5`; o relatório contém o De-Para e motivos de conformidade, portanto aplique ao destino os mesmos controles de acesso dos dados de governança. Se ativado e falhar, o job falha explicitamente após persistir Delta; o n8n envia alerta operacional e não marca os findings como notificados.

## Importar e configurar workflows

Importe cada JSON em **n8n → Workflows → Import from File**.

### Credencial Databricks usada pelos dois workflows

No node **OAuth Databricks (workspace)** de cada workflow, crie/vincule uma credencial **HTTP Basic Auth** do n8n:

- Username: Client ID do Service Principal do workspace.
- Password: Client Secret do Service Principal.
- O token é solicitado por `POST {DATABRICKS_WORKSPACE_URL}/oidc/v1/token` com `grant_type=client_credentials` e `scope=all-apis`; credenciais ficam no credential store criptografado do n8n.

O Service Principal n8n precisa, no mínimo, de permissão para executar o job (`CAN MANAGE RUN` ou o menor nível equivalente permitido pela política), usar o SQL Warehouse e consultar/atualizar as tabelas indicadas. Separe a identidade do n8n da identidade de varredura se sua política exigir segregação de funções.

### Workflow 01 — inventário e alertas

1. Defina `DATABRICKS_WORKSPACE_URL` sem barra final, `DATABRICKS_JOB_ID` e `DATABRICKS_SQL_WAREHOUSE_ID` no `.env`.
2. Defina `GOVERNANCE_MAPPING_TABLE` e `GOVERNANCE_REGISTRY_TABLE` em três partes.
3. Defina `GOVERNANCE_WEBHOOK_URL` e `GOVERNANCE_ALERT_CHANNEL=slack` ou `teams`. O endpoint deve aceitar os formatos documentados: Slack `text` ou Teams Adaptive Card.
4. Execute manualmente e confirme o run Databricks, consulta ao De-Para, entrega do alerta de teste e atualização Delta. O agendamento diário começa às 06:00 em `America/Sao_Paulo`.
5. O fluxo acompanha o Job por até 15 minutos (polling de 10s). Findings em estado não conforme só ficam `notified_admin=true` depois de o webhook responder HTTP 2xx. Um erro de envio mantém a notificação pendente para a próxima execução.

### Workflow 02 — gate de promoção

1. Configure autenticação `Header Auth` no node **Receber pedido do pipeline CI/CD** antes de ativar. O pipeline precisa enviar o mesmo header/segredo n8n.
2. Defina `GOVERNANCE_REGISTRY_TABLE` e `DATABRICKS_SQL_WAREHOUSE_ID`.
3. Ative o workflow e use a URL de produção do webhook com caminho `ai-governance/production-gate`.
4. Envie POST JSON no formato:

```json
{
  "request_id": "deploy-2026-001",
  "agent_name": "Genie Performance",
  "agent_type": "Genie Agent",
  "tags": {
    "ai_project_id": "AI-MARTECO-001",
    "ai_solution": "marteco",
    "ai_component": "genie_agent",
    "environment": "prod",
    "business_unit": "midia_marketing",
    "owner_team": "time-martech",
    "cost_center": "CC-4301",
    "data_classification": "internal",
    "risk_tier": "medium",
    "criticality": "high",
    "lifecycle": "production",
    "chargeback_model": "allocated"
  }
}
```

O exemplo acima é sintético: substitua pelos dados aprovados do Registry. O pipeline só deve prosseguir em HTTP 200 com `allow: true`. `422` significa validação local de tags falhou; `403` significa que a combinação exata não está aprovada no Registry. Configure o CI/CD para tratar timeout/erro do gate como bloqueio, nunca como autorização.

## Testes locais

Nenhum teste precisa de segredo, rede ou Spark:

```bash
python3 -m unittest discover -s n8n/tests -v
python3 -m json.tool n8n/workflows/01-radaria-inventory-alerts.json >/dev/null
python3 -m json.tool n8n/workflows/02-production-tag-gate.json >/dev/null
python3 -m json.tool databricks/job-template.json >/dev/null
```

Os testes cobrem a validação das 12 tags, divergências, regra de produção, paginação, resposta direta/envelope da Account API, deduplicação, continuação após falha isolada de workspace, APIs nativas somente GET e semântica do marcador de alerta sem reescrever `last_seen_at`. A validação estática do JSON não substitui o teste de importação na versão n8n que será usada.

## Segurança — ação necessária antes do go-live

O arquivo DBC fornecido para análise continha uma credencial de Service Principal em texto claro. O projeto deliberadamente **não** a reproduz. Revogue/rotacione esse Client Secret antes da implantação e remova o DBC de repositórios, compartilhamentos e históricos onde ele tenha sido publicado. Crie novas credenciais, armazene-as apenas em Databricks Secret Scope / n8n Credentials e restrinja as permissões ao mínimo necessário.

Não ative o gate de produção até confirmar: autenticação do webhook, tabela oficial do Registry, política de timeout fail-closed, permissões de leitura/escrita e teste de resposta bloqueada/autorizada em ambiente não produtivo.
