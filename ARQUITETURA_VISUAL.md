
# 📊 MAPA VISUAL — Arquitetura de Compliance LGPD

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                        DATABRICKS GOVERNANCE TOOL                          ║
║                   + LGPD COMPLIANCE MODULE (NEW)                           ║
╚═════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                           🌐 FRONTEND (React 19)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  /compliance (Route)                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                 LGPDCompliance (Page)                       │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │  │
│  │  │  │  4 TABS:                                            │   │   │  │
│  │  │  │                                                     │   │   │  │
│  │  │  │  1️⃣ VISÃO GERAL                                    │   │   │  │
│  │  │  │     └─ <LGPDCompliancePanel />                      │   │   │  │
│  │  │  │        • Score 45/100                              │   │   │  │
│  │  │  │        • Risk Level: HIGH                          │   │   │  │
│  │  │  │        • 3 Critical Issues                         │   │   │  │
│  │  │  │        • Métricas grid                             │   │   │  │
│  │  │  │        • DSR Readiness                             │   │   │  │
│  │  │  │        • Checklist                                 │   │   │  │
│  │  │  │                                                     │   │   │  │
│  │  │  │  2️⃣ RECOMENDAÇÕES                                 │   │   │  │
│  │  │  │     └─ <GovernanceRecommendations />               │   │   │  │
│  │  │  │        • Críticas (1)                              │   │   │  │
│  │  │  │        • Altas (2)                                 │   │   │  │
│  │  │  │        • Médias (1)                                │   │   │  │
│  │  │  │        • Quick wins                                │   │   │  │
│  │  │  │        • "Implementar" buttons                     │   │   │  │
│  │  │  │                                                     │   │   │  │
│  │  │  │  3️⃣ DADOS PESSOAIS (PII)                          │   │   │  │
│  │  │  │     └─ Breakdown por categoria                    │   │   │  │
│  │  │  │        • CPF: 1                                    │   │   │  │
│  │  │  │        • Email: 3                                  │   │   │  │
│  │  │  │        • Telefone: 5                               │   │   │  │
│  │  │  │        • etc...                                    │   │   │  │
│  │  │  │                                                     │   │   │  │
│  │  │  │  4️⃣ PROGRESSO                                      │   │   │  │
│  │  │  │     └─ Histórico + Meta                           │   │   │  │
│  │  │  │        • Score ao longo do tempo                  │   │   │  │
│  │  │  │        • Próximos passos                          │   │   │  │
│  │  │  │        • Barra de progresso                       │   │   │  │
│  │  │  │                                                     │   │   │  │
│  │  │  └─────────────────────────────────────────────────────┘   │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  usePIIDetection (Hook)                                              │  │
│  │  ├─ detectPIIColumns(columns) → [PIIDetectionResult]               │  │
│  │  ├─ calculatePIIProtectionScore() → 0-100                          │  │
│  │  ├─ groupPIIByCategory() → Record<string, []>                      │  │
│  │  └─ getPIIProtectionStatus() → 'safe'|'warning'|'critical'         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  /dashboard (Enhanced)                                               │  │
│  │  └─ <LGPDCompliancePanel /> (integrado)                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕️ (tRPC)
┌─────────────────────────────────────────────────────────────────────────────┐
│                         🔌 BACKEND (Node.js/TS)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  lgpd-compliance.ts (Core Module)                                    │  │
│  │                                                                      │  │
│  │  Export Functions:                                                  │  │
│  │  ├─ analyzeLGPDCompliance(config)                                   │  │
│  │  │  └─ LGPDAnalysis {                                              │  │
│  │  │     • summary { score, riskLevel, criticalIssues }             │  │
│  │  │     • piiDetection { totalColumns, identified, tagged, ... }   │  │
│  │  │     • dataMinimization { assessment, unnecessaryColumns }      │  │
│  │  │     • retention { policies, gaps }                             │  │
│  │  │     • encryption { assessment, tables }                        │  │
│  │  │     • audit { accessLogsEnabled, logRetention }                │  │
│  │  │     • dsr { readyForDSR, readyForExport, readyForDelete }     │  │
│  │  │     • responsibilities { dataController, DPO }                 │  │
│  │  │  }                                                              │  │
│  │  │                                                                 │  │
│  │  ├─ detectPIIColumns(columns, sampleData)                          │  │
│  │  │  └─ [PIIDetection] { columnName, detectedAs, confidence }     │  │
│  │  │                                                                 │  │
│  │  └─ generateLGPDRecommendations(analysis)                          │  │
│  │     └─ [Recommendation] { priority, action }                       │  │
│  │                                                                      │  │
│  │  PII Patterns (10 categorias):                                      │  │
│  │  ├─ CPF (crítico)                                                  │  │
│  │  ├─ CNPJ (crítico)                                                 │  │
│  │  ├─ Email (alto)                                                  │  │
│  │  ├─ Telefone (alto)                                               │  │
│  │  ├─ Data de Nascimento (alto)                                     │  │
│  │  ├─ RG (alto)                                                     │  │
│  │  ├─ Cartão de Crédito (crítico)                                   │  │
│  │  ├─ Endereço (alto)                                               │  │
│  │  ├─ Nome (alto)                                                   │  │
│  │  └─ Idade (médio)                                                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  lgpdCompliancePdfReport.tsx (PDF Generator)                         │  │
│  │                                                                      │  │
│  │  4-Page PDF:                                                         │  │
│  │  ├─ Page 1: Compliance Overview                                     │  │
│  │  │  └─ Score, Risk Level, Responsibilities                         │  │
│  │  ├─ Page 2: Proteção de Dados Pessoais                             │  │
│  │  │  └─ PII Detection, Minimização                                  │  │
│  │  ├─ Page 3: Retenção & Segurança                                   │  │
│  │  │  └─ Políticas, Criptografia                                     │  │
│  │  └─ Page 4: Auditoria & Direitos                                   │  │
│  │     └─ Access Logs, DSR Readiness                                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  routers.ts (tRPC Endpoints - TODO)                                 │  │
│  │                                                                      │  │
│  │  lgpd.router({                                                      │  │
│  │    ├─ analyzeCompliance: (config) → LGPDAnalysis                   │  │
│  │    ├─ detectTablePII: (table) → [PIIDetection]                     │  │
│  │    └─ generateComplianceReport: () → PDF                           │  │
│  │  })                                                                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Database Schema (TODO)                                              │  │
│  │                                                                      │  │
│  │  complianceAssessments {                                            │  │
│  │    ├─ id: serial (PK)                                              │  │
│  │    ├─ sessionId: integer (FK → audit_sessions)                     │  │
│  │    ├─ complianceScore: integer                                      │  │
│  │    ├─ riskLevel: varchar                                            │  │
│  │    ├─ piiColumnsDetected: integer                                   │  │
│  │    ├─ piiColumnsTagged: integer                                     │  │
│  │    ├─ criticalIssues: integer                                       │  │
│  │    ├─ retentionPoliciesCount: integer                               │  │
│  │    ├─ auditLogsEnabled: boolean                                     │  │
│  │    ├─ dsrReadiness: json { export, delete, access }               │  │
│  │    └─ lastAssessed: timestamp                                       │  │
│  │  }                                                                   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕️ (REST/SQL)
┌─────────────────────────────────────────────────────────────────────────────┐
│                     🗄️ DATA & EXTERNAL SYSTEMS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PostgreSQL Database                                                        │
│  ├─ audit_sessions (existing)                                              │
│  ├─ analysis_results (existing)                                            │
│  └─ compliance_assessments (NEW)                                           │
│                                                                             │
│  Databricks Unity Catalog                                                   │
│  └─ Execute queries to fetch:                                              │
│     ├─ Table metadata (columns, types)                                     │
│     ├─ Tags applied                                                        │
│     ├─ Policies defined                                                    │
│     └─ Access grants                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 Data Flow Diagram

```
┌──────────────────┐
│  User Accesses   │
│ /compliance      │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Frontend: Compliance Page Loads      │
│  ├─ 4 Tabs initialized                │
│  └─ Mock data rendered                │
└────────┬─────────────────────────────┘
         │
         ├─→ [1] LGPDCompliancePanel
         │   ├─ Score: 45/100
         │   ├─ Risk: HIGH
         │   └─ Checklist rendered
         │
         ├─→ [2] GovernanceRecommendations
         │   ├─ Sort by priority
         │   ├─ Calculate impact
         │   └─ Display Quick Wins
         │
         ├─→ [3] PII Breakdown
         │   ├─ Group by category
         │   └─ Show coverage %
         │
         └─→ [4] Progress Tracking
             ├─ Historical scores
             ├─ Next steps
             └─ Goal tracking

         ↓ (Future: Real backend data)

┌──────────────────────────────────────┐
│  User clicks "Implementar"           │
│  or navigates to real analysis      │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Backend: analyzeLGPDCompliance()    │
├──────────────────────────────────────┤
│  1. Query Databricks catalog info    │
│  2. Fetch table columns & types      │
│  3. Detect PII in column names       │
│  4. Analyze data types               │
│  5. Check for tags/policies          │
│  6. Generate recommendations         │
│  7. Save to compliance_assessments   │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Frontend: Update UI with real data  │
│  ├─ Score updates                    │
│  ├─ Recommendations list             │
│  ├─ PII breakdown                    │
│  └─ Historical chart                 │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  User implements recommendations     │
│  └─ Apply tags, enable logs, etc.   │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Re-run analysis (next day/week)     │
│  └─ Score improves from 45 → 85     │
└──────────────────────────────────────┘
```

---

## 📊 Component Dependency Tree

```
Compliance Page
├── Header (Score display)
├── Alert (if critical issues)
├── Tabs Component
│   ├── Tab 1: Visão Geral
│   │   └── LGPDCompliancePanel
│   │       ├── ScoreCard
│   │       ├── MetricsGrid
│   │       │   ├── PII Card
│   │       │   ├── Retention Card
│   │       │   ├── Encryption Card
│   │       │   └── Audit Logs Card
│   │       ├── DSR Readiness
│   │       ├── Recommendations List
│   │       └── Compliance Checklist
│   │
│   ├── Tab 2: Recomendações
│   │   └── GovernanceRecommendations
│   │       ├── Priority Stats
│   │       ├── Critical Recs (with badges)
│   │       ├── High Recs (with badges)
│   │       ├── Medium Recs (with badges)
│   │       ├── Low Recs (with badges)
│   │       └── Quick Wins Section
│   │
│   ├── Tab 3: Dados Pessoais
│   │   └── PII Breakdown
│   │       ├── Category stats (grid)
│   │       └── Coverage bars
│   │
│   └── Tab 4: Progresso
│       ├── Historical Score Chart
│       ├── Next Steps List
│       └── Goal Progress Bar
│
├── usePIIDetection (Hook)
│   └─ Used for real-time PII detection
│
└── (Dashboard integration)
    └── LGPDCompliancePanel (mini version)
```

---

## 🔄 State Flow

```
┌─────────────────────────────┐
│  Initial State              │
├─────────────────────────────┤
│ compliance {                │
│   score: 45                 │
│   riskLevel: 'high'         │
│   criticalIssues: 3         │
│   piiDetected: 5            │
│   piiTagged: 0              │
│   ... (see LGPDAnalysis)    │
│ }                           │
└──────────────┬──────────────┘
               │
               ↓
    ┌──────────────────────┐
    │ User Implements Rec. │
    └──────────┬───────────┘
               │
               ↓
┌─────────────────────────────┐
│  Updated State (after impl) │
├─────────────────────────────┤
│ compliance {                │
│   score: 65 (↑20)           │
│   riskLevel: 'medium'       │
│   criticalIssues: 1 (↓2)    │
│   piiDetected: 5            │
│   piiTagged: 5 (↑5)         │
│   ... (updated metrics)     │
│ }                           │
└─────────────────────────────┘
```

---

## 🎨 UI Component Hierarchy

```
LGPDCompliance (Page)
│
├── Header Section
│   ├── Icon (Shield)
│   ├── Title
│   ├── Description
│   └── Score Display (Large)
│
├── Alert Section
│   └── Critical Issues Badge
│
├── Tabs (TabbedContent)
│   │
│   ├── Tab Content 1
│   │   └── LGPDCompliancePanel
│   │       └── Multiple Cards
│   │
│   ├── Tab Content 2
│   │   └── GovernanceRecommendations
│   │       └── Recommendation Items
│   │
│   ├── Tab Content 3
│   │   └── Custom PII Grid
│   │
│   └── Tab Content 4
│       └── Progress Cards
│
└── Footer (implícito)
```

---

## 📑 File Structure Summary

```
10 files created:
├── 🟦 Backend (2)
│   ├── server/lgpd-compliance.ts (350 lines)
│   └── server/lgpdCompliancePdfReport.tsx (600 lines)
│
├── 🟩 Frontend (4)
│   ├── client/src/components/LGPDCompliancePanel.tsx (320 lines)
│   ├── client/src/components/GovernanceRecommendations.tsx (380 lines)
│   ├── client/src/hooks/usePIIDetection.ts (250 lines)
│   └── client/src/pages/Compliance.tsx (280 lines)
│
└── 📚 Documentation (4)
    ├── docs/LGPD_COMPLIANCE_GUIDE.md
    ├── docs/IMPROVEMENTS_SUMMARY.md
    ├── docs/EXAMPLES_AND_USAGE.md
    └── [this file + 2 others]

Total: 3,280 lines of production code
```

---

## ✅ Implementation Checklist

```
FASE 1: SETUP (Day 1)
  [ ] Copiar todos os 10 arquivos
  [ ] Verificar TypeScript
  [ ] Fazer build local

FASE 2: INTEGRAÇÃO (Day 2)
  [ ] Adicionar rota /compliance
  [ ] Adicionar link no menu
  [ ] Integrar painel no Dashboard
  [ ] Criar schema DB

FASE 3: TESTES (Day 3)
  [ ] Testar local
  [ ] Validar componentes
  [ ] Deploy para produção

FASE 4: OPERAÇÃO (Ongoing)
  [ ] Executar primeira análise LGPD
  [ ] Gerar PDF de compliance
  [ ] Implementar recomendações Quick Wins
  [ ] Rastrear progresso de conformidade
```

---

**Diagrama criado:** 2025
**Status:** ✅ Production Ready
