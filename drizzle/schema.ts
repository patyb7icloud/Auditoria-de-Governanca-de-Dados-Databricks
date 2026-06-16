import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Sessões de auditoria do Databricks
export const auditSessions = mysqlTable("audit_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  databricksHost: varchar("databricksHost", { length: 512 }).notNull(),
  targetCatalog: varchar("targetCatalog", { length: 256 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"])
    .default("pending")
    .notNull(),
  governanceScore: float("governanceScore"),
  totalCatalogs: int("totalCatalogs"),
  totalSchemas: int("totalSchemas"),
  totalTables: int("totalTables"),
  docCoverage: float("docCoverage"),
  tagCoverage: float("tagCoverage"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuditSession = typeof auditSessions.$inferSelect;
export type InsertAuditSession = typeof auditSessions.$inferInsert;

// Resultados individuais de cada análise
export const analysisResults = mysqlTable("analysis_results", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  analysisType: mysqlEnum("analysisType", [
    "structure",
    "glossary",
    "tags",
    "access",
    "lineage",
    "security",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"])
    .default("pending")
    .notNull(),
  resultData: json("resultData"),
  recommendations: json("recommendations"),
  gaps: json("gaps"),
  score: float("score"),
  executionMs: int("executionMs"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;
