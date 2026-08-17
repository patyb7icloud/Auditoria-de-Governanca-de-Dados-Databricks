# Manual da Ferramenta de Auditoria e Governança Databricks

**Projeto:** Auditoria de Governança de Dados no Databricks Unity Catalog  
**Branch de referência:** `feat/revolucionario`  
**Versão do código documentado:** `0abfe48`  
**Idioma da interface:** Português e Inglês  
**Responsável pela documentação:** Manus AI  
**Atualizado em:** 17 de agosto de 2026

## 1. Visão geral

A ferramenta automatiza o levantamento e a avaliação de governança de dados em um catálogo do **Databricks Unity Catalog**. Em vez de exigir que a equipe execute consultas SQL manualmente, a aplicação conecta-se ao workspace, consulta os metadados disponíveis no `information_schema`, executa seis análises de governança, persiste os resultados e apresenta um dashboard executivo com score, indicadores, lacunas e recomendações.

O produto foi concebido para apoiar equipes de governança, segurança, engenharia de dados, compliance e arquitetura. Ele não substitui uma auditoria jurídica ou uma validação operacional completa: o score representa somente as evidências que o workspace e as permissões do usuário permitem consultar.

> **Princípio de confiabilidade:** quando o Unity Catalog não fornece uma evidência verificável, a interface deve apresentar `N/D`, `Não verificado` ou `—`, e não um número de demonstração.

### 1.1. Capacidades principais

| Capacidade | Descrição |
|---|---|
| Conexão ao Databricks | Testa a comunicação com o workspace e usa um SQL Warehouse disponível para executar as consultas. |
| Auditoria integrada | Executa estrutura, glossário, tags, acesso, linhagem e segurança dinâmica em uma única sessão. |
| Score de governança | Consolida documentação, classificação, acesso, linhagem e segurança em uma escala de 0 a 100. |
| Dashboard executivo | Exibe KPIs, análises concluídas, alertas, gaps e recomendações priorizadas. |
| Classificação por tags | Conta tags em tabelas e colunas e calcula ativos distintos cobertos. |
| Conformidade LGPD/GDPR | Detecta potenciais colunas PII por nome e tipo, verifica cobertura de tags e sinaliza evidências ausentes. |
| Linhagem | Apresenta relações de origem e destino disponíveis na fonte consultada. |
| Histórico e comparação | Permite acompanhar sessões e comparar resultados entre auditorias. |
| Relatórios | Disponibiliza exportação dos dados da sessão e geração de relatório PDF. |
| Recursos avançados | Inclui módulos de copiloto, FinOps de IA, self-healing e monitoramento semanal quando configurados. |

## 2. Arquitetura

A aplicação é um monólito full-stack TypeScript. Durante o desenvolvimento, o mesmo processo Node.js serve o Vite e a API. Em produção, o processo serve os arquivos estáticos construídos pelo Vite e expõe a API tRPC, as rotas OAuth, o proxy de storage, o endpoint de PDF e o endpoint agendado de métricas.

```text
┌────────────────────────────────────────────────────────────────────┐
│                         Navegador                                 │
│ React + TypeScript + Tailwind + TanStack Query + tRPC client       │
│ Home · Connect · Audit · Dashboard · Report · History · Compliance │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ HTTP / JSON
                               │ /api/trpc/*
┌──────────────────────────────▼─────────────────────────────────────┐
│                         Servidor Node.js                           │
│ Express · tRPC · OAuth · PDF · Storage Proxy                      │
│ routers.ts · databricks.ts · lgpd-compliance.ts · db.ts           │
└──────────────┬───────────────────────────────┬─────────────────────┘
               │                               │
               │ Drizzle ORM                  │ Databricks SQL REST API
               │                               │ /api/2.0/sql/warehouses
┌──────────────▼─────────────┐   ┌──────────────▼──────────────────┐
│ PostgreSQL                  │   │ Databricks Unity Catalog        │
│ users                       │   │ information_schema               │
│ audit_sessions              │   │ table_tags / column_tags         │
│ analysis_results            │   │ table_privileges / lineage        │
│ IA, self-healing, métricas  │   │ funções, filtros e máscaras       │
└─────────────────────────────┘   └──────────────────────────────────┘
```

As referências de implementação são o roteador principal em [`server/routers.ts`](../server/routers.ts), os serviços de consulta em [`server/databricks.ts`](../server/databricks.ts), o módulo LGPD em [`server/lgpd-compliance.ts`](../server/lgpd-compliance.ts), a persistência em [`server/db.ts`](../server/db.ts) e o esquema Drizzle em [`drizzle/schema.ts`](../drizzle/schema.ts).

### 2.1. Fluxo de uma auditoria

O usuário configura o workspace e o catálogo na tela **Nova Auditoria**. Ao iniciar, o servidor cria uma sessão com status `running` e cria seis resultados de análise também em estado `running`. As análises são executadas sequencialmente. Cada resultado concluído é persistido com o payload, o tempo de execução e, quando aplicável, score, gaps e recomendações.

Depois que as análises terminam, o servidor calcula o score consolidado, atualiza a sessão com os KPIs principais e retorna o identificador da sessão. O cliente navega para o dashboard e consulta a sessão e seus resultados por tRPC. Se uma análise falhar, o erro é persistido e as demais análises continuam; a sessão fica `completed` quando pelo menos uma análise termina, ou `failed` quando todas falham.

## 3. Telas e navegação

| Tela | Rota funcional | Finalidade |
|---|---|---|
| Início | `/` | Apresenta a ferramenta e direciona para criar uma auditoria. |
| Nova Auditoria | `/connect` | Recebe host, catálogo e token ou opção de usar o Key Vault; testa conexão e inicia a sessão. |
| Execução | `/audit/:sessionId` | Acompanha as seis análises e seus estados. |
| Dashboard | `/dashboard/:sessionId` | Mostra score, KPIs, resultados, gaps, recomendações e monitoramento. |
| Relatório | `/report/:sessionId` | Exibe o relatório detalhado e permite exportação. |
| Histórico | `/history` | Lista as auditorias do usuário e apoia comparação entre sessões. |
| Compliance LGPD | `/compliance/:sessionId` | Apresenta risco, PII, recomendações, dados pessoais e progresso de conformidade. |
| Comparação | `/compare/:sessionA/:sessionB` | Compara KPIs e checklist de duas auditorias. |

### 3.1. Operação recomendada pela interface

Primeiro, abra **Nova Auditoria** e informe o host do workspace no formato `https://<workspace>.cloud.databricks.com`, o nome do catálogo alvo e um token com permissão suficiente para usar o SQL Warehouse e consultar os metadados. Quando o servidor estiver integrado ao Azure Key Vault, marque a opção correspondente e não informe o token no navegador.

Em seguida, use **Testar conexão**. O teste lista os SQL Warehouses e escolhe um warehouse em execução; se não houver um warehouse em execução, utiliza o primeiro warehouse disponível. Depois, inicie a auditoria. A tela de execução exibirá o avanço das seis análises e o dashboard será aberto com o resultado persistido.

No dashboard, leia primeiro o score e o alerta de problemas críticos. Depois, consulte os cards de estrutura, documentação, tags, grants, linhagem e segurança. As recomendações devem ser tratadas como plano de ação priorizado, não como confirmação automática de que uma correção foi aplicada.

## 4. Análises executadas

### 4.1. Mapeamento de estrutura

Consulta catálogos, schemas, tabelas e views disponíveis no catálogo informado. O resumo distingue o total de catálogos, schemas, tabelas e views. A contagem representa o que o usuário conseguiu consultar, portanto permissões incompletas podem produzir um inventário parcial.

### 4.2. Glossário de dados

Consulta comentários de tabelas e colunas no `information_schema`. A cobertura de documentação é calculada separadamente para tabelas e colunas:

```text
cobertura = itens documentados / total de itens × 100
```

Quando não há itens, a cobertura retorna zero porque o denominador é inexistente; essa situação deve ser interpretada junto com o total de objetos, e não isoladamente.

### 4.3. Classificação por tags

Consulta `information_schema.table_tags` e `information_schema.column_tags`. O resultado contém linhas de tags, distribuição por nome, quantidade de tags únicas e ativos distintos cobertos.

A métrica de cobertura não é a quantidade de linhas de tags. Um mesmo ativo pode possuir várias tags e, por isso, a ferramenta constrói uma chave de ativo com catálogo, schema e tabela e conta cada ativo uma única vez. Tags aplicadas em colunas também cobrem o ativo da tabela.

```text
ativos_cobertos = distinct(catalog_name, schema_name, table_name)
cobertura_de_tags = ativos_cobertos / (total_de_tabelas + total_de_views) × 100
```

Essa regra corrige o caso em que o catálogo possui tags somente em colunas. A implementação e o teste de regressão estão em [`server/databricks.ts`](../server/databricks.ts) e [`server/governance.test.ts`](../server/governance.test.ts). O resumo do dashboard também separa total de tags aplicadas, ativos cobertos e tags únicas.

### 4.4. Políticas de acesso

Consulta privilégios de catálogo, schema e tabela. O resumo mostra o total de grants, grantees distintos e distribuição por tipo. A análise identifica exposição de acesso, mas não concede nem revoga privilégios.

### 4.5. Linhagem de dados

Consulta relações de origem e destino expostas pela linhagem do Databricks. A visualização deve ser interpretada como a linhagem retornada pelo workspace e pelo nível de permissão disponível; ausência de uma aresta não prova que nenhuma dependência exista.

### 4.6. Segurança dinâmica

Consulta funções de mascaramento, filtros de linha e máscaras de coluna disponíveis no catálogo. A análise mensura evidências de mecanismos de proteção, mas não afirma que todo dado sensível esteja protegido quando os metadados não permitem essa conclusão.

## 5. Score de governança

O score é calculado pelo serviço `computeGovernanceScore` em [`server/databricks.ts`](../server/databricks.ts). Ele combina cinco dimensões: documentação, classificação, acesso, linhagem e segurança. A pontuação de cada dimensão é limitada ao peso definido pelo algoritmo e o resultado final é limitado ao intervalo de 0 a 100.

| Dimensão | Evidência principal | Peso máximo |
|---|---|---:|
| Documentação | Cobertura de comentários de tabelas e colunas | 25 |
| Classificação | Cobertura de ativos com tags de tabela ou coluna | 20 |
| Acesso | Existência e distribuição de grants | 20 |
| Linhagem | Arestas e ativos relacionados | 15 |
| Segurança | Funções, filtros e máscaras dinâmicas | 20 |

O score é uma medida de maturidade baseada em metadados, não uma certificação de conformidade. Um score alto não substitui testes de acesso, revisão de finalidade, validação de retenção, análise de contratos ou avaliação jurídica.

## 6. Módulo de conformidade LGPD/GDPR

O endpoint `lgpd.analyzeCompliance` executa uma análise real no Unity Catalog. Ele consulta estrutura, tags e colunas e usa padrões de nome e tipo para identificar potenciais dados pessoais. Entre os padrões suportados estão e-mail, CPF, CNPJ, telefone, endereço, data de nascimento, RG e cartão de crédito.

A identificação é heurística. Uma coluna é classificada quando o nome contém palavras-chave, quando o tipo de dado é compatível ou quando existe amostra com padrão reconhecível. Como a auditoria de metadados não lê automaticamente o conteúdo de todas as tabelas, o resultado deve ser validado pelo responsável de dados.

O módulo calcula colunas totais, PII identificada, PII etiquetada e risco de PII sem tag. Também examina nomes associados a retenção e consentimento. Para criptografia física, logs de acesso e prontidão operacional de DSR, o `information_schema` consultado pode não fornecer evidência suficiente; nesses casos a tela apresenta valor não verificável em vez de inventar um estado.

### 6.1. Interpretação dos estados LGPD

| Estado exibido | Interpretação |
|---|---|
| `Compliant` ou equivalente | A evidência consultada atende à regra específica avaliada. |
| `Partial` | Há evidências parciais, mas existem lacunas. |
| `Undefined` / `Não verificado` | O catálogo não trouxe evidência suficiente para concluir. |
| `N/D` ou `—` | A métrica não é verificável pelo conjunto atual de consultas. |

A tela não deve ser usada para declarar, sozinha, conformidade legal. Ela organiza evidências técnicas para orientar a investigação e o plano de ação.

## 7. API tRPC

A API é montada em `/api/trpc` pelo `appRouter` de [`server/routers.ts`](../server/routers.ts). Procedimentos protegidos exigem usuário autenticado; procedimentos públicos são destinados a leitura controlada, compatibilidade local ou operações que não expõem dados sensíveis por si só.

| Namespace | Procedimento | Tipo | Função |
|---|---|---|---|
| `auth` | `me` | query pública | Retorna usuário atual quando disponível. |
| `auth` | `logout` | mutation pública | Remove a sessão do navegador. |
| `databricks` | `testConnection` | mutation protegida | Testa host, token, catálogo e warehouse. |
| `databricks` | `startAudit` | mutation protegida | Cria sessão, executa seis análises e persiste o resumo. |
| `databricks` | `getSession` | query protegida | Retorna sessão e análises do usuário. |
| `databricks` | `getSessionPublic` | query pública | Retorna sessão por ID para cenários locais de leitura controlada. |
| `databricks` | `listSessions` | query protegida | Lista até 20 sessões recentes do usuário. |
| `databricks` | `compareSessions` | query protegida | Compara duas sessões autorizadas. |
| `databricks` | `exportReport` | query protegida | Produz metadados, resumo e resultados para exportação. |
| `lgpd` | `analyzeCompliance` | mutation protegida | Consulta o Unity Catalog e retorna análise LGPD. |
| `lgpd` | `detectTablePII` | query protegida | Detecta PII a partir de nomes, tipos e amostras fornecidas. |
| `lgpd` | `generateRecommendations` | query protegida | Gera recomendações a partir de uma análise LGPD. |
| `selfHealing` | `analyzeTable` | mutation protegida | Gera sugestões para uma tabela. |
| `selfHealing` | `applyFixes` | mutation protegida | Aplica comandos SQL aprovados pelo usuário. |
| `finops` | `analyzeROI` | query protegida | Analisa retorno e valor de ativos de dados. |
| `copilot` | `ask` | mutation pública | Responde a perguntas de governança conforme configuração. |
| `copilot` | `checkAnomalies` | query pública | Consulta anomalias de segurança. |
| `monitoring` | `getWeeklyMetrics` | query protegida | Obtém métricas semanais de IA. |

A definição de entrada de `databricks.startAudit` exige `host` e `catalog` e aceita `token` ou `useVault`. O fluxo LGPD aceita `databricksHost`, `catalog`, token opcional e `useVault`; quando `useVault` está habilitado ou o token não foi informado, o servidor busca o segredo no Azure Key Vault.

## 8. Persistência

A aplicação usa PostgreSQL por meio do Drizzle ORM. A sessão principal é armazenada em `audit_sessions`, enquanto cada análise é armazenada em `analysis_results`. Os demais módulos têm tabelas próprias para conhecimento do copiloto, sugestões de self-healing e métricas de economia de IA.

| Tabela | Responsabilidade |
|---|---|
| `users` | Usuários autenticados e identidade da aplicação. |
| `audit_sessions` | Catálogo auditado, status, score, KPIs, data e erros da sessão. |
| `analysis_results` | Status, payload, score, execução, gaps e recomendações de cada análise. |
| `copilot_knowledge_base` | Cache e histórico de respostas do copiloto. |
| `self_healing_knowledge_base` | Sugestões de documentação e correção por tabela. |
| `ai_weekly_metrics` | Métricas semanais, custos, cache hits e bloqueios. |
| `ai_cost_savings_log` | Economia estimada e chamadas de IA evitadas. |

As migrações estão em [`drizzle/`](../drizzle/), a configuração está em [`drizzle.config.ts`](../drizzle.config.ts) e os comandos de banco dependem de `DATABASE_URL`.

## 9. Instalação local

### 9.1. Pré-requisitos

É necessário ter Node.js compatível com o lockfile, `pnpm`, PostgreSQL acessível e um workspace Databricks com Unity Catalog e SQL Warehouse. O usuário do Databricks precisa conseguir listar ou selecionar um warehouse e consultar os objetos de `information_schema` usados pela auditoria.

### 9.2. Instalação

```bash
git clone https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks.git
cd Auditoria-de-Governanca-de-Dados-Databricks
git checkout feat/revolucionario
pnpm install
```

Crie um `.env` local. Esse arquivo é ignorado pelo Git e nunca deve ser enviado ao repositório.

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/databricks_governance
JWT_SECRET=gere-um-segredo-forte

# OAuth/identidade da aplicação, quando habilitado
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://seu-servidor-oauth
OWNER_OPEN_ID=seu-owner-open-id

# Azure Key Vault, opcional quando o token for informado diretamente na tela
AZURE_KEYVAULT_URL=https://seu-vault.vault.azure.net/

# Desenvolvimento local sem OAuth; utilizar somente em ambiente local controlado
DEV_AUTO_LOGIN=false
```

A aplicação carrega `dotenv/config` no servidor. Para preparar ou atualizar o banco, execute:

```bash
pnpm db:push
```

O comando gera as migrações Drizzle e aplica a configuração definida no projeto. Em ambientes compartilhados, revise a migração antes da aplicação e faça backup conforme a política da equipe.

### 9.3. Execução

Para desenvolvimento, execute:

```bash
pnpm dev
```

O servidor procura a porta definida em `PORT`, usando `3000` como padrão. Se a porta estiver ocupada, procura a próxima porta disponível dentro da faixa configurada pelo servidor. Para construir e iniciar em modo de produção:

```bash
pnpm build
pnpm start
```

## 10. Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---:|---|
| `DATABASE_URL` | Sim para persistência | String de conexão PostgreSQL usada pelo Drizzle. |
| `JWT_SECRET` | Sim em produção | Segredo usado pela sessão/cookies da aplicação. |
| `PORT` | Não | Porta preferencial; padrão `3000`. |
| `NODE_ENV` | Não | `development` ativa Vite; produção serve os arquivos construídos. |
| `VITE_APP_ID` | Conforme OAuth | Identificador da aplicação Manus/OAuth. |
| `OAUTH_SERVER_URL` | Conforme OAuth | URL base do servidor OAuth. |
| `OWNER_OPEN_ID` | Conforme OAuth | Identidade do proprietário configurada pela aplicação. |
| `AZURE_KEYVAULT_URL` | Opcional | Azure Key Vault para recuperar o token Databricks. |
| `DEV_AUTO_LOGIN` | Opcional | Ativa login automático apenas em desenvolvimento quando definido como `true`. |
| `LLM_MODEL_SMALL` | Opcional | Modelo menor usado por módulos de IA; há valor padrão no código. |
| `LLM_MODEL_REASONING` | Opcional | Modelo de raciocínio usado por módulos de IA; há valor padrão no código. |

Os scripts auxiliares de diagnóstico também aceitam `DATABRICKS_HOST`, `DATABRICKS_TOKEN` e `DATABRICKS_CATALOG`. Essas variáveis são úteis para execução de scripts fora da interface e não substituem a configuração de uma sessão pela tela.

## 11. Testes e qualidade

A suíte usa Vitest. Para executar todos os testes:

```bash
pnpm test
```

Para verificar tipos TypeScript:

```bash
pnpm check
```

Para validar o build de produção:

```bash
pnpm build
```

Na versão documentada, a suíte executou 39 testes aprovados. O teste de governança inclui uma regressão específica para impedir que tags somente em colunas sejam persistidas como cobertura zero. A validação de build pode emitir um aviso de chunk JavaScript maior que 500 kB; isso é aviso de otimização, não falha de compilação.

## 12. Scripts auxiliares

| Script | Finalidade |
|---|---|
| `scripts/runFullAudit.ts` | Executa auditoria completa por linha de comando usando variáveis Databricks. |
| `scripts/testConnection` e scripts relacionados | Testam conexão e consultas básicas. |
| `scripts/listTables.ts` | Lista objetos conforme a configuração local. |
| `scripts/checkAnalysisData.ts` | Inspeciona resultados de análise. |
| `scripts/debugSecurity.ts` | Auxilia o diagnóstico de segurança dinâmica. |
| `scripts/analyze_attached_csv.py` | Resume um CSV de auditoria e conta conjuntos de tags, grants e estrutura. |

Consulte cada script antes de executar em produção. Scripts de diagnóstico podem emitir dados de metadados na saída do terminal.

## 13. Segurança e governança operacional

Tokens do Databricks são credenciais sensíveis. Nunca os coloque em commits, screenshots, arquivos de documentação, logs persistentes ou variáveis expostas ao frontend. Prefira o Azure Key Vault quando a integração estiver disponível. O token informado na interface deve ter apenas as permissões necessárias para consultar os metadados e, quando necessário, executar os fluxos explicitamente autorizados.

As operações de self-healing podem aplicar comandos SQL. A recomendação é revisar a sugestão, validar o SQL em ambiente de teste, solicitar aprovação do responsável e só então executar a aplicação. O módulo de copiloto deve ser tratado como assistente: respostas geradas não são uma autorização para modificar políticas ou dados.

O acesso a sessões deve respeitar o modelo de autenticação configurado. O procedimento `getSessionPublic` existe para cenários de leitura local e compatibilidade; não o exponha em uma implantação pública sem revisar o risco de enumeração de IDs e a política de autorização.

## 14. Troubleshooting

### A tela informa que o Databricks não foi configurado

Abra **Nova Auditoria**, salve uma configuração válida e confirme se o host possui protocolo HTTPS, o catálogo existe e o token ainda está válido. Se a implantação usa Key Vault, confirme `AZURE_KEYVAULT_URL`, identidade do processo e permissão de leitura do segredo.

### A conexão falha ao listar warehouses

Verifique se o token pode acessar a API SQL, se existe SQL Warehouse disponível e se o workspace não exige uma política adicional de rede. A aplicação tenta escolher um warehouse em execução; caso não encontre, usa o primeiro retornado pela API.

### A cobertura de tags aparece como zero

Confirme se as consultas a `table_tags` e `column_tags` retornam linhas e se os campos `catalog_name`, `schema_name` e `table_name` estão presentes. A versão atual conta tags em tabelas e colunas por ativos distintos. Se todos os ativos estiverem sem tag, zero é o resultado correto; se houver linhas de tags, examine o payload persistido em `analysis_results`.

### O dashboard mostra menos objetos do que o esperado

A contagem é limitada ao que o token consegue consultar no catálogo. Compare as permissões do usuário com o escopo desejado e valide se o catálogo configurado é o mesmo que contém os objetos esperados.

### A análise LGPD retorna muitos campos não verificáveis

Isso significa que o `information_schema` consultado não expõe evidências suficientes para criptografia física, logs, DSR ou retenção operacional. Complemente a avaliação com configurações do workspace, políticas corporativas, logs de acesso, documentação de processos e validação dos proprietários dos dados.

### O servidor não inicia

Confirme `pnpm install`, a versão do Node.js, a disponibilidade da porta, a validade do `DATABASE_URL` e os requisitos de OAuth em produção. Execute `pnpm check` para separar erros de tipos de falhas de infraestrutura.

## 15. Limitações conhecidas

A ferramenta analisa metadados e políticas visíveis ao usuário do Databricks. Ela não garante que todos os objetos do workspace sejam visíveis, não inspeciona automaticamente todos os valores das tabelas, não certifica a conformidade jurídica e não confirma, sozinha, criptografia, retenção ou execução de workflows de DSR.

A detecção de PII é heurística e pode produzir falsos positivos e falsos negativos. Tags indicam classificação, mas não provam que o conteúdo esteja correto. O score é comparável entre sessões somente quando o escopo, as permissões e as regras de cálculo permanecem equivalentes.

## 16. Referências de implementação

| Assunto | Arquivo |
|---|---|
| Rotas e procedimentos tRPC | [`server/routers.ts`](../server/routers.ts) |
| Consultas e score Databricks | [`server/databricks.ts`](../server/databricks.ts) |
| Análise LGPD e PII | [`server/lgpd-compliance.ts`](../server/lgpd-compliance.ts) |
| Persistência | [`server/db.ts`](../server/db.ts) |
| Modelo de dados | [`drizzle/schema.ts`](../drizzle/schema.ts) |
| Dashboard | [`client/src/pages/Dashboard.tsx`](../client/src/pages/Dashboard.tsx) |
| Compliance | [`client/src/pages/Compliance.tsx`](../client/src/pages/Compliance.tsx) |
| Configuração | [`client/src/pages/Connect.tsx`](../client/src/pages/Connect.tsx) |
| Testes de governança | [`server/governance.test.ts`](../server/governance.test.ts) |
| Configuração de ambiente | [`server/_core/env.ts`](../server/_core/env.ts) |
| Inicialização do servidor | [`server/_core/index.ts`](../server/_core/index.ts) |

## Referências externas

[1]: https://docs.databricks.com/aws/en/data-governance/unity-catalog 
