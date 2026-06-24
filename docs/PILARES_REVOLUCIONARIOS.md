# 🚀 Pilares Revolucionários de Governança

Esta documentação detalha os 4 novos pilares revolucionários implementados na branch `feat/revolucionario`, que transformam a ferramenta de um auditor passivo em um produto de Governança Ativa e Inteligente.

## 1. Governança de Auto-Cura (Self-Healing com IA)
* **Arquivo:** `server/self-healing.ts` / `client/src/components/SelfHealingPanel.tsx`
* **Descrição:** Utiliza Modelos de Linguagem (LLM) para analisar metadados e amostras de dados de tabelas não documentadas. A IA gera automaticamente descrições de negócio para a tabela e suas colunas, além de inferir tags de classificação (ex: PII, LGPD, Financeiro).
* **Fluxo:** 
  1. O usuário clica em "Analisar com IA".
  2. O backend extrai metadados (`DESCRIBE TABLE`) e amostra segura (`SELECT LIMIT 5`).
  3. O LLM retorna o diagnóstico e os comandos SQL corretivos.
  4. O usuário revisa e clica em "Aplicar no Databricks", executando os `COMMENT ON` e `ALTER TABLE SET TAGS` via API.

## 2. FinOps Integrado à Governança (Data ROI)
* **Arquivo:** `server/finops.ts` / `client/src/components/FinOpsPanel.tsx`
* **Descrição:** Cruza os dados de governança com as métricas de uso e faturamento do Unity Catalog (system.billing / system.access).
* **Impacto:** Permite que o CDO visualize exatamente quais tabelas geram mais custo em relação ao número de consultas. A ferramenta calcula o "Data ROI" e sugere arquivamento (Cold Storage) para tabelas de alto custo e baixo uso, pagando o custo da ferramenta através da economia gerada na nuvem.

## 3. Copiloto de Governança (Data Steward AI)
* **Arquivo:** `server/copilot.ts` / `client/src/components/CopilotChat.tsx`
* **Descrição:** Um assistente conversacional embutido no Dashboard.
* **Funcionalidade:** Permite que usuários sem conhecimento de SQL façam perguntas complexas em linguagem natural (ex: *"Quais tabelas contêm CPFs e não possuem máscara?"*). O agente traduz a intenção para consultas no `information_schema` do Databricks e retorna a resposta. Se o usuário solicitar uma alteração (ex: criar política de mascaramento), o agente gera o script SQL e pede aprovação explícita antes de executar (SecOps).

## 4. Monitoramento Contínuo (Real-time SecOps)
* **Arquivo:** `server/copilot.ts` / `client/src/components/SecOpsPanel.tsx`
* **Descrição:** Altera o paradigma de "fotografia pontual" para "monitoramento contínuo".
* **Funcionalidade:** Um painel de alertas no topo do Dashboard que monitora ativamente os logs de auditoria do Databricks. Se um comportamento anômalo for detectado (ex: concessão excessiva de privilégios `GRANT SELECT` em tabelas sensíveis ou múltiplas falhas de acesso), o sistema emite um alerta crítico em tempo real, sugerindo a ação corretiva imediata.

---

### Como testar localmente
1. Certifique-se de estar na branch `feat/revolucionario`.
2. Execute `pnpm dev` na raiz do projeto.
3. Acesse o Dashboard de uma auditoria concluída (`/dashboard/:id`).
4. Os novos painéis estarão visíveis logo abaixo dos KPIs principais.
