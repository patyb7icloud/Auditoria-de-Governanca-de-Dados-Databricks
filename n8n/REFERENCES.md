# Referências oficiais utilizadas

| Fonte oficial | Decisão baseada na documentação |
|---|---|
| [n8n HTTP Request node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) | Configuração de autenticação, corpo form-urlencoded/JSON, timeout, resposta e chamadas externas pelo node HTTP Request. |
| [n8n Code node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/) | Transformações JavaScript sem chamadas de rede; a rede fica nos nodes HTTP Request. |
| [n8n pagination cookbook](https://docs.n8n.io/code/cookbook/http-node/pagination/) | Paginação Databricks que retorna `next_page_token`. |
| [n8n Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/) | Retorno JSON e código HTTP do gate de promoção. |
| [n8n Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/) | Agendamento diário por cron, com timezone `America/Sao_Paulo`. |
| [n8n environment-variable security](https://docs.n8n.io/deploy/host-n8n/configure-n8n/basic-configuration/use-environment-variables/security) | `$env` é habilitado explicitamente; por isso, instância dedicada, variáveis limitadas e acesso de edição restrito. |
| [Databricks Account API — List workspaces](https://docs.databricks.com/api/account/workspaces/list) | A listagem retorna Workspace objects; o coletor aceita resposta em lista ou envelope e não envia `page_size` não documentado nesse endpoint. |
| [Databricks Supervisor Agents API](https://docs.databricks.com/api/supervisor-agents/v1/supervisor-agent) | A listagem aceita `page_size` até 100 e `page_token`; identifica o agente pelo `supervisor_agent_id` e lê o `endpoint_name`. |
| [Databricks Genie Spaces API](https://docs.databricks.com/api/genie/v1/genie-space) | Lista Genie Spaces com `page_size` até 100 e `page_token`. |
| [Databricks Knowledge Assistants API](https://docs.databricks.com/api/knowledge-assistants/v1/knowledge-assistant) | Lista Knowledge Assistants com `page_size` até 100 e `page_token`. |

**Nota de ciclo de vida:** o aviso de fim de vida da [legada Supervisor API](https://docs.databricks.com/aws/en/agents/agent-bricks/supervisor-api) trata do endpoint de agent-loop/OpenResponses, não do recurso de inventário `Supervisor Agents` documentado separadamente acima. Confirme que a API de inventário está habilitada no workspace-alvo; a automação não faz chamadas ao endpoint legado de agent-loop.

As regras de negócio (12 tags, domínios, De-Para, alertas e inventário) são derivadas dos dois documentos Word fornecidos pelo usuário e do notebook DBC. Nenhuma credencial dos anexos foi copiada para o projeto.
