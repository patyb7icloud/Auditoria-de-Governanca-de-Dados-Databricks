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
