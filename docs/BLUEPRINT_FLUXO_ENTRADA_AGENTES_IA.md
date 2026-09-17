# Blueprint de Governança para Entrada de Agentes de IA no Databricks

**Versão:** 1.0  
**Data de criação:** 17 de setembro de 2026  
**Escopo:** Governança de Dados para projetos de Inteligência Artificial executados no Databricks  
**Orquestração prevista:** n8n  
**Sistema analisado:** Auditoria de Governança de Dados Databricks

## 1. Objetivo

Este blueprint define o fluxo padrão para registrar, analisar, regularizar e acompanhar agentes de Inteligência Artificial que utilizam dados, modelos ou recursos do Databricks. Ele serve como base para um formulário de solicitação, para workflows no n8n e para as estruturas persistentes que suportarão o controle de conformidade e o repasse de custos.

O princípio central é separar três perguntas que hoje podem ser confundidas:

1. **O agente existe ou foi observado no ambiente?**
2. **O agente está regulamentado segundo os requisitos de governança?**
3. **O custo gerado pelo agente pode ser identificado, conciliado e repassado?**

A existência de um agente não significa que ele esteja regulamentado. Da mesma forma, a existência de custo não significa que o custo tenha sido corretamente atribuído a um agente, projeto ou centro responsável.

> O blueprint não cria uma certificação jurídica. Ele estabelece um processo de governança, evidências verificáveis, trilhas de auditoria e regras operacionais para decisão.

## 2. Contexto do projeto

O projeto base é uma aplicação de auditoria do Databricks Unity Catalog. Ela já consolida análises de estrutura, documentação, tags, acesso, linhagem, segurança e conformidade relacionada a dados pessoais. Também possui histórico de auditorias, recomendações e controles de FinOps de IA.

A nova capacidade deve ser tratada como uma extensão de **Governança de Dados para agentes de IA**. O n8n será a camada de orquestração dos eventos e integrações. A aplicação e seu banco persistente devem permanecer como fonte de histórico, evidência e consulta. O Databricks deve ser consultado como fonte de inventário, metadados e uso observado, conforme as fontes autorizadas pelo ambiente.

## 3. Princípios de governança

### 3.1 Registro antes do uso governado

Todo agente observado no ambiente deve possuir um identificador estável e um registro de governança. Agentes encontrados no ambiente sem registro devem ser classificados como **observados sem registro** e encaminhados para regularização.

### 3.2 Regulamentação baseada em evidência

O estado `regulado` somente pode ser atribuído quando os campos obrigatórios estiverem preenchidos e as evidências exigidas tiverem sido validadas. Um formulário enviado não é, sozinho, uma aprovação.

### 3.3 Identidade determinística

O vínculo entre um agente informado no formulário, um agente observado no Databricks e uma linha de custo deve usar, nesta ordem:

1. `agent_id` estável e único;
2. identificador técnico do deployment ou serviço, quando disponível;
3. combinação de ambiente, catálogo, schema, nome e versão;
4. correspondência aproximada apenas para sugerir candidatos, nunca para aprovar automaticamente.

### 3.4 Segurança contra duplicidade

Toda submissão deve ser idempotente. Reenvios do mesmo formulário não devem criar agentes duplicados, solicitações duplicadas ou lançamentos de custo duplicados.

### 3.5 Trilha de auditoria

Mudanças de status, alterações de proprietário, validações, rejeições, exceções de custo e aprovações devem registrar quem executou a ação, quando, qual era o estado anterior, qual é o novo estado e qual evidência justificou a decisão.

### 3.6 Separação entre governança e execução

O fluxo pode criar registros, tarefas, alertas e recomendações. Ele não deve alterar permissões, eliminar dados, publicar modelos ou executar ações destrutivas sem uma etapa de aprovação explícita fora do escopo automático.

## 4. Personas e responsabilidades

| Persona | Responsabilidade no fluxo | Decisões principais |
|---|---|---|
| **Solicitante do agente** | Inicia o cadastro e fornece o contexto do caso de uso. | Confirma propósito, dados utilizados, ambiente e responsável técnico. |
| **Proprietário do agente** | Responde pelo uso governado do agente. | Mantém evidências, trata pendências e responde por custos atribuídos. |
| **Data Steward** | Avalia metadados, classificação, finalidade e qualidade das evidências. | Aprova ou devolve requisitos de dados e documentação. |
| **Governança de Dados** | Administra a política, exceções, critérios de regularização e auditoria. | Define o estado regulatório e aprova exceções. |
| **FinOps / gestor de custos** | Confere atribuição, período, base de cálculo e divergências. | Aprova a reconciliação e o repasse conforme a política vigente. |
| **Administrador Databricks** | Disponibiliza inventário e uso observado com privilégio mínimo. | Corrige metadados técnicos e acessos quando formalmente solicitado. |
| **Auditor / liderança** | Consulta evidências, indicadores e histórico. | Acompanha cobertura, risco, custo não atribuído e tempo de regularização. |
| **n8n** | Orquestra eventos, validações, sincronizações e notificações. | Não substitui a autoridade de aprovação humana. |

## 5. Estados do agente

| Estado | Significado | Permite repasse? |
|---|---|---:|
| `proposed` | Solicitação recebida, ainda não validada. | Não |
| `pending_evidence` | Faltam informações ou evidências obrigatórias. | Não |
| `in_review` | Governança ou Data Steward está analisando o cadastro. | Não |
| `regulated` | Requisitos obrigatórios validados e aprovação registrada. | Sim, sujeito à reconciliação de custos |
| `unregulated` | Agente existe ou foi solicitado, mas não atende aos requisitos. | Não por padrão; custo segue para exceção |
| `exception_approved` | Exceção formal aprovada por prazo e responsável definidos. | Sim, com ressalva e validade |
| `suspended` | Uso governado suspenso por risco, evidência vencida ou decisão de governança. | Não |
| `rejected` | Solicitação não aprovada. | Não |
| `retired` | Agente descontinuado. | Não para novos períodos |

O estado de regulamentação deve ser separado do estado operacional. Um agente pode estar operacional no Databricks e, ao mesmo tempo, estar `unregulated` do ponto de vista de governança.

## 6. Etapas do fluxo de entrada

### Etapa 1 — Solicitação

O solicitante preenche o formulário inicial. O sistema gera `request_id`, registra o horário e identifica o solicitante autenticado ou, quando isso não for possível, grava a origem da submissão para posterior validação.

### Etapa 2 — Validação automática

O n8n normaliza nomes, verifica campos obrigatórios, valida formatos, aplica limites de tamanho, identifica duplicidade e calcula uma chave de idempotência. Dados sensíveis não devem ser gravados em logs do n8n.

### Etapa 3 — Registro provisório

A solicitação válida cria ou atualiza um registro de agente em estado `proposed` ou `pending_evidence`. O registro deve manter a relação com o projeto de IA, o ambiente Databricks e o responsável.

### Etapa 4 — Enriquecimento técnico

O n8n consulta as fontes autorizadas do Databricks para verificar se o agente, deployment, serviço, catálogo, schema, tabelas e modelos informados existem. A resposta deve ser persistida como evidência datada, com a origem e o resultado da consulta.

### Etapa 5 — Análise de governança

A solicitação é comparada aos requisitos mínimos: finalidade, proprietário, dados utilizados, classificação, base de uso autorizada, documentação, tags, linhagem conhecida, controles de acesso e identificação para custos. Ausências geram pendências explícitas.

### Etapa 6 — Decisão

A Governança de Dados ou o Data Steward aprova, devolve para complementação, rejeita ou concede uma exceção com prazo. O workflow nunca deve converter `proposed` diretamente em `regulated` sem evidências e decisão registrada.

### Etapa 7 — Ativação do vínculo de custos

Somente após a identificação do agente e de suas chaves técnicas o sistema tenta vincular uso e custo. Se o uso for encontrado sem chave suficiente, o custo é classificado como `unallocated` ou `ambiguous` e entra na fila de exceções.

### Etapa 8 — Acompanhamento contínuo

Alterações de metadados, perda de evidência, expiração de exceção, surgimento de agente não registrado e custo sem atribuição devem reabrir a análise ou gerar uma nova pendência.

## 7. Formulário de solicitação

### 7.1 Dados do solicitante e responsabilidade

- Nome e e-mail do solicitante.
- Área, produto ou unidade responsável.
- Proprietário de negócio.
- Proprietário técnico.
- Data prevista de entrada em uso.
- Ambiente: desenvolvimento, homologação ou produção.

### 7.2 Identidade do agente

- Nome amigável do agente.
- `agent_id` proposto ou existente.
- Descrição objetiva do propósito.
- Versão ou release.
- Identificador do deployment, endpoint, job ou aplicação, quando aplicável.
- Catálogo, schema e objetos do Unity Catalog utilizados.
- Modelo ou modelos utilizados, quando esse metadado fizer parte do inventário governado.

### 7.3 Dados e governança

- Categorias de dados acessadas.
- Indicação de dados pessoais, sensíveis, financeiros, confidenciais ou restritos.
- Finalidade de uso.
- Base autorizadora ou justificativa interna aplicável.
- Retenção prevista para entradas, saídas, prompts e logs.
- Necessidade de dados de produção.
- Tags de classificação esperadas.
- Dependências de tabelas, views, volumes, funções ou modelos.
- Evidências anexas ou links para documentação aprovada.

### 7.4 Custos e atribuição

- Centro de custo.
- Projeto, produto ou unidade para repasse.
- Responsável financeiro.
- Chaves técnicas que aparecerão nos registros de uso.
- Critério de rateio para custos compartilhados.
- Limite ou orçamento de referência, se existir.
- Data inicial do período de cobrança.

### 7.5 Declarações

O formulário deve exigir confirmação de que as informações são verdadeiras, que os dados utilizados foram identificados de boa-fé e que o proprietário tratará as pendências dentro do prazo. A declaração deve ser registrada como evidência, sem ser interpretada como aprovação automática.

## 8. Modelo de comparação entre agentes observados e agentes regulamentados

A comparação deve ocorrer em cada sincronização de inventário e no fechamento de custos.

| Resultado da comparação | Interpretação | Ação |
|---|---|---|
| Encontrado no inventário e regulamentado | Agente conhecido e apto no cadastro. | Prosseguir para validação de uso e custo. |
| Encontrado no inventário e não regulamentado | Agente existente sem aprovação ou com evidência insuficiente. | Criar item de regularização e classificar custo como exceção. |
| Não encontrado no inventário, mas registrado | Cadastro existe, porém não houve evidência recente de uso ou deployment. | Marcar como `stale`, solicitar confirmação e não atribuir uso inexistente. |
| Encontrado no inventário e sem registro | Agente desconhecido do processo. | Criar registro provisório, alertar Governança e iniciar regularização. |
| Encontrado com identidade ambígua | Não foi possível determinar o agente com segurança. | Não aprovar vínculo automático; enviar para revisão manual. |
| Regulamentado com evidência vencida | O agente permanece conhecido, mas a aprovação perdeu validade. | Reabrir revisão e bloquear novo repasse por padrão. |

### 8.1 Regra de identificação

A chave de comparação deve ser composta por `agent_id` quando existir. Na ausência dessa chave, o sistema deve utilizar os identificadores técnicos disponíveis. A similaridade textual de nomes serve apenas para gerar uma sugestão de correspondência e nunca para efetivar o vínculo sem revisão.

### 8.2 Saída mínima da reconciliação

Cada execução deve produzir:

- total de agentes observados;
- total de agentes registrados;
- total regulamentado;
- total não regulamentado;
- total sem correspondência;
- total com identidade ambígua;
- lista de novos agentes;
- lista de agentes que perderam evidência;
- lista de custos sem agente confirmado;
- data, período, fonte e versão da execução.

## 9. Sistema de controle e repasse de custos

### 9.1 Separação das camadas

O controle deve distinguir:

1. **Uso observado:** registros técnicos de consumo no Databricks ou em fonte autorizada.
2. **Custo calculado:** consumo multiplicado pela tabela de preços ou regra financeira vigente.
3. **Atribuição:** vínculo entre custo e agente, projeto, unidade ou centro de custo.
4. **Reconciliação:** comparação entre total observado, total atribuído e total não atribuído.
5. **Repasse:** resultado aprovado para o período, com versão da regra e responsável pela aprovação.

### 9.2 Estados do lançamento de custo

- `observed`: uso recebido da fonte.
- `calculated`: custo calculado.
- `attributed`: custo vinculado a agente e responsável.
- `unallocated`: não há chave suficiente para atribuição.
- `ambiguous`: há mais de um candidato possível.
- `under_review`: divergência ou exceção em análise.
- `reconciled`: período conferido.
- `approved_for_chargeback`: autorizado para repasse.
- `contested`: responsável contestou o lançamento.
- `adjusted`: ajuste registrado com justificativa.
- `closed`: período encerrado.

### 9.3 Regra padrão de elegibilidade

A política inicial recomendada é:

- agente `regulated`: elegível para repasse após reconciliação;
- agente `exception_approved`: elegível somente até a data e condição da exceção;
- agente `unregulated`, `proposed`, `pending_evidence` ou `suspended`: custo visível e mensurado, mas bloqueado para repasse automático e enviado para exceção;
- custo sem agente identificado: não pode ser atribuído automaticamente; deve compor o indicador de custo não alocado.

Essa regra deve ser parametrizada para permitir decisão institucional diferente sem alterar o histórico já fechado.

### 9.4 Fórmulas de controle

Para um período `P`:

```text
custo_calculado = consumo_observado × preço_unitário_vigente

custo_atribuído = soma dos lançamentos com vínculo confirmado

custo_não_alocado = custo_total_observado - custo_atribuído

cobertura_de_atribuição = custo_atribuído / custo_total_observado

custo_elegível_para_repasse = soma dos lançamentos atribuídos a agentes elegíveis

custo_bloqueado_por_governança = soma dos lançamentos de agentes não elegíveis

variação_de_reconciliação = total_da_fonte_financeira - custo_total_observado
```

O sistema deve preservar os valores de origem, a versão do preço, o período, o fuso horário e a regra de rateio. Não se deve sobrescrever um lançamento fechado; ajustes devem ser novos registros relacionados ao lançamento original.

### 9.5 Custos compartilhados

Quando um consumo não puder ser atribuído diretamente a um agente, o rateio deve utilizar uma regra aprovada, como participação no consumo observável, unidades de processamento, chamadas, horas de execução ou outra métrica técnica confiável. A regra deve ser informada no registro e o resultado deve ser distinguido de um custo diretamente identificado.

## 10. Workflows n8n propostos

### `WF-AG-01 — Entrada e registro do agente`

**Gatilho:** formulário ou webhook.  
**Sequência:** receber solicitação → normalizar dados → validar schema → calcular idempotency key → consultar duplicidade → criar ou atualizar registro provisório → registrar evento de auditoria → notificar pendências → responder com `request_id` e status.

**Resultado:** solicitação persistida, com estado inicial e lista de pendências.

### `WF-AG-02 — Enriquecimento e validação no Databricks`

**Gatilho:** nova solicitação válida ou reprocessamento manual.  
**Sequência:** ler chaves técnicas → consultar inventário autorizado → armazenar evidências → comparar com registro → classificar correspondência → gerar tarefas de regularização → atualizar status.

**Resultado:** agente vinculado, não vinculado ou ambíguo, sempre com evidência datada.

### `WF-AG-03 — Decisão de regularização`

**Gatilho:** submissão de evidências ou decisão de Governança.  
**Sequência:** receber decisão → validar autoridade → conferir campos obrigatórios → registrar versão da evidência → atualizar estado → iniciar ou encerrar tarefas → publicar evento de mudança.

**Resultado:** `regulated`, `unregulated`, `exception_approved`, `rejected` ou outro estado permitido.

### `WF-AG-04 — Sincronização de agentes observados`

**Gatilho:** execução agendada ou acionamento manual.  
**Sequência:** coletar inventário → normalizar → comparar com cadastro → detectar novos agentes → detectar agentes sem evidência recente → abrir pendências → atualizar snapshot.

**Resultado:** fotografia auditável do inventário e fila de regularização.

### `WF-AG-05 — Apuração e repasse de custos`

**Gatilho:** fechamento diário, semanal ou mensal, conforme a política financeira.  
**Sequência:** coletar uso → calcular custo → resolver identidade → vincular agente → aplicar elegibilidade regulatória → separar atribuídos, bloqueados e não alocados → gerar resumo → solicitar aprovação de fechamento.

**Resultado:** período de custo pronto para reconciliação, sem repasse automático de exceções.

### `WF-AG-06 — Reconciliação do período`

**Gatilho:** aprovação do responsável por custos.  
**Sequência:** comparar total técnico com fonte financeira → calcular variação → tratar divergências → fechar período → congelar versão → registrar aprovação.

**Resultado:** período `closed` ou devolvido para `under_review`.

## 11. Estrutura lógica mínima de dados

### `agent_registry`

Deve armazenar identidade, proprietários, ambiente, propósito, estado regulatório, versão da aprovação, data de validade e chaves técnicas.

### `agent_governance_evidence`

Deve armazenar tipo de evidência, localização, hash ou identificador, versão, data de coleta, validade, resultado de validação e responsável.

### `agent_observation_snapshots`

Deve armazenar a fonte consultada, o período da observação, o identificador técnico encontrado, metadados relevantes, hash do registro e resultado da correspondência.

### `agent_regularization_tasks`

Deve armazenar pendência, requisito, prioridade, responsável, prazo, estado, data de resolução e relação com evidência.

### `agent_cost_records`

Deve armazenar período, fonte, consumo, unidade, preço, custo calculado, agente relacionado, chave de atribuição, estado, regra de rateio e referência de ajuste.

### `agent_audit_events`

Deve armazenar entidade, evento, ator, data, estado anterior, estado novo, correlação, justificativa e metadados não sensíveis.

## 12. Indicadores do painel de Governança de Agentes

O painel deve mostrar os indicadores por período e por ambiente:

- cobertura do cadastro: agentes registrados / agentes observados;
- taxa de regulamentação: agentes regulamentados / agentes registrados;
- agentes não regulamentados;
- agentes sem correspondência;
- agentes com evidência vencida;
- custo total observado;
- custo atribuído;
- cobertura de atribuição;
- custo não alocado;
- custo bloqueado por governança;
- custo elegível para repasse;
- variação de reconciliação;
- tempo médio de regularização;
- pendências vencidas por responsável.

Todos os indicadores devem exibir a data da última atualização, a fonte e a mensagem `não verificado` quando a fonte estiver indisponível. Ausência de evidência não deve ser convertida em zero.

## 13. Controles de segurança e privacidade

O formulário deve coletar apenas os dados necessários para governança. Tokens, segredos, amostras de dados pessoais e conteúdo sensível de prompts não devem ser enviados ao n8n como campos livres nem aparecer em logs.

As credenciais de acesso ao Databricks devem ficar no mecanismo seguro de credenciais do n8n ou em cofre aprovado. O workflow deve utilizar contas com privilégio mínimo e acesso somente às fontes necessárias para inventário e uso.

A correlação entre agente e custo deve usar identificadores técnicos. Informações pessoais de solicitantes e responsáveis devem ser protegidas por controle de acesso, retenção definida e trilha de auditoria.

## 14. Critérios de aceite do MVP

O MVP será considerado funcional quando:

1. um solicitante conseguir registrar um agente por formulário;
2. o sistema impedir duplicidade por reenvio;
3. a solicitação gerar um registro persistente e uma trilha de auditoria;
4. o workflow consultar o inventário autorizado e registrar a evidência;
5. agentes observados sem regulamentação entrarem automaticamente na fila de regularização;
6. agentes regulamentados e não regulamentados forem distinguidos no painel;
7. o custo de um período puder ser atribuído, bloqueado ou classificado como não alocado;
8. o total observado puder ser reconciliado contra a fonte financeira;
9. nenhum custo não identificado for enviado automaticamente para repasse;
10. todas as exceções tiverem responsável, prazo e justificativa.

## 15. Roadmap de implementação

### Fase 1 — Fundação do cadastro

Criar o formulário, o registro de agente, o catálogo de estados, a idempotência e os eventos de auditoria. Integrar o resultado ao histórico da aplicação de governança.

### Fase 2 — Comparação com o Databricks

Implementar a coleta de inventário, a normalização dos identificadores, o snapshot de observações e a fila de agentes não regulamentados.

### Fase 3 — Regularização

Implementar o catálogo de evidências, as tarefas por requisito, os prazos, as decisões e o fluxo de exceção.

### Fase 4 — Controle de custos

Implementar a ingestão de uso, o cálculo por período, as chaves de atribuição, a classificação de custos não alocados e o bloqueio de repasse por estado regulatório.

### Fase 5 — Reconciliação e painel executivo

Implementar fechamento de período, variação entre fontes, aprovação, indicadores de governança e relatórios auditáveis.

## 16. Decisões ainda necessárias

Antes da implementação final no n8n, a equipe deve confirmar:

- qual é a fonte oficial de inventário dos agentes no ambiente Databricks;
- quais registros de uso e qual tabela de preços serão usados para custo;
- quais campos constituem a chave técnica obrigatória do agente;
- quais requisitos tornam um agente `regulated`;
- se o repasse de agente não regulamentado será sempre bloqueado ou se haverá política de exceção;
- a periodicidade de sincronização e fechamento;
- os responsáveis por Governança de Dados, Data Steward e FinOps;
- o prazo padrão de regularização;
- a política de retenção para evidências e lançamentos de custo.

## 17. Referências

[1]: https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks/blob/main/README.md "Auditoria de Governança de Dados Databricks — visão geral do projeto"

[2]: https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks/blob/main/docs/FINOPS_IA_ARQUITETURA.md "Arquitetura de FinOps de IA do projeto"

[3]: https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks/blob/main/docs/MANUAL_DA_FERRAMENTA.md "Manual operacional da ferramenta"

[4]: https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks/blob/main/drizzle/schema.ts "Schema persistente atual do projeto"

O conteúdo normativo e operacional deste blueprint é uma proposta de desenho para validação da equipe. As referências acima descrevem a base técnica existente do repositório.

## 18. Registro de alterações

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 2026-09-17 | Primeira versão do blueprint para entrada, regulamentação, comparação de agentes e controle de repasse de custos. |

[1] [2] [3] [4]

