import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, auditSessions, analysisResults, InsertAuditSession, InsertAnalysisResult } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      if (!_sql) _sql = postgres(process.env.DATABASE_URL);
      _db = drizzle(_sql);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Audit Sessions ───────────────────────────────────────────────────────────

export async function createAuditSession(data: InsertAuditSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db.insert(auditSessions).values(data).returning({ id: auditSessions.id });
  return (inserted[0] as any).id as number;
}

export async function updateAuditSession(id: number, data: Partial<InsertAuditSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(auditSessions).set(data).where(eq(auditSessions.id, id));
}

export async function getAuditSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(auditSessions).where(eq(auditSessions.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getAuditSessionsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(auditSessions).where(eq(auditSessions.userId, userId)).orderBy(desc(auditSessions.createdAt)).limit(20);
}

// ─── Analysis Results ─────────────────────────────────────────────────────────

export async function createAnalysisResult(data: InsertAnalysisResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db.insert(analysisResults).values(data).returning({ id: analysisResults.id });
  return (inserted[0] as any).id as number;
}

export async function updateAnalysisResult(id: number, data: Partial<InsertAnalysisResult>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(analysisResults).set(data).where(eq(analysisResults.id, id));
}

export async function getAnalysisResultsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(analysisResults).where(eq(analysisResults.sessionId, sessionId));
}
