# Documentação Técnica — Auditoria de Governança de Dados Databricks

**Versão:** 1.0.0  
**Repositório:** [github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks](https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks)  
**Stack principal:** React 19 · TypeScript · Tailwind CSS 4 · tRPC 11 · Express 4 · Drizzle ORM · PostgreSQL

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Banco de Dados](#5-banco-de-dados)
6. [Integração com Databricks](#6-integração-com-databricks)
7. [As Seis Análises de Governança](#7-as-seis-análises-de-governança)
8. [Score de Governança](#8-score-de-governança)
9. [API tRPC — Referência de Endpoints](#9-api-trpc--referência-de-endpoints)
10. [Exportação de Relatórios](#10-exportação-de-relatórios)
11. [Grafo de Linhagem de Dados](#11-grafo-de-linhagem-de-dados)
12. [Comparação de Auditorias](#12-comparação-de-auditorias)
13. [Autenticação e Segurança](#13-autenticação-e-segurança)
14. [Instalação e Execução Local](#14-instalação-e-execução-local)
15. [Deploy em Cloud](#15-deploy-em-cloud)
16. [Variáveis de Ambiente](#16-variáveis-de-ambiente)
17. [Testes](#17-testes)
18. [Guia de Uso](#18-guia-de-uso)

---

## 1. Visão Geral

A **Auditoria de Governança de Dados Databricks** é uma aplicação web full-stack que automatiza o processo de levantamento, mapeamento e análise de governança no **Databricks Unity Catalog**. A ferramenta conecta-se diretamente à API REST do Databricks SQL, executa seis análises estruturadas em sequência e consolida os resultados em um dashboard executivo com score de maturidade de governança (0–100).

O objetivo principal é eliminar o trabalho manual de auditoria descrito no *Guia Passo a Passo de Levantamento e Mapeamento de Governança no Databricks*, substituindo consultas SQL manuais por uma interface visual que qualquer membro da equipe de dados pode operar sem conhecimento técnico avançado.

As principais capacidades da ferramenta são:

- Conexão segura ao workspace Databricks via Personal Access Token (PAT)
- Execução automatizada das seis análises de governança em uma única operação
- Dashboard executivo com score, KPIs e recomendações geradas automaticamente
- Visualização interativa da linhagem de dados em grafo (React Flow + Dagre)
- Exportação de relatórios em JSON, CSV e PDF executivo
- Histórico de auditorias com gráfico de evolução temporal do score
- Comparação detalhada entre duas auditorias com 7 KPIs e checklist por análise

---

## 2. Arquitetura do Sistema

A aplicação segue uma arquitetura monolítica de camada única com separação clara entre cliente e servidor, ambos servidos pelo mesmo processo Node.js em produção.

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENTE (React 19)                        │
│  Pages: Home · Connect · Audit · Dashboard · Report · History    │
│  Components: AppLayout · LineageGraph · ComparisonTable          │
│  State: tRPC + TanStack Query (cache, optimistic updates)        │
└──────────────────────┬───────────────────────────────────────────┘
                       │  tRPC over HTTP (JSON + Superjson)
                       │  /api/trpc/*
┌──────────────────────▼───────────────────────────────────────────┐
│                    SERVIDOR (Express 4 + tRPC 11)                │
│  Routers: auth · databricks (testConnection, startAudit,         │
│           getSession, listSessions, compareSessions,             │
│           exportReport)                                          │
│  Services: databricks.ts (SQL REST API)                          │
│  PDF Route: GET /api/report/:sessionId/pdf                       │
└──────────┬───────────────────────────┬───────────────────────────┘
           │                           │
┌──────────▼──────────┐   ┌────────────▼────────────────────────┐
│   PostgreSQL        │   │   Databricks SQL REST API           │
│   (Drizzle ORM)     │   │   /api/2.0/sql/warehouses           │
│   audit_sessions    │   │   /api/2.0/sql/statements           │
│   analysis_results  │   │   system.information_schema.*       │
│   users             │   │   system.access.table_lineage       │
└─────────────────────┘   └─────────────────────────────────────┘
```

O fluxo de uma auditoria completa é: o cliente chama `databricks.startAudit` via tRPC → o servidor cria um registro de sessão no banco → executa as seis análises sequencialmente contra o Databricks SQL → persiste cada resultado individualmente → calcula o score de governança → atualiza a sessão com os dados consolidados → retorna o `sessionId` ao cliente para navegação ao dashboard.

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Versão | Finalidade |
|--------|-----------|--------|-----------|
| **Front-end** | React | 19.2 | Framework de UI |
| **Front-end** | TypeScript | 5.9 | Tipagem estática |
| **Front-end** | Tailwind CSS | 4.1 | Estilização utilitária |
| **Front-end** | Wouter | 3.3 | Roteamento client-side |
| **Front-end** | TanStack Query | 5.90 | Cache e sincronização de estado |
| **Front-end** | Recharts | 2.15 | Gráficos (linha, barras) |
| **Front-end** | @xyflow/react | 12.x | Grafo interativo de linhagem |
| **Front-end** | dagre | — | Layout automático de grafos |
| **Front-end** | Framer Motion | 12.x | Animações e transições |
| **Front-end** | shadcn/ui | — | Componentes de UI acessíveis |
| **Back-end** | Express | 4.21 | Servidor HTTP |
| **Back-end** | tRPC | 11.6 | Contrato de API type-safe |
| **Back-end** | Drizzle ORM | 0.44 | ORM para PostgreSQL |
| **Back-end** | @react-pdf/renderer | — | Geração de PDF no servidor |
| **Back-end** | Zod | 4.1 | Validação de schemas |
| **Banco de dados** | PostgreSQL | — | Persistência de sessões e resultados |
| **Build** | Vite | 7.1 | Bundler e dev server |
| **Build** | esbuild | 0.25 | Compilação do servidor |
| **Testes** | Vitest | 2.1 | Testes unitários |

---

## 4. Estrutura de Diretórios

```
databricks-governance-tool/
├── client/
│   ├── index.html                  # Ponto de entrada HTML (fontes Google)
│   └── src/
│       ├── App.tsx                 # Roteamento e providers globais
│       ├── index.css               # Tema global (variáveis CSS, dark/light)
│       ├── components/
│       │   ├── AppLayout.tsx       # Layout com sidebar e navegação
│       │   ├── LineageGraph.tsx    # Grafo interativo React Flow
│       │   └── ui/                 # Componentes shadcn/ui
│       └── pages/
│           ├── Home.tsx            # Landing page
│           ├── Connect.tsx         # Formulário de conexão Databricks
│           ├── Audit.tsx           # Execução das análises (redirect)
│           ├── Dashboard.tsx       # Dashboard executivo com score
│           ├── Report.tsx          # Exportação JSON/CSV/PDF
│           └── History.tsx         # Histórico e comparação de auditorias
├── server/
│   ├── routers.ts                  # Todos os endpoints tRPC
│   ├── databricks.ts               # Integração com Databricks SQL REST API
│   ├── db.ts                       # Helpers de banco de dados (Drizzle)
│   ├── pdfReport.tsx               # Documento PDF (@react-pdf/renderer)
│   ├── pdfRoute.ts                 # Rota Express GET /api/report/:id/pdf
│   ├── storage.ts                  # Helpers de armazenamento S3
│   ├── governance.test.ts          # Testes das análises de governança
│   ├── pdfReport.test.ts           # Testes do endpoint de PDF
│   ├── auth.logout.test.ts         # Testes de autenticação
│   └── _core/                      # Infraestrutura (OAuth, tRPC, LLM, etc.)
├── drizzle/
│   ├── schema.ts                   # Definição das tabelas do banco
│   └── migrations/                 # Arquivos SQL de migração
├── shared/
│   ├── const.ts                    # Constantes compartilhadas
│   └── types.ts                    # Tipos compartilhados
├── docs/
│   └── DOCUMENTACAO_TECNICA.md     # Este documento
├── todo.md                         # Rastreamento de funcionalidades
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

---

## 5. Banco de Dados

O banco de dados utiliza PostgreSQL (ou serviço compatível) gerenciado pelo Drizzle ORM. O schema é definido em `drizzle/schema.ts` e as migrações são aplicadas via `pnpm drizzle-kit generate` seguido de execução SQL direta.

### Tabela `users`

Tabela core de autenticação, gerenciada pelo fluxo OAuth do Manus. Armazena o identificador único do provedor OAuth (`openId`), dados de perfil e papel do usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `INT AUTO_INCREMENT PK` | Chave primária surrogate |
| `openId` | `VARCHAR(64) UNIQUE` | Identificador OAuth único |
| `name` | `TEXT` | Nome do usuário |
| `email` | `VARCHAR(320)` | E-mail do usuário |
| `loginMethod` | `VARCHAR(64)` | Método de autenticação |
| `role` | `ENUM('user','admin')` | Papel do usuário |
| `createdAt` | `TIMESTAMP` | Data de criação |
| `updatedAt` | `TIMESTAMP` | Última atualização |
| `lastSignedIn` | `TIMESTAMP` | Último login |

### Tabela `audit_sessions`

Representa uma execução completa de auditoria. Armazena os metadados da conexão, status de execução e as métricas consolidadas calculadas ao final das seis análises.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `INT AUTO_INCREMENT PK` | Chave primária |
| `userId` | `INT NOT NULL` | FK para `users.id` |
| `databricksHost` | `VARCHAR(512)` | URL do workspace Databricks |
| `targetCatalog` | `VARCHAR(256)` | Catálogo auditado |
| `status` | `ENUM('pending','running','completed','failed')` | Status da sessão |
| `governanceScore` | `FLOAT` | Score consolidado (0–100) |
| `totalCatalogs` | `INT` | Total de catálogos encontrados |
| `totalSchemas` | `INT` | Total de schemas encontrados |
| `totalTables` | `INT` | Total de tabelas e views |
| `docCoverage` | `FLOAT` | Cobertura de documentação (%) |
| `tagCoverage` | `FLOAT` | Cobertura de tags (%) |
| `errorMessage` | `TEXT` | Erros parciais em formato JSON |
| `createdAt` | `TIMESTAMP` | Data de criação |
| `updatedAt` | `TIMESTAMP` | Última atualização |

### Tabela `analysis_results`

Armazena o resultado individual de cada uma das seis análises por sessão. O campo `resultData` é do tipo JSON e contém a estrutura completa retornada pela função de análise correspondente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `INT AUTO_INCREMENT PK` | Chave primária |
| `sessionId` | `INT NOT NULL` | FK para `audit_sessions.id` |
| `analysisType` | `ENUM('structure','glossary','tags','access','lineage','security')` | Tipo da análise |
| `status` | `ENUM('pending','running','completed','failed')` | Status da análise |
| `resultData` | `JSON` | Dados completos retornados pela análise |
| `recommendations` | `JSON` | Lista de recomendações geradas |
| `gaps` | `JSON` | Lista de gaps identificados |
| `score` | `FLOAT` | Pontuação individual da análise |
| `executionMs` | `INT` | Tempo de execução em milissegundos |
| `errorMessage` | `TEXT` | Mensagem de erro (se falhou) |
| `createdAt` | `TIMESTAMP` | Data de criação |
| `updatedAt` | `TIMESTAMP` | Última atualização |

---

## 6. Integração com Databricks

Toda a comunicação com o Databricks é realizada pelo módulo `server/databricks.ts`, que utiliza a **Databricks SQL Statement Execution API** (versão 2.0) para executar consultas SQL contra o Unity Catalog.

### Fluxo de Execução de Queries

A função central `executeStatement` implementa o seguinte fluxo:

1. **Descoberta de Warehouse:** Chama `GET /api/2.0/sql/warehouses` para listar os SQL Warehouses disponíveis. Prioriza warehouses com estado `RUNNING`; caso nenhum esteja ativo, utiliza o primeiro disponível.
2. **Submissão da Query:** Envia `POST /api/2.0/sql/statements` com a query SQL, o `warehouse_id` descoberto e `wait_timeout: "30s"`.
3. **Polling de Resultado:** Se o statement não concluir dentro do timeout, realiza polling em `GET /api/2.0/sql/statements/{statement_id}` a cada 2 segundos, com limite de 30 tentativas (60 segundos total).
4. **Normalização:** Converte o resultado em um array de objetos `Record<string, string | null>` usando os nomes de colunas do schema retornado.

### Autenticação

A autenticação com o Databricks é feita via **Personal Access Token (PAT)**, enviado no header `Authorization: Bearer {token}` em todas as requisições. O token é fornecido pelo usuário no formulário de conexão e nunca é persistido no banco de dados.

### Views de Sistema Consultadas

| View | Análise | Descrição |
|------|---------|-----------|
| `system.information_schema.catalogs` | Estrutura | Lista todos os catálogos |
| `system.information_schema.schemata` | Estrutura | Lista schemas do catálogo |
| `system.information_schema.tables` | Estrutura / Glossário / Segurança | Lista tabelas e views |
| `system.information_schema.columns` | Glossário | Lista colunas com comentários |
| `system.information_schema.table_tags` | Tags | Tags aplicadas a tabelas |
| `system.information_schema.column_tags` | Tags | Tags aplicadas a colunas |
| `system.information_schema.table_privileges` | Acesso | Grants em nível de tabela |
| `system.information_schema.catalog_privileges` | Acesso | Grants em nível de catálogo |
| `system.information_schema.schema_privileges` | Acesso | Grants em nível de schema |
| `system.access.table_lineage` | Linhagem | Relações source → target entre tabelas |
| `system.information_schema.routines` | Segurança | Funções UDF (mascaramento) |

---

## 7. As Seis Análises de Governança

Cada análise é implementada como uma função assíncrona exportada em `server/databricks.ts` e executada sequencialmente dentro do procedimento `databricks.startAudit`.

### Análise 1 — Mapeamento de Estrutura

**Função:** `analyzeStructure(config)`

Realiza três consultas independentes para mapear a hierarquia completa do Unity Catalog: catálogos (`system.information_schema.catalogs`), schemas do catálogo alvo (`system.information_schema.schemata`) e tabelas/views (`system.information_schema.tables`). O resultado inclui um sumário com contagens de catálogos, schemas, tabelas e views.

### Análise 2 — Glossário de Dados

**Função:** `analyzeGlossary(config)`

Extrai todos os comentários (descrições) de tabelas e colunas via `system.information_schema.tables` e `system.information_schema.columns`, filtrando apenas registros com `comment IS NOT NULL`. Calcula a cobertura percentual de documentação para tabelas e colunas separadamente, usando contagens totais como denominador.

### Análise 3 — Classificação por Tags

**Função:** `analyzeTags(config)`

Consulta `system.information_schema.table_tags` e `system.information_schema.column_tags` para levantar todas as tags aplicadas no catálogo. Além da listagem completa, calcula a distribuição de frequência por nome de tag e identifica ativos marcados com palavras-chave sensíveis: `pii`, `lgpd`, `confidential`, `confidencial`, `sensitive`, `sensivel`, `restricted`, `restrito`.

### Análise 4 — Políticas de Acesso (Grants)

**Função:** `analyzeAccess(config)`

Mapeia todos os privilégios concedidos em três níveis de granularidade: catálogo (`catalog_privileges`), schema (`schema_privileges`) e tabela (`table_privileges`). Para cada grant, captura `grantor`, `grantee` e `privilege_type`. O sumário inclui o total de grants, número de grantees únicos e distribuição por tipo de privilégio.

### Análise 5 — Linhagem de Dados

**Função:** `analyzeLineage(config)`

Consulta `system.access.table_lineage` para recuperar até 500 arestas de linhagem onde o catálogo alvo é origem ou destino. Cada aresta representa uma relação `source_table → target_table` com catálogo, schema e nome de tabela em ambas as pontas. O resultado alimenta o grafo interativo React Flow no dashboard.

### Análise 6 — Segurança Dinâmica

**Função:** `analyzeSecurity(config)`

Consulta `system.information_schema.routines` para listar todas as funções UDF do catálogo. Analisa as definições das rotinas em busca de padrões de mascaramento (`mask`, `hash`, `sha`) e filtros de linha (`filter`, `rls`, `row_filter`), classificando-as em `rowFilters` e `columnMasks`. Complementarmente, amostra até 20 tabelas base para verificação de políticas aplicadas.

---

## 8. Score de Governança

**Função:** `computeGovernanceScore(data: GovernanceAnalysisData)`

O score de governança é calculado ao final de cada auditoria como a soma ponderada de cinco dimensões, com pontuação máxima de 100 pontos.

| Dimensão | Peso Máximo | Critério de Pontuação |
|----------|-------------|----------------------|
| **Documentação** | 25 pts | Média ponderada: 60% cobertura de tabelas + 40% cobertura de colunas, multiplicada por 0,25 |
| **Classificação por Tags** | 20 pts | `min(20, tagCoverage% × 0,2)` — proporcional à cobertura de tags |
| **Controle de Acesso** | 25 pts | 25 pts se há grants configurados; 5 pts se nenhum grant encontrado |
| **Linhagem de Dados** | 15 pts | 15 pts se há arestas de linhagem; 3 pts se nenhuma linhagem registrada |
| **Segurança Dinâmica** | 15 pts | 15 pts se há funções de mascaramento; 0 pts se nenhuma função encontrada |

Além do score numérico, a função retorna listas de `gaps` (problemas identificados com valores concretos) e `recommendations` (ações corretivas sugeridas), ambas geradas condicionalmente com base nos limiares de cada dimensão.

**Limiares de Maturidade:**

| Faixa | Classificação |
|-------|--------------|
| ≥ 80 | Excelente |
| 60–79 | Bom |
| 40–59 | Regular |
| < 40 | Crítico |

---

## 9. API tRPC — Referência de Endpoints

Todos os endpoints estão sob o namespace `databricks` e requerem autenticação (`protectedProcedure`). O transporte é JSON sobre HTTP em `/api/trpc`.

### `databricks.testConnection` — Mutation

Testa a conectividade com o workspace Databricks antes de iniciar uma auditoria.

**Input:**
```typescript
{ host: string; token: string; catalog: string }
```

**Output:**
```typescript
{ ok: boolean; message: string; warehouseId?: string }
```

---

### `databricks.startAudit` — Mutation

Inicia uma sessão de auditoria completa, executando as seis análises sequencialmente. Retorna imediatamente após a conclusão de todas as análises.

**Input:**
```typescript
{ host: string; token: string; catalog: string }
```

**Output:**
```typescript
{
  sessionId: number;
  governanceScore: number;
  recommendations: string[];
  gaps: string[];
  errors: Record<string, string>;
  hasErrors: boolean;
}
```

---

### `databricks.getSession` — Query

Retorna os detalhes completos de uma sessão de auditoria, incluindo os resultados de todas as análises.

**Input:** `{ sessionId: number }`

**Output:** `{ session: AuditSession; analyses: AnalysisResult[] }`

---

### `databricks.listSessions` — Query

Lista todas as sessões de auditoria do usuário autenticado, ordenadas por data de criação decrescente (limite de 20 sessões).

**Output:** `AuditSession[]`

---

### `databricks.compareSessions` — Query

Busca os dados completos de duas sessões em paralelo, extraindo grants da análise de acesso e construindo o checklist de status por análise para cada sessão.

**Input:** `{ sessionIdA: number; sessionIdB: number }`

**Output:**
```typescript
{
  sessionA: AuditSession & { grantsCount: number | null };
  sessionB: AuditSession & { grantsCount: number | null };
  checklistA: Array<{ type: string; label: string; status: string; score: number | null }>;
  checklistB: Array<{ type: string; label: string; status: string; score: number | null }>;
}
```

---

### `databricks.exportReport` — Query

Retorna o relatório completo de uma sessão em formato estruturado, com metadados, sumário e dados de todas as análises.

**Input:** `{ sessionId: number }`

**Output:**
```typescript
{
  metadata: { exportedAt: string; databricksHost: string; targetCatalog: string; auditDate: Date; governanceScore: number | null };
  summary: { totalCatalogs; totalSchemas; totalTables; docCoverage; tagCoverage };
  analyses: Array<{ type; status; score; executionMs; data; recommendations; gaps }>;
}
```

---

### `GET /api/report/:sessionId/pdf` — Rota Express

Endpoint HTTP direto (fora do tRPC) que gera e retorna o relatório executivo em PDF. Requer cookie de sessão válido. O PDF é gerado via `@react-pdf/renderer` no servidor e transmitido como stream com `Content-Type: application/pdf`.

**Resposta:** Stream binário PDF com header `Content-Disposition: attachment; filename="governance-report-{sessionId}.pdf"`

---

## 10. Exportação de Relatórios

A ferramenta oferece três formatos de exportação, todos acessíveis na página de Relatório e no Dashboard executivo.

**JSON** — Exporta o objeto completo retornado por `databricks.exportReport`, incluindo metadados, sumário e dados brutos de todas as seis análises. O download é gerado client-side via `Blob` e `URL.createObjectURL`.

**CSV** — Gera múltiplos arquivos CSV compactados em um único download, um por análise, contendo os dados tabulares de cada resultado. A conversão de objetos JSON para linhas CSV é feita client-side com tratamento de valores nulos e aspas.

**PDF** — Documento de quatro páginas gerado no servidor via `@react-pdf/renderer`:
- **Capa:** Score colorido por faixa de maturidade, host, catálogo e data da auditoria
- **Métricas Executivas:** 9 KPIs, gráficos de barras horizontais para composição do score e cobertura por dimensão
- **Checklist de Melhores Práticas:** 6 critérios com indicadores visuais de aprovação/reprovação
- **Gaps e Recomendações:** Layout de duas colunas com conclusão narrativa

---

## 11. Grafo de Linhagem de Dados

O componente `client/src/components/LineageGraph.tsx` renderiza as arestas de linhagem retornadas pela Análise 5 como um grafo interativo usando **@xyflow/react** (React Flow v12) com layout automático calculado pelo **Dagre**.

### Tipos de Nós

| Tipo | Cor | Descrição |
|------|-----|-----------|
| **Origem** | Dourado (`#d4a017`) | Tabelas que são fonte de dados (`source_table`) |
| **Destino** | Azul (`#3b82f6`) | Tabelas que recebem dados (`target_table`) |

### Funcionalidades Interativas

O grafo suporta zoom (scroll do mouse), pan (arrastar), seleção de nós e exibe um **minimap** no canto inferior direito para navegação em grafos grandes. O `colorMode` é sincronizado dinamicamente com o tema dark/light da aplicação via `useTheme`. O layout Dagre é recalculado automaticamente quando os dados de linhagem mudam, organizando os nós em camadas da esquerda para a direita.

---

## 12. Comparação de Auditorias

A funcionalidade de comparação, disponível na página de Histórico, permite selecionar duas auditorias concluídas e exibir uma tabela comparativa detalhada com os seguintes dados:

**KPIs Comparados (7 métricas em 5 categorias):**

| Categoria | Métrica |
|-----------|---------|
| Geral | Score de Governança |
| Estrutura | Total de Catálogos · Total de Schemas · Total de Tabelas/Views |
| Glossário | Cobertura de Documentação (%) |
| Classificação | Cobertura de Tags (%) |
| Políticas de Acesso | Total de Grants |

Para cada métrica, a tabela exibe o valor de cada auditoria, um indicador de vencedor (ícone de check verde) e um badge de delta (▲/▼ com o valor da diferença). A seção **Checklist de Análises** mostra o status de execução (Concluída / Falhou / Não executada) e a pontuação individual das seis análises em cada auditoria.

---

## 13. Autenticação e Segurança

A autenticação de usuários é gerenciada pelo **Manus OAuth**, implementado em `server/_core/oauth.ts`. O fluxo completo é:

1. O cliente redireciona o usuário para `getLoginUrl()` (construído com `window.location.origin` como redirect URI)
2. Após autenticação no portal Manus, o callback `/api/oauth/callback` recebe o código de autorização
3. O servidor troca o código por um token de acesso, cria/atualiza o usuário no banco e emite um cookie de sessão JWT assinado com `JWT_SECRET`
4. Todas as requisições subsequentes ao tRPC leem o cookie e reconstroem o contexto `ctx.user`

Os endpoints de governança são todos `protectedProcedure`, garantindo que apenas usuários autenticados possam executar auditorias ou acessar resultados. A verificação de propriedade (`session.userId !== ctx.user.id`) impede que um usuário acesse dados de outro.

O token Databricks (PAT) é transmitido apenas no corpo das requisições tRPC e nunca é armazenado no banco de dados ou em cookies.

---

## 14. Instalação e Execução Local

### Pré-requisitos

- Node.js ≥ 22.x
- pnpm ≥ 10.x
- PostgreSQL 13+ (ou acesso a um serviço PostgreSQL gerenciado)
- Workspace Databricks com Unity Catalog habilitado

### Passos

```bash
# 1. Clonar o repositório
git clone https://github.com/patyb7icloud/Auditoria-de-Governanca-de-Dados-Databricks.git
cd Auditoria-de-Governanca-de-Dados-Databricks

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais necessárias (ver seção 16)

# 4. Aplicar o schema do banco de dados
pnpm drizzle-kit generate
# Copiar o SQL gerado e executar no banco PostgreSQL

# 5. Iniciar o servidor de desenvolvimento
pnpm dev
# Aplicação disponível em http://localhost:3000
```

### Build para Produção

```bash
# Compilar cliente e servidor
pnpm build

# Iniciar em modo produção
pnpm start
```

---

## 15. Deploy em Cloud

A aplicação é uma aplicação Node.js padrão e pode ser implantada em qualquer plataforma que suporte containers ou runtimes Node.js.

### Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

Configure as variáveis de ambiente listadas na seção 16 no painel do Railway. O banco de dados PostgreSQL pode ser provisionado como um serviço adicional no mesmo projeto Railway.

### Render

Crie um novo **Web Service** no Render apontando para o repositório GitHub. Configure:
- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start`
- **Environment:** Node.js

Adicione um banco de dados **PostgreSQL** ou conecte um MySQL externo via `DATABASE_URL`.

### AWS / GCP / Azure (Container)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

```bash
# Build e push da imagem
docker build -t databricks-governance-tool .
docker push <registry>/databricks-governance-tool

# Deploy no serviço de container da cloud escolhida
# AWS ECS / GCP Cloud Run / Azure Container Apps
```

---

## 16. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL: `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Sim | Segredo para assinar cookies de sessão (mínimo 32 caracteres) |
| `VITE_APP_ID` | Sim | ID da aplicação Manus OAuth |
| `OAUTH_SERVER_URL` | Sim | URL base do servidor OAuth Manus |
| `VITE_OAUTH_PORTAL_URL` | Sim | URL do portal de login Manus |
| `OWNER_OPEN_ID` | Recomendada | OpenID do proprietário (promovido a admin automaticamente) |
| `OWNER_NAME` | Opcional | Nome do proprietário |
| `BUILT_IN_FORGE_API_URL` | Opcional | URL da API Manus (LLM, storage, etc.) |
| `BUILT_IN_FORGE_API_KEY` | Opcional | Chave da API Manus (server-side) |
| `VITE_FRONTEND_FORGE_API_URL` | Opcional | URL da API Manus (client-side) |
| `VITE_FRONTEND_FORGE_API_KEY` | Opcional | Chave da API Manus (client-side) |
| `VITE_APP_TITLE` | Opcional | Título da aplicação (padrão: "Databricks Governance Analysis Tool") |

---

## 17. Testes

Os testes são escritos com **Vitest** e localizados em `server/*.test.ts`. Para executar:

```bash
pnpm test
```

### Cobertura Atual (15 testes em 3 arquivos)

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `server/auth.logout.test.ts` | 1 | Fluxo de logout: limpeza de cookie de sessão |
| `server/governance.test.ts` | 8 | Validação de schemas de entrada, cálculo de score, geração de gaps e recomendações |
| `server/pdfReport.test.ts` | 6 | Endpoint de PDF: validação de sessionId, headers de resposta, tratamento de erros |

---

## 18. Guia de Uso

### Passo 1 — Acesso e Autenticação

Acesse a URL da aplicação e clique em **"Iniciar Auditoria"** na landing page. Você será redirecionado ao portal de autenticação Manus. Após o login, retornará automaticamente à aplicação.

### Passo 2 — Configuração da Conexão

Na página **"Nova Auditoria"**, preencha:
- **Host do Databricks:** URL completa do workspace (ex: `https://adb-123456789.azuredatabricks.net`)
- **Token de Acesso:** Personal Access Token gerado em *User Settings → Access Tokens* no Databricks
- **Catálogo Alvo:** Nome exato do catálogo Unity Catalog a ser auditado

Clique em **"Testar Conexão"** para validar as credenciais antes de prosseguir. O teste verifica a autenticação e a disponibilidade de SQL Warehouses no workspace.

### Passo 3 — Execução da Auditoria

Clique em **"Iniciar Auditoria"**. A aplicação exibirá o progresso das seis análises em tempo real. O tempo total de execução varia de 30 segundos a alguns minutos, dependendo do volume de dados no catálogo.

### Passo 4 — Dashboard Executivo

Ao concluir, você será redirecionado ao **Dashboard** com:
- Score de governança (0–100) com classificação de maturidade
- KPIs consolidados: total de ativos, cobertura de documentação, cobertura de tags
- Gráfico de distribuição de grants por tipo de privilégio
- Grafo interativo de linhagem de dados (Análise 5)
- Checklist de melhores práticas com gaps e recomendações

### Passo 5 — Exportação do Relatório

Na página **"Relatório"**, selecione o formato desejado:
- **JSON:** Dados brutos completos de todas as análises
- **CSV:** Tabelas individuais por análise para análise em planilhas
- **PDF:** Relatório executivo formatado para apresentação a stakeholders

### Passo 6 — Histórico e Comparação

Na página **"Histórico"**, visualize todas as auditorias realizadas com o gráfico de evolução do score ao longo do tempo. Use o seletor de catálogo para filtrar por ambiente específico. Para comparar duas auditorias, clique em **"Comparar Auditorias"**, selecione duas sessões concluídas e clique em **"Ver Comparação"** para exibir a tabela comparativa detalhada.

---

*Documentação gerada automaticamente com base no código-fonte do projeto — versão 1.0.0*
