-- Migration: 0002_knowledge_base
-- Cria as tabelas do Knowledge Base persistente para o Copiloto e Self-Healing
-- e adiciona os campos de classificação de perguntas.

-- ─── TABELA: copilot_knowledge_base ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "copilot_knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantCatalog" varchar(256) NOT NULL,
	"question" text NOT NULL,
	"questionNormalized" text NOT NULL,
	"sqlExecuted" text,
	"answer" text NOT NULL,
	"resultData" json,
	"intent" varchar(16) DEFAULT 'read',
	"questionType" varchar(16) DEFAULT 'operational' NOT NULL,
	"answerPromptTemplate" text,
	"askedByUserId" integer,
	"askedByEmail" varchar(320),
	"hitCount" integer DEFAULT 0 NOT NULL,
	"costSavedPerHitUSD" double precision DEFAULT 0.0097,
	"expiresAt" timestamp,
	"feedback" varchar(16),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ─── TABELA: self_healing_knowledge_base ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "self_healing_knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantCatalog" varchar(256) NOT NULL,
	"schemaName" varchar(256) NOT NULL,
	"tableName" varchar(256) NOT NULL,
	"suggestions" json NOT NULL,
	"applicationStatus" varchar(32) DEFAULT 'pending_review' NOT NULL,
	"appliedByUserId" integer,
	"appliedAt" timestamp,
	"costSavedPerHitUSD" double precision DEFAULT 0.01425,
	"hitCount" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ─── TABELA: ai_cost_savings_log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ai_cost_savings_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantCatalog" varchar(256) NOT NULL,
	"date" varchar(10) NOT NULL,
	"copilotHits" integer DEFAULT 0 NOT NULL,
	"selfHealingHits" integer DEFAULT 0 NOT NULL,
	"totalCostSavedUSD" double precision DEFAULT 0 NOT NULL,
	"totalLLMCallsMade" integer DEFAULT 0 NOT NULL,
	"totalLLMCallsAvoided" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ─── ÍNDICES para performance de busca ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS "kb_tenant_question_idx" ON "copilot_knowledge_base" ("tenantCatalog", "questionNormalized");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_expires_idx" ON "copilot_knowledge_base" ("expiresAt");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sh_kb_table_idx" ON "self_healing_knowledge_base" ("tenantCatalog", "schemaName", "tableName");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_log_tenant_date_idx" ON "ai_cost_savings_log" ("tenantCatalog", "date");
