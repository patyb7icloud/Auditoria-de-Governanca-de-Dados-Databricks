/**
 * LGPD (Lei Geral de Proteção de Dados) Compliance Module
 * Analyzes and reports on LGPD/GDPR compliance for data assets
 */

import { analyzeStructure, analyzeTags, DatabricksConfig, executeStatement } from "./databricks";

export interface LGPDAnalysis {
  summary: {
    complianceScore: number; // 0-100
    riskLevel: "critical" | "high" | "medium" | "low";
    criticalIssues: number;
    highRiskAssets: number;
    lastUpdated: string;
  };
  piiDetection: {
    totalColumns: number;
    piiColumnsIdentified: number;
    piiTagged: number;
    untaggedPiiRisk: number;
    categories: Array<{ name: string; count: number; tagged: number; samples: string[] }>;
  };
  dataMinimization: {
    assessment: "compliant" | "partial" | "noncompliant";
    unnecessaryColumns: string[];
    recommendations: string[];
  };
  retention: {
    assessment: "defined" | "partial" | "undefined";
    policies: Array<{
      table: string;
      retentionDays?: number;
      deletePolicy?: string;
      assessment: "defined" | "undefined";
    }>;
    gaps: string[];
  };
  consent: {
    assessment: "tracked" | "partial" | "untracked";
    consentFields: string[];
    missingSources: string[];
  };
  encryption: {
    assessment: "enabled" | "partial" | "disabled";
    encryptedTables: number | null;
    unencryptedTables: number | null;
    recommendations: string[];
  };
  audit: {
    accessLogsEnabled: boolean | null;
    logRetention: number; // days
    lastAuditDate?: string;
    accessEvents: number;
  };
  dsr: {
    readyForDSR: boolean | null;
    readyForDeletion: boolean | null;
    readyForExport: boolean | null;
    gaps: string[];
  };
  responsibilities: {
    dataController: string; // e.g., "Casas Bahia"
    dataProcessor?: string; // e.g., "Databricks"
    dpo?: string; // Data Protection Officer contact
    owner: string; // table/schema owner
  };
}

export interface PiiPattern {
  name: string;
  keywords: string[];
  patterns: RegExp[];
  dataTypes: string[];
  severity: "critical" | "high" | "medium";
}

const PII_PATTERNS: PiiPattern[] = [
  {
    name: "Email",
    keywords: ["email", "mail", "e_mail"],
    patterns: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/],
    dataTypes: ["STRING", "VARCHAR"],
    severity: "high",
  },
  {
    name: "CPF (Cadastro de Pessoa Física)",
    keywords: ["cpf", "documento"],
    patterns: [/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, /^\d{11}$/],
    dataTypes: ["STRING", "VARCHAR"],
    severity: "critical",
  },
  {
    name: "CNPJ",
    keywords: ["cnpj"],
    patterns: [/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, /^\d{14}$/],
    dataTypes: ["STRING", "VARCHAR"],
    severity: "critical",
  },
  {
    name: "Telefone",
    keywords: ["telefone", "phone", "celular", "mobile"],
    patterns: [/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, /^\d{10,11}$/],
    dataTypes: ["STRING", "VARCHAR", "BIGINT"],
    severity: "high",
  },
  {
    name: "Endereço",
    keywords: ["endereco", "address", "rua", "avenida", "logradouro"],
    patterns: [],
    dataTypes: ["STRING", "VARCHAR"],
    severity: "high",
  },
  {
    name: "Data de Nascimento",
    keywords: ["data_nascimento", "birthdate", "dob", "nascimento"],
    patterns: [/^\d{2}\/\d{2}\/\d{4}$/],
    dataTypes: ["DATE", "TIMESTAMP", "STRING"],
    severity: "high",
  },
  {
    name: "RG",
    keywords: ["rg", "registro_geral"],
    patterns: [/^\d{1,2}\.\d{3}\.\d{3}-[\dX]$/],
    dataTypes: ["STRING", "VARCHAR"],
    severity: "high",
  },
  {
    name: "Cartão de Crédito",
    keywords: ["cartao", "credit_card", "cc_number"],
    patterns: [/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/],
    dataTypes: ["STRING", "VARCHAR"],
    severity: "critical",
  },
];

export async function analyzeLGPDCompliance(
  config: DatabricksConfig
): Promise<LGPDAnalysis> {
  const [structure, tags, columnsResult] = await Promise.all([
    analyzeStructure(config),
    analyzeTags(config),
    executeStatement(
      config,
      `SELECT table_schema, table_name, column_name, data_type FROM ${config.catalog}.information_schema.columns`
    ),
  ]);

  const columns = columnsResult.rows ?? [];
  const qualified = (row: Record<string, string | null>, column?: string | null) =>
    [row.table_schema ?? row.schema_name, row.table_name, column ?? row.column_name]
      .filter(Boolean)
      .join(".");

  const piiDetections = columns.flatMap((column) =>
    detectPIIColumns([
      { name: column.column_name ?? "", type: column.data_type ?? "" },
    ]).map((detection) => ({
      ...detection,
      columnName: qualified(column, detection.columnName),
      sourceColumnName: detection.columnName,
    }))
  );

  const taggedPiiKeys = new Set(
    (tags.columnTags ?? []).map((tag) => qualified(tag, tag.column_name))
  );
  const piiTagged = piiDetections.filter((detection) =>
    taggedPiiKeys.has(detection.columnName)
  ).length;

  const categories = Array.from(
    piiDetections.reduce((byCategory, detection) => {
      const current = byCategory.get(detection.detectedAs) ?? {
        name: detection.detectedAs,
        count: 0,
        tagged: 0,
        samples: [] as string[],
      };
      current.count += 1;
      if (taggedPiiKeys.has(detection.columnName)) current.tagged += 1;
      if (current.samples.length < 5) current.samples.push(detection.columnName);
      byCategory.set(detection.detectedAs, current);
      return byCategory;
    }, new Map<string, { name: string; count: number; tagged: number; samples: string[] }>()),
  ).map(([, category]) => category);

  const retentionColumns = columns.filter((column) =>
    /(retention|expires|expiry|deleted_at|deletion_date|retention_days)/i.test(
      column.column_name ?? ""
    )
  );
  const consentFields = columns
    .filter((column) => /(consent|consented|consent_date)/i.test(column.column_name ?? ""))
    .map((column) => qualified(column, column.column_name));
  const retentionTables = Array.from(
    new Set(retentionColumns.map((column) => qualified(column).split(".").slice(0, 2).join(".")))
  );
  const totalTables = structure.summary.totalTables + structure.summary.totalViews;
  const piiCoverage = piiDetections.length > 0 ? piiTagged / piiDetections.length : 1;
  const retentionCoverage = totalTables > 0 ? retentionTables.length / totalTables : 0;
  const score = Math.round(piiCoverage * 50 + retentionCoverage * 20);
  const riskLevel: LGPDAnalysis["summary"]["riskLevel"] =
    score >= 80 ? "low" : score >= 60 ? "medium" : score >= 30 ? "high" : "critical";

  const untaggedPiiRisk = Math.max(0, piiDetections.length - piiTagged);
  const criticalIssues = [
    untaggedPiiRisk > 0,
    retentionTables.length === 0,
    consentFields.length === 0,
  ].filter(Boolean).length;

  return {
    summary: {
      complianceScore: score,
      riskLevel,
      criticalIssues,
      highRiskAssets: untaggedPiiRisk,
      lastUpdated: new Date().toISOString(),
    },
    piiDetection: {
      totalColumns: columns.length,
      piiColumnsIdentified: piiDetections.length,
      piiTagged,
      untaggedPiiRisk,
      categories,
    },
    dataMinimization: {
      assessment: piiDetections.length === 0 ? "compliant" : "partial",
      unnecessaryColumns: [],
      recommendations: piiDetections.length > 0
        ? ["Revise as colunas PII identificadas e aplique minimização conforme a finalidade de uso."]
        : [],
    },
    retention: {
      assessment: retentionTables.length > 0 ? "defined" : "undefined",
      policies: retentionTables.map((table) => ({ table, assessment: "defined" as const })),
      gaps: retentionTables.length === 0
        ? ["Nenhum campo de retenção ou expiração foi encontrado no Unity Catalog."]
        : [],
    },
    consent: {
      assessment: consentFields.length > 0 ? "tracked" : "untracked",
      consentFields,
      missingSources: consentFields.length === 0
        ? ["Nenhum campo de consentimento foi encontrado nas colunas catalogadas."]
        : [],
    },
    encryption: {
      assessment: "partial",
      encryptedTables: null,
      unencryptedTables: null,
      recommendations: [
        "O Unity Catalog consultado não expõe, nesta análise, uma evidência suficiente para afirmar o estado de criptografia física.",
      ],
    },
    audit: {
      accessLogsEnabled: null,
      logRetention: 0,
      accessEvents: 0,
    },
    dsr: {
      readyForDSR: null,
      readyForDeletion: null,
      readyForExport: null,
      gaps: ["A prontidão de DSR depende de workflows operacionais que não são expostos pelo information_schema consultado."],
    },
    responsibilities: {
      dataController: config.catalog,
      dataProcessor: "Databricks",
      owner: "Não informado no Unity Catalog",
    },
  };
}

/**
 * Detect PII columns based on name patterns and data characteristics
 */
export function detectPIIColumns(
  columns: Array<{ name: string; type: string }>,
  sampleData?: Record<string, unknown>[]
): Array<{
  columnName: string;
  detectedAs: string;
  confidence: number;
  severity: string;
}> {
  const detected: Array<{
    columnName: string;
    detectedAs: string;
    confidence: number;
    severity: string;
  }> = [];

  for (const col of columns) {
    const colLower = col.name.toLowerCase();

    for (const pattern of PII_PATTERNS) {
      let confidence = 0;

      // Name-based detection
      if (pattern.keywords.some((kw) => colLower.includes(kw))) {
        confidence += 0.5;
      }

      // Type-based detection
      if (pattern.dataTypes.includes(col.type.toUpperCase())) {
        confidence += 0.2;
      }

      // Sample data pattern matching
      if (sampleData && sampleData.length > 0) {
        const sampleValue = sampleData[0]?.[col.name];
        if (typeof sampleValue === "string") {
          const matchCount = pattern.patterns.filter((p) =>
            p.test(sampleValue)
          ).length;
          if (matchCount > 0) confidence += 0.3;
        }
      }

      if (confidence >= 0.5) {
        detected.push({
          columnName: col.name,
          detectedAs: pattern.name,
          confidence: Math.min(confidence, 1),
          severity: pattern.severity,
        });
        break; // Avoid duplicate detections
      }
    }
  }

  return detected;
}

/**
 * Generate LGPD compliance gaps and recommendations
 */
export function generateLGPDRecommendations(
  analysis: LGPDAnalysis,
  language: "pt" | "en" = "pt",
): Array<{ priority: "critical" | "high" | "medium"; action: string }> {
  const recommendations: Array<{
    priority: "critical" | "high" | "medium";
    action: string;
  }> = [];
  const isEnglish = language === "en";

  // PII gaps
  if (analysis.piiDetection.untaggedPiiRisk > 0) {
    recommendations.push({
      priority: "critical",
      action: isEnglish
        ? `Apply PII tags to ${analysis.piiDetection.untaggedPiiRisk} untagged PII columns`
        : `Aplicar tags de PII em ${analysis.piiDetection.untaggedPiiRisk} colunas PII não etiquetadas`,
    });
  }

  // Retention gaps
  if (analysis.retention.assessment === "undefined") {
    recommendations.push({
      priority: "critical",
      action: isEnglish
        ? "Define and implement data retention policies (e.g., delete customer data after 5 years)"
        : "Definir e implementar políticas de retenção de dados (por exemplo, excluir dados de clientes após 5 anos)",
    });
  }

  // Encryption gaps are generated only when the catalog supplied a measured value.
  if (analysis.encryption.unencryptedTables !== null && analysis.encryption.unencryptedTables > 5) {
    recommendations.push({
      priority: "high",
      action: isEnglish
        ? `Enable encryption for ${analysis.encryption.unencryptedTables} tables containing PII`
        : `Habilitar criptografia para ${analysis.encryption.unencryptedTables} tabelas que contêm PII`,
    });
  }

  // null means that the catalog did not provide verifiable evidence; it is not disabled.
  if (analysis.audit.accessLogsEnabled === false) {
    recommendations.push({
      priority: "high",
      action: isEnglish
        ? "Enable comprehensive access logging for compliance audit trails"
        : "Habilitar logs abrangentes de acesso para trilhas de auditoria de conformidade",
    });
  }

  // DSR gaps are generated only when the analysis explicitly reports not ready.
  if (analysis.dsr.readyForDSR === false) {
    recommendations.push({
      priority: "high",
      action: isEnglish
        ? "Implement automated Data Subject Request (DSR) workflow for export/deletion"
        : "Implementar workflow automatizado de Solicitação do Titular (DSR) para exportação/exclusão",
    });
  }

  // Consent tracking
  if (analysis.consent.assessment === "untracked") {
    recommendations.push({
      priority: "medium",
      action: isEnglish
        ? "Add consent tracking fields to tables containing personal data"
        : "Adicionar campos de rastreamento de consentimento às tabelas que contêm dados pessoais",
    });
  }

  return recommendations;
}
