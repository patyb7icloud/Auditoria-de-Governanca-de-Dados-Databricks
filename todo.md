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
