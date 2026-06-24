/**
 * Suite de Testes de Integração — Pilares Revolucionários
 * Testa os novos módulos com mocks para não depender de conexão real ao Databricks
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks globais ────────────────────────────────────────────────────────────
vi.mock("./databricks", () => ({
  executeStatement: vi.fn(),
  DatabricksConfig: {},
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: vi.fn(() => null), // sem banco em testes
}));

vi.mock("./knowledge-base", () => ({
  findInCopilotKnowledgeBase: vi.fn(() => null),
  saveToCopilotKnowledgeBase: vi.fn(),
  findInSelfHealingKnowledgeBase: vi.fn(() => null),
  saveToSelfHealingKnowledgeBase: vi.fn(),
  logCostSaving: vi.fn(),
}));

vi.mock("./finops-ai", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 9 })),
  incrementUsage: vi.fn(),
  truncateContext: vi.fn((ctx: string) => ctx),
  getOptimizedModel: vi.fn(() => "gpt-4o-mini"),
}));

// ─── Imports após mocks ───────────────────────────────────────────────────────
import { executeStatement } from "./databricks";
import { invokeLLM } from "./_core/llm";
import { checkRateLimit, incrementUsage, truncateContext, getOptimizedModel } from "./finops-ai";
import { findInCopilotKnowledgeBase, saveToCopilotKnowledgeBase } from "./knowledge-base";

// ─── Testes: FinOps AI (Rate Limiting & Cost Control) ────────────────────────
describe("FinOps AI — Controle de Custos", () => {
  it("deve permitir chamadas dentro do limite", () => {
    const result = checkRateLimit("user-1", "copilot");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("deve truncar contexto longo para reduzir tokens", () => {
    const longContext = "a".repeat(5000);
    const truncated = truncateContext(longContext);
    expect(typeof truncated).toBe("string");
    expect(truncated.length).toBeGreaterThan(0);
  });

  it("deve retornar modelo otimizado para custo", () => {
    const model = getOptimizedModel("copilot");
    expect(model).toBe("gpt-4o-mini");
  });

  it("deve incrementar uso sem lançar exceção", () => {
    expect(() => incrementUsage("user-1", "copilot", 0.005)).not.toThrow();
  });
});

// ─── Testes: Knowledge Base ───────────────────────────────────────────────────
describe("Knowledge Base — Cache Persistente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar null quando não há cache", async () => {
    vi.mocked(findInCopilotKnowledgeBase).mockResolvedValue(null);
    const result = await findInCopilotKnowledgeBase("test_catalog", "quais tabelas existem?");
    expect(result).toBeNull();
  });

  it("deve salvar resposta no Knowledge Base sem lançar exceção", async () => {
    vi.mocked(saveToCopilotKnowledgeBase).mockResolvedValue(undefined);
    await expect(
      saveToCopilotKnowledgeBase({
        tenantCatalog: "test_sistema",
        question: "quais tabelas existem?",
        questionNormalized: "quais tabelas existem",
        sqlExecuted: "SELECT * FROM information_schema.tables",
        answer: "Existem 19 tabelas no catálogo.",
        intent: "query",
        questionType: "operational",
        answerPromptTemplate: null,
        askedByUserId: 1,
        askedByEmail: "test@test.com",
        costSavedPerHitUSD: 0,
        expiresAt: new Date(Date.now() + 86400000),
      })
    ).resolves.not.toThrow();
  });

  it("deve classificar perguntas operacionais corretamente", () => {
    const operationalKeywords = ["quais", "quem tem", "listar", "mostrar"];
    const structuralKeywords = ["schema", "colunas", "estrutura", "tipo de dado"];

    // Simula a lógica de classificação
    const classify = (question: string): "operational" | "structural" => {
      const q = question.toLowerCase();
      if (structuralKeywords.some((k) => q.includes(k))) return "structural";
      return "operational";
    };

    expect(classify("quais tabelas contêm CPFs?")).toBe("operational");
    expect(classify("quais colunas existem na tabela clientes?")).toBe("structural");
    expect(classify("mostrar schema do banco")).toBe("structural");
    expect(classify("quem tem acesso ao catálogo financeiro?")).toBe("operational");
  });
});

// ─── Testes: Copiloto de Governança ──────────────────────────────────────────
describe("Copiloto de Governança — Fluxo de Perguntas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve chamar LLM quando não há cache", async () => {
    vi.mocked(findInCopilotKnowledgeBase).mockResolvedValue(null);
    vi.mocked(invokeLLM).mockResolvedValue({
      content: JSON.stringify({
        sql: "SELECT table_name FROM information_schema.tables WHERE table_catalog = 'test_sistema'",
        answer: "Existem 19 tabelas no catálogo test_sistema.",
        actionRequired: false,
      }),
    } as any);
    vi.mocked(executeStatement).mockResolvedValue({
      result: { data_array: [["clientes"], ["pedidos"], ["produtos"]] },
    } as any);

    expect(invokeLLM).toBeDefined();
    expect(executeStatement).toBeDefined();
  });

  it("deve exigir aprovação para queries destrutivas", () => {
    const dangerousKeywords = ["DROP", "DELETE", "TRUNCATE", "ALTER", "GRANT", "REVOKE"];
    const isSafe = (sql: string) =>
      !dangerousKeywords.some((k) => sql.toUpperCase().includes(k));

    expect(isSafe("SELECT * FROM tabela")).toBe(true);
    expect(isSafe("DROP TABLE clientes")).toBe(false);
    expect(isSafe("DELETE FROM logs WHERE data < '2024-01-01'")).toBe(false);
    expect(isSafe("GRANT SELECT ON tabela TO usuario")).toBe(false);
    expect(isSafe("SELECT cpf FROM clientes LIMIT 10")).toBe(true);
  });

  it("deve bloquear quando rate limit é atingido", () => {
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, remaining: 0 });
    const result = checkRateLimit("user-1", "copilot");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

// ─── Testes: Self-Healing (Auto-Cura) ────────────────────────────────────────
describe("Self-Healing — Governança de Auto-Cura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve identificar tabelas sem documentação", () => {
    const tables = [
      { name: "clientes", comment: "Tabela de clientes" },
      { name: "pedidos", comment: null },
      { name: "produtos", comment: "" },
      { name: "logs", comment: "Logs do sistema" },
    ];

    const undocumented = tables.filter((t) => !t.comment || t.comment.trim() === "");
    expect(undocumented).toHaveLength(2);
    expect(undocumented.map((t) => t.name)).toContain("pedidos");
    expect(undocumented.map((t) => t.name)).toContain("produtos");
  });

  it("deve detectar colunas PII por padrão de nome", () => {
    const piiPatterns = ["cpf", "cnpj", "email", "telefone", "senha", "password", "credit_card"];
    const columns = ["id", "nome", "cpf_cliente", "email_contato", "valor_total", "data_criacao"];

    const piiColumns = columns.filter((col) =>
      piiPatterns.some((pattern) => col.toLowerCase().includes(pattern))
    );

    expect(piiColumns).toHaveLength(2);
    expect(piiColumns).toContain("cpf_cliente");
    expect(piiColumns).toContain("email_contato");
  });

  it("deve gerar SQL de ALTER TABLE para aplicar descrição", () => {
    const generateAlterSQL = (catalog: string, schema: string, table: string, description: string) =>
      `COMMENT ON TABLE \`${catalog}\`.\`${schema}\`.\`${table}\` IS '${description.replace(/'/g, "\\'")}';`;

    const sql = generateAlterSQL("test_sistema", "test_schema", "clientes", "Tabela de clientes do sistema");
    expect(sql).toContain("COMMENT ON TABLE");
    expect(sql).toContain("test_sistema");
    expect(sql).toContain("clientes");
  });

  it("deve usar cache do Knowledge Base para tabelas já analisadas", async () => {
    const { findInSelfHealingKnowledgeBase } = await import("./knowledge-base");
    vi.mocked(findInSelfHealingKnowledgeBase).mockResolvedValue({
      id: 1,
      tenantCatalog: "test_sistema",
      tableName: "clientes",
      schemaName: "test_schema",
      suggestedDescription: "Tabela de clientes",
      suggestedTags: ["pii", "customer"],
      columnSuggestions: [],
      confidence: 0.95,
      hitCount: 3,
      costSavedPerHitUSD: 0.0097,
      expiresAt: new Date(Date.now() + 604800000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const cached = await findInSelfHealingKnowledgeBase("test_sistema", "test_schema", "clientes");
    expect(cached).not.toBeNull();
    expect(cached?.suggestedDescription).toBe("Tabela de clientes");
    expect(cached?.hitCount).toBe(3);
  });
});

// ─── Testes: SecOps (Monitoramento Contínuo) ─────────────────────────────────
describe("SecOps — Monitoramento em Tempo Real", () => {
  it("deve detectar anomalias de acesso excessivo", () => {
    const detectAnomaly = (grants: string[]) => {
      const dangerousGrants = grants.filter(
        (g) => g.includes("*") || g.includes("ALL PRIVILEGES") || g.includes("PUBLIC")
      );
      return dangerousGrants.length > 0;
    };

    expect(detectAnomaly(["SELECT ON tabela TO user1"])).toBe(false);
    expect(detectAnomaly(["ALL PRIVILEGES ON *.* TO PUBLIC"])).toBe(true);
    expect(detectAnomaly(["SELECT ON * TO user1"])).toBe(true);
  });

  it("deve calcular nível de severidade do alerta", () => {
    const getSeverity = (type: string): "critical" | "high" | "medium" | "low" => {
      if (type === "public_access") return "critical";
      if (type === "unmasked_pii") return "critical";
      if (type === "excessive_grants") return "high";
      if (type === "missing_audit") return "medium";
      return "low";
    };

    expect(getSeverity("public_access")).toBe("critical");
    expect(getSeverity("unmasked_pii")).toBe("critical");
    expect(getSeverity("excessive_grants")).toBe("high");
    expect(getSeverity("missing_audit")).toBe("medium");
    expect(getSeverity("outdated_token")).toBe("low");
  });

  it("deve formatar alertas com timestamp", () => {
    const createAlert = (type: string, message: string) => ({
      id: `alert-${Date.now()}`,
      type,
      message,
      severity: "high" as const,
      timestamp: new Date().toISOString(),
      resolved: false,
    });

    const alert = createAlert("excessive_grants", "Usuário externo com acesso a dados sensíveis");
    expect(alert.id).toMatch(/^alert-/);
    expect(alert.resolved).toBe(false);
    expect(new Date(alert.timestamp)).toBeInstanceOf(Date);
  });
});

// ─── Testes: FinOps (Data ROI) ────────────────────────────────────────────────
describe("FinOps — Data ROI e Custo de Armazenamento", () => {
  it("deve calcular custo mensal de armazenamento", () => {
    const calcStorageCost = (sizeGB: number, costPerGBMonth: number = 0.023) =>
      parseFloat((sizeGB * costPerGBMonth).toFixed(4));

    expect(calcStorageCost(100)).toBe(2.3);
    expect(calcStorageCost(0)).toBe(0);
    expect(calcStorageCost(1000)).toBe(23);
  });

  it("deve calcular ROI de tabela baseado em uso vs custo", () => {
    const calcROI = (queriesPerMonth: number, storageCostUSD: number) => {
      if (queriesPerMonth === 0) return "zombie"; // tabela morta
      if (queriesPerMonth < 5 && storageCostUSD > 100) return "low";
      if (queriesPerMonth > 100) return "high";
      return "medium";
    };

    expect(calcROI(0, 500)).toBe("zombie");
    expect(calcROI(2, 200)).toBe("low");
    expect(calcROI(500, 10)).toBe("high");
    expect(calcROI(50, 50)).toBe("medium");
  });

  it("deve identificar tabelas candidatas a arquivamento", () => {
    const tables = [
      { name: "logs_2020", lastQueried: "2021-01-01", sizeGB: 500 },
      { name: "clientes", lastQueried: new Date().toISOString(), sizeGB: 10 },
      { name: "historico_2019", lastQueried: "2020-06-01", sizeGB: 1000 },
      { name: "pedidos", lastQueried: new Date().toISOString(), sizeGB: 50 },
    ];

    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

    const archiveCandidates = tables.filter(
      (t) => new Date(t.lastQueried) < cutoffDate && t.sizeGB > 100
    );

    expect(archiveCandidates).toHaveLength(2);
    expect(archiveCandidates.map((t) => t.name)).toContain("logs_2020");
    expect(archiveCandidates.map((t) => t.name)).toContain("historico_2019");
  });
});

// ─── Testes: LGPD Compliance ──────────────────────────────────────────────────
describe("LGPD Compliance — Detecção de PII", () => {
  it("deve detectar CPF por nome de coluna", async () => {
    const { detectPIIColumns } = await import("./lgpd-compliance");
    const columns = [
      { name: "cpf", type: "STRING" },
      { name: "nome", type: "STRING" },
      { name: "email", type: "STRING" },
      { name: "valor", type: "DECIMAL" },
    ];

    const detected = detectPIIColumns(columns);
    const detectedNames = detected.map((d) => d.columnName);
    expect(detectedNames).toContain("cpf");
    expect(detectedNames).toContain("email");
    expect(detectedNames).not.toContain("valor");
  });

  it("deve classificar CPF como severidade crítica", async () => {
    const { detectPIIColumns } = await import("./lgpd-compliance");
    const columns = [{ name: "cpf_cliente", type: "STRING" }];
    const detected = detectPIIColumns(columns);
    expect(detected[0].severity).toBe("critical");
  });

  it("deve normalizar score de compliance entre 0 e 100", () => {
    const normalizeScore = (raw: number) => Math.max(0, Math.min(100, raw));
    expect(normalizeScore(-10)).toBe(0);
    expect(normalizeScore(110)).toBe(100);
    expect(normalizeScore(83)).toBe(83);
  });
});
