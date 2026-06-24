import {
  integer,
  serial,
  pgTable,
  text,
  timestamp,
  varchar,
  json,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 16 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Sessões de auditoria do Databricks
export const auditSessions = pgTable("audit_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  databricksHost: varchar("databricksHost", { length: 512 }).notNull(),
  targetCatalog: varchar("targetCatalog", { length: 256 }).notNull(),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  governanceScore: doublePrecision("governanceScore"),
  totalCatalogs: integer("totalCatalogs"),
  totalSchemas: integer("totalSchemas"),
  totalTables: integer("totalTables"),
  docCoverage: doublePrecision("docCoverage"),
  tagCoverage: doublePrecision("tagCoverage"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AuditSession = typeof auditSessions.$inferSelect;
export type InsertAuditSession = typeof auditSessions.$inferInsert;

// Resultados individuais de cada análise
export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  analysisType: varchar("analysisType", { length: 32 }).notNull(),
  status: varchar("status", { length: 16 }).default("pending").notNull(),
  resultData: json("resultData"),
  recommendations: json("recommendations"),
  gaps: json("gaps"),
  score: doublePrecision("score"),
  executionMs: integer("executionMs"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;

// ─── KNOWLEDGE BASE DO COPILOTO ─────────────────────────────────────────────
// Banco de conhecimento persistente: armazena perguntas + respostas para
// reutilização entre TODOS os usuários do mesmo tenant (catálogo Databricks).
// Princípio: quanto mais perguntas acumuladas, menor o custo de IA ao longo do tempo.
export const copilotKnowledgeBase = pgTable("copilot_knowledge_base", {
  id: serial("id").primaryKey(),
  // Identifica o tenant (catálogo Databricks) — compartilhado entre usuários
  tenantCatalog: varchar("tenantCatalog", { length: 256 }).notNull(),
  // Pergunta original feita pelo usuário
  question: text("question").notNull(),
  // Chave de normalização: lowercase + trim para busca por similaridade
  questionNormalized: text("questionNormalized").notNull(),
  // SQL gerado pelo LLM para responder a pergunta
  sqlExecuted: text("sqlExecuted"),
  // Resposta final formatada pelo LLM
  answer: text("answer").notNull(),
  // Dados retornados pelo Databricks (JSON)
  resultData: json("resultData"),
  // Intenção detectada: 'read' ou 'write'
  intent: varchar("intent", { length: 16 }).default("read"),
  // Classificação inteligente da pergunta: 'structural' (schema/metadados) ou 'operational' (dados/acessos vivos)
  questionType: varchar("questionType", { length: 16 }).default("operational").notNull(),
  // O prompt original usado para gerar a resposta final (necessário para re-gerar a resposta com dados novos)
  answerPromptTemplate: text("answerPromptTemplate"),
  // Usuário que originou a pergunta (para auditoria)
  askedByUserId: integer("askedByUserId"),
  askedByEmail: varchar("askedByEmail", { length: 320 }),
  // Quantas vezes esta entrada foi reutilizada (cache hit)
  hitCount: integer("hitCount").default(0).notNull(),
  // Custo estimado economizado por cada reutilização (em USD)
  costSavedPerHitUSD: doublePrecision("costSavedPerHitUSD").default(0.0097),
  // Controle de validade: respostas sobre dados podem ficar desatualizadas
  expiresAt: timestamp("expiresAt"),
  // Feedback do usuário: foi útil?
  feedback: varchar("feedback", { length: 16 }), // 'positive', 'negative', null
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type CopilotKnowledge = typeof copilotKnowledgeBase.$inferSelect;
export type InsertCopilotKnowledge = typeof copilotKnowledgeBase.$inferInsert;

// ─── KNOWLEDGE BASE DO SELF-HEALING ─────────────────────────────────────────
// Armazena as sugestões de documentação geradas pela IA para cada tabela.
// Evita re-analisar tabelas que já foram processadas recentemente.
export const selfHealingKnowledgeBase = pgTable("self_healing_knowledge_base", {
  id: serial("id").primaryKey(),
  tenantCatalog: varchar("tenantCatalog", { length: 256 }).notNull(),
  schemaName: varchar("schemaName", { length: 256 }).notNull(),
  tableName: varchar("tableName", { length: 256 }).notNull(),
  // Sugestões geradas pela IA (JSON com array de SelfHealingSuggestion)
  suggestions: json("suggestions").notNull(),
  // Status da aplicação: 'pending_review', 'applied', 'rejected'
  applicationStatus: varchar("applicationStatus", { length: 32 }).default("pending_review").notNull(),
  appliedByUserId: integer("appliedByUserId"),
  appliedAt: timestamp("appliedAt"),
  // Custo economizado ao reutilizar esta entrada
  costSavedPerHitUSD: doublePrecision("costSavedPerHitUSD").default(0.01425),
  hitCount: integer("hitCount").default(0).notNull(),
  // Validade: 7 dias (tabelas podem mudar de estrutura)
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SelfHealingKnowledge = typeof selfHealingKnowledgeBase.$inferSelect;
export type InsertSelfHealingKnowledge = typeof selfHealingKnowledgeBase.$inferInsert;

// ─── MÉTRICAS DE ECONOMIA DE IA ──────────────────────────────────────────────
// Registro diário de economia gerada pelo Knowledge Base (para o painel de FinOps de IA)
export const aiCostSavingsLog = pgTable("ai_cost_savings_log", {
  id: serial("id").primaryKey(),
  tenantCatalog: varchar("tenantCatalog", { length: 256 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  copilotHits: integer("copilotHits").default(0).notNull(),
  selfHealingHits: integer("selfHealingHits").default(0).notNull(),
  totalCostSavedUSD: doublePrecision("totalCostSavedUSD").default(0).notNull(),
  totalLLMCallsMade: integer("totalLLMCallsMade").default(0).notNull(),
  totalLLMCallsAvoided: integer("totalLLMCallsAvoided").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AiCostSavingsLog = typeof aiCostSavingsLog.$inferSelect;
