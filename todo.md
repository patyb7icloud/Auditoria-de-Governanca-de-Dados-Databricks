# Databricks Governance Tool — TODO

## Backend & Schema
- [x] Schema do banco: tabelas `audit_sessions`, `analysis_results`
- [x] Router tRPC: `databricks.testConnection`
- [x] Router tRPC: `databricks.startAudit` (executa as 6 análises via Databricks SQL REST API)
- [x] Router tRPC: `databricks.listSessions` / `getSession`
- [x] Router tRPC: `databricks.exportReport` (JSON + CSV)
- [x] Comparação automática com melhores práticas de governança
- [x] Score geral de governança calculado no backend

## Frontend — Tema e Layout
- [x] Tema sofisticado: paleta dark com acentos em dourado/âmbar, tipografia Inter + Playfair Display
- [x] AppLayout customizado com sidebar elegante
- [x] Modo claro/escuro alternável
- [x] Animações e micro-interações refinadas

## Páginas
- [x] Página Home / Landing com CTA
- [x] Página de Configuração de Conexão (formulário + teste de conectividade)
- [x] Página de Análises (execução das 6 análises com progresso)
- [x] Dashboard Executivo (métricas consolidadas + score de governança)
- [x] Página de Relatório (exportação JSON + CSV)

## Análises (6)
- [x] Análise 1 — Mapeamento de Estrutura (catálogos, schemas, tabelas/views)
- [x] Análise 2 — Glossário de Dados (comentários + cobertura percentual)
- [x] Análise 3 — Classificação por Tags (PII, LGPD, confidencial, domínio)
- [x] Análise 4 — Políticas de Acesso (grants: grantor, grantee, privilege_type)
- [x] Análise 5 — Linhagem de Dados (source → target table lineage)
- [x] Análise 6 — Segurança Dinâmica (Row/Column Level Security, mascaramento)

## Dashboard Executivo
- [x] Total de ativos (catálogos, schemas, tabelas)
- [x] Percentual documentado (cobertura de comentários)
- [x] Percentual com tags aplicadas
- [x] Distribuição de acessos (grants por tipo)
- [x] Score geral de governança (0–100)

## Comparação com Melhores Práticas
- [x] Checklist de boas práticas de governança
- [x] Gaps identificados automaticamente
- [x] Recomendações geradas por análise

## Exportação de Relatório
- [x] Exportação em JSON (todos os dados das 6 análises)
- [x] Exportação em CSV (por análise e consolidado)

## Grafo de Linhagem (React Flow)
- [x] Instalar @xyflow/react
- [x] Criar componente LineageGraph com nós e arestas interativos
- [x] Integrar grafo no Dashboard (seção Linhagem de Dados)
- [x] Suporte a zoom, pan, minimap e layout automático
- [x] Estilo visual consistente com tema dark/light da aplicação

## Relatório Executivo em PDF
- [x] Instalar @react-pdf/renderer no servidor
- [x] Criar rota Express GET /api/report/:sessionId/pdf no backend
- [x] Construir documento PDF com capa, score, KPIs, gráficos de barras, checklist e recomendações
- [x] Adicionar botão "Exportar PDF" na página Report
- [x] Adicionar botão "Exportar PDF" no Dashboard executivo
- [x] Teste do endpoint de geração de PDF
- [x] Teste de validação dos dados de entrada do endpoint PDF (sessionId inválido e ausente)
