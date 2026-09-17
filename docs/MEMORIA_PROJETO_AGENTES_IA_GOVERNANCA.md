# Memória do Projeto — Governança de Agentes de IA no Databricks

**Última atualização:** 17 de setembro de 2026  
**Repositório:** `patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks`  
**Orquestração em estudo:** n8n

## Contexto permanente

O projeto é uma aplicação de **Governança de Dados para projetos de Inteligência Artificial dentro do Databricks**. A iniciativa é financiada pela Databricks. A base existente audita o Unity Catalog e apresenta análises de estrutura, documentação, tags, acesso, linhagem, segurança e aspectos de conformidade relacionados a dados pessoais. Também existem recursos de recomendações, histórico, relatórios e controles de FinOps de IA.

A linha de trabalho deste documento é estritamente de **Governança de Dados**. A menção a agentes, custos e n8n deve ser entendida como parte do controle governado do uso de dados e da atribuição de custos em projetos de IA no Databricks.

## Objetivo desta linha de trabalho

Criar um blueprint para o fluxo de entrada de agentes de IA. O blueprint deve:

- definir personas e responsabilidades;
- orientar um novo formulário de solicitação;
- registrar agentes com identidade estável;
- comparar agentes observados no Databricks com agentes regulamentados;
- enviar agentes não regulamentados para regularização;
- preservar evidências e trilha de auditoria;
- controlar atribuição, reconciliação e repasse de custos;
- impedir que custos sem identificação ou sem governança sejam repassados automaticamente.

## Limite de escopo

Incluir apenas atividades relacionadas a Governança de Dados, como cadastro, classificação, documentação, evidências, linhagem, acesso governado, identidade do agente, regularização, auditoria, atribuição e reconciliação de custos.

Não incluir nesta linha de trabalho o desenvolvimento do agente de negócio, treinamento de modelos, avaliação de qualidade de respostas, operação de pipelines de negócio, publicação de modelos ou alterações destrutivas no Databricks. Esses temas somente podem aparecer como dependências ou evidências necessárias para governança.

## Base técnica já identificada

- Aplicação full-stack com frontend React e backend TypeScript.
- Persistência PostgreSQL por Drizzle.
- Auditorias do Databricks com sessões, resultados, gaps, recomendações e score.
- Módulo de conformidade LGPD/GDPR com detecção heurística de dados pessoais.
- Módulos de FinOps de IA com limites, cache, roteamento de modelos e métricas de economia.
- Necessidade de distinguir ausência de evidência de valor zero ou conformidade comprovada.

## Decisões de desenho registradas

1. O n8n será usado como orquestrador de formulários, integrações, sincronizações, notificações e tarefas.
2. A aplicação e seu banco persistente devem manter o histórico, o cadastro e a trilha de auditoria.
3. O Databricks deve ser consultado como fonte de inventário, metadados e uso observado, respeitando as fontes e permissões aprovadas.
4. O estado regulatório deve ser separado do estado operacional do agente.
5. `regulated` exige evidências e decisão registrada; submissão de formulário não equivale a aprovação.
6. Agentes observados sem registro ou sem regulamentação entram em uma fila de regularização.
7. A correspondência automática deve priorizar `agent_id` e identificadores técnicos. Similaridade de nome somente sugere candidatos.
8. Custos devem ser classificados como atribuídos, não alocados ou ambíguos antes do repasse.
9. Por padrão, custos de agentes não regulamentados ficam bloqueados para repasse automático e seguem para exceção.
10. O histórico fechado não deve ser sobrescrito. Ajustes devem gerar novos registros relacionados ao lançamento original.
11. Nenhum token, segredo, amostra sensível ou conteúdo livre de dados pessoais deve aparecer em payloads e logs do n8n.

## Artefato principal

O blueprint detalhado está em [`BLUEPRINT_FLUXO_ENTRADA_AGENTES_IA.md`](BLUEPRINT_FLUXO_ENTRADA_AGENTES_IA.md). Ele contém personas, estados, formulário, regras de comparação, workflows n8n, modelo lógico de dados, indicadores, controles e roadmap.

## Vocabulário canônico

| Termo | Definição |
|---|---|
| **Agente observado** | Agente ou componente identificado em fonte técnica autorizada do Databricks. |
| **Agente registrado** | Agente que possui cadastro persistente no processo de governança. |
| **Agente regulamentado** | Agente registrado com requisitos e evidências validados. |
| **Agente não regulamentado** | Agente existente ou solicitado sem requisitos suficientes para estado `regulated`. |
| **Regularização** | Processo de completar evidências, corrigir identificação e obter decisão de governança. |
| **Custo não alocado** | Custo observado sem vínculo confiável com agente, projeto ou responsável. |
| **Custo bloqueado** | Custo identificado, mas inelegível para repasse segundo o estado de governança. |
| **Repasse** | Resultado aprovado para atribuição de custo a uma unidade, projeto ou centro responsável. |

## Próximos passos esperados

1. Confirmar a fonte oficial de inventário de agentes no Databricks.
2. Confirmar as fontes de uso e a tabela de preços para o cálculo de custos.
3. Validar os campos obrigatórios do formulário com Governança de Dados.
4. Definir os responsáveis que podem aprovar `regulated` e exceções.
5. Implementar o cadastro e a idempotência antes da sincronização de custos.
6. Testar o caso de agente observado sem registro e o caso de custo sem agente.

## Regra para futuras interações

Ao continuar este projeto, preservar o foco em Governança de Dados para IA no Databricks. Antes de propor novas tabelas, nós do n8n ou alterações na aplicação, verificar se a proposta contribui para pelo menos um destes resultados: identidade governada, evidência, conformidade, regularização, auditoria, atribuição de custos ou reconciliação.

