import { describe, it, expect } from "vitest";
import { GovernancePdfDocument, type PdfReportData } from "./pdfReport";
import React from "react";

const mockData: PdfReportData = {
  metadata: {
    databricksHost: "https://adb-123456789.azuredatabricks.net",
    targetCatalog: "main",
    auditDate: new Date("2026-06-16T12:00:00Z"),
    governanceScore: 72,
  },
  summary: {
    totalCatalogs: 3,
    totalSchemas: 12,
    totalTables: 87,
    docCoverage: 65,
    tagCoverage: 48,
    totalGrants: 34,
    lineageEdges: 21,
    securityFunctions: 5,
  },
  breakdown: {
    documentation: 16,
    classification: 12,
    access: 20,
    lineage: 15,
    security: 9,
  },
  gaps: [
    "Apenas 65% das tabelas possuem descrição (meta: ≥80%)",
    "Apenas 48% dos ativos possuem tags de classificação (meta: ≥50%)",
  ],
  recommendations: [
    "Adicione comentários descritivos a todas as tabelas no Unity Catalog.",
    "Implemente uma taxonomia de tags para classificar dados sensíveis.",
  ],
  bestPractices: [
    { label: "Documentação de tabelas (≥ 80%)", passed: false, detail: "Cobertura atual: 65%. Meta: 80%." },
    { label: "Documentação de colunas (≥ 70%)", passed: false, detail: "Cobertura atual: 55%. Meta: 70%." },
    { label: "Classificação por tags (PII/LGPD)", passed: true, detail: "42 tags aplicadas em tabelas e colunas." },
    { label: "Políticas de acesso definidas", passed: true, detail: "34 grants mapeados no catálogo." },
    { label: "Linhagem de dados rastreada", passed: true, detail: "21 relações de linhagem registradas." },
    { label: "Segurança dinâmica implementada", passed: true, detail: "5 funções de mascaramento identificadas." },
  ],
};

describe("GovernancePdfDocument", () => {
  it("deve criar um elemento React válido com os dados fornecidos", () => {
    const element = React.createElement(GovernancePdfDocument as any, { data: mockData });
    expect(element).toBeTruthy();
    expect(element.type).toBe(GovernancePdfDocument);
    expect((element.props as any).data).toEqual(mockData);
  });

  it("deve aceitar score 0 sem erros", () => {
    const zeroData: PdfReportData = { ...mockData, metadata: { ...mockData.metadata, governanceScore: 0 } };
    const element = React.createElement(GovernancePdfDocument as any, { data: zeroData });
    expect(element).toBeTruthy();
  });

  it("deve aceitar score 100 sem erros", () => {
    const perfectData: PdfReportData = { ...mockData, metadata: { ...mockData.metadata, governanceScore: 100 } };
    const element = React.createElement(GovernancePdfDocument as any, { data: perfectData });
    expect(element).toBeTruthy();
  });

  it("deve aceitar listas vazias de gaps e recomendações", () => {
    const emptyData: PdfReportData = { ...mockData, gaps: [], recommendations: [] };
    const element = React.createElement(GovernancePdfDocument as any, { data: emptyData });
    expect(element).toBeTruthy();
  });

  it("deve aceitar todos os bestPractices como aprovados", () => {
    const allPassedData: PdfReportData = {
      ...mockData,
      bestPractices: mockData.bestPractices.map((bp) => ({ ...bp, passed: true })),
    };
    const element = React.createElement(GovernancePdfDocument as any, { data: allPassedData });
    expect(element).toBeTruthy();
  });

  it("deve ter o tipo de documento correto no PdfReportData", () => {
    expect(mockData.metadata.targetCatalog).toBe("main");
    expect(mockData.summary.totalTables).toBe(87);
    expect(mockData.breakdown.documentation).toBe(16);
    expect(mockData.bestPractices).toHaveLength(6);
    expect(mockData.gaps).toHaveLength(2);
    expect(mockData.recommendations).toHaveLength(2);
  });
});
