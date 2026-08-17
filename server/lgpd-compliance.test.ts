import { describe, expect, it } from "vitest";
import { generateLGPDRecommendations, LGPDAnalysis } from "./lgpd-compliance";

const baseAnalysis: LGPDAnalysis = {
  summary: {
    complianceScore: 50,
    riskLevel: "high",
    criticalIssues: 1,
    highRiskAssets: 1,
    lastUpdated: "2026-01-01T00:00:00.000Z",
  },
  piiDetection: {
    totalColumns: 10,
    piiColumnsIdentified: 2,
    piiTagged: 0,
    untaggedPiiRisk: 2,
    categories: [],
  },
  dataMinimization: {
    assessment: "partial",
    unnecessaryColumns: [],
    recommendations: [],
  },
  retention: {
    assessment: "undefined",
    policies: [],
    gaps: [],
  },
  consent: {
    assessment: "untracked",
    consentFields: [],
    missingSources: [],
  },
  encryption: {
    assessment: "partial",
    encryptedTables: null,
    unencryptedTables: null,
    recommendations: [],
  },
  audit: {
    accessLogsEnabled: null,
    logRetention: 0,
    accessEvents: 0,
  },
  dsr: {
    readyForDSR: false,
    readyForDeletion: false,
    readyForExport: false,
    gaps: [],
  },
  responsibilities: {
    dataController: "Example",
    owner: "admin",
  },
};

describe("generateLGPDRecommendations", () => {
  it("returns Portuguese recommendations by default", () => {
    const recommendations = generateLGPDRecommendations(baseAnalysis);
    const actions = recommendations.map(({ action }) => action);

    expect(actions.some((action) => action.includes("Aplicar tags de PII"))).toBe(true);
    expect(actions.some((action) => action.includes("Apply PII tags"))).toBe(false);
    expect(actions.some((action) => action.includes("logs abrangentes"))).toBe(false);
  });

  it("returns English recommendations only when English is selected", () => {
    const recommendations = generateLGPDRecommendations(baseAnalysis, "en");
    const actions = recommendations.map(({ action }) => action);

    expect(actions.some((action) => action.includes("Apply PII tags"))).toBe(true);
    expect(actions.some((action) => action.includes("Aplicar tags de PII"))).toBe(false);
  });

  it("does not recommend encryption or audit logging when evidence is unavailable", () => {
    const recommendations = generateLGPDRecommendations(baseAnalysis);

    expect(recommendations.some(({ action }) => action.toLowerCase().includes("criptografia"))).toBe(false);
    expect(recommendations.some(({ action }) => action.toLowerCase().includes("logs"))).toBe(false);
  });

  it("recommends audit logging only when the analysis explicitly reports it disabled", () => {
    const recommendations = generateLGPDRecommendations({
      ...baseAnalysis,
      audit: { ...baseAnalysis.audit, accessLogsEnabled: false },
    });

    expect(recommendations.some(({ action }) => action.includes("Habilitar logs"))).toBe(true);
  });
});
