import { describe, expect, it } from "vitest";
import { computeGovernanceScore, GovernanceAnalysisData } from "./databricks";

const mockData: GovernanceAnalysisData = {
  structure: {
    catalogs: [{ catalog_name: "main", catalog_owner: "admin", comment: null }],
    schemas: [{ catalog_name: "main", schema_name: "default", schema_owner: "admin", comment: null }],
    tables: [
      { table_catalog: "main", table_schema: "default", table_name: "orders", table_type: "BASE TABLE", table_owner: "admin" },
      { table_catalog: "main", table_schema: "default", table_name: "customers", table_type: "BASE TABLE", table_owner: "admin" },
    ],
    summary: { totalCatalogs: 1, totalSchemas: 1, totalTables: 2, totalViews: 0 },
  },
  glossary: {
    tablesWithComments: [{ table_catalog: "main", table_schema: "default", table_name: "orders", table_description: "Orders table" }],
    columnsWithComments: [],
    summary: {
      totalTables: 2,
      documentedTables: 1,
      tableDocCoverage: 50,
      totalColumns: 10,
      documentedColumns: 3,
      columnDocCoverage: 30,
    },
  },
  tags: {
    tableTags: [],
    columnTags: [],
    tagDistribution: [],
    summary: { totalTableTags: 0, totalColumnTags: 0, uniqueTags: 0, tablesWithTags: 0, sensitiveDataTagged: 0 },
  },
  access: {
    tablePrivileges: [{ grantor: "admin", grantee: "analyst", table_catalog: "main", table_schema: "default", table_name: "orders", privilege_type: "SELECT" }],
    catalogPrivileges: [],
    schemaPrivileges: [],
    privilegeDistribution: [{ name: "SELECT", count: 1 }],
    summary: { totalGrants: 1, uniqueGrantees: 1, tableGrants: 1, catalogGrants: 0, schemaGrants: 0 },
  },
  lineage: {
    lineageEdges: [],
    summary: { totalEdges: 0, uniqueSources: 0, uniqueTargets: 0 },
  },
  security: {
    maskingFunctions: [],
    rowFilters: [],
    columnMasks: [],
    summary: { totalFunctions: 0, rowFilterCount: 0, columnMaskCount: 0, tablesChecked: 2 },
  },
};

describe("computeGovernanceScore", () => {
  it("returns a score between 0 and 100", () => {
    const result = computeGovernanceScore(mockData);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("generates gaps when documentation coverage is below threshold", () => {
    const result = computeGovernanceScore(mockData);
    const hasDocGap = result.gaps.some((g) => g.includes("tabelas possuem descrição") || g.includes("colunas possuem descrição"));
    expect(hasDocGap).toBe(true);
  });

  it("generates gap when no tags are applied", () => {
    const result = computeGovernanceScore(mockData);
    const hasTagGap = result.gaps.some((g) => g.includes("tags de classificação") || g.includes("PII"));
    expect(hasTagGap).toBe(true);
  });

  it("generates gap when no lineage is found", () => {
    const result = computeGovernanceScore(mockData);
    const hasLineageGap = result.gaps.some((g) => g.includes("linhagem"));
    expect(hasLineageGap).toBe(true);
  });

  it("generates gap when no security functions are found", () => {
    const result = computeGovernanceScore(mockData);
    const hasSecGap = result.gaps.some((g) => g.includes("mascaramento") || g.includes("filtro de linha"));
    expect(hasSecGap).toBe(true);
  });

  it("counts column-only tags as tagged asset coverage", () => {
    const columnOnlyTaggedData: GovernanceAnalysisData = {
      ...mockData,
      tags: {
        ...mockData.tags,
        columnTags: [
          { catalog_name: "main", schema_name: "default", table_name: "orders", column_name: "email", tag_name: "pii" },
          { catalog_name: "main", schema_name: "default", table_name: "orders", column_name: "cpf", tag_name: "sensitive" },
        ],
        summary: { totalTableTags: 0, totalColumnTags: 2, uniqueTags: 2, tablesWithTags: 1, sensitiveDataTagged: 2 },
      },
    };

    const result = computeGovernanceScore(columnOnlyTaggedData);

    expect(result.breakdown.classification).toBe(10);
    expect(result.gaps.some((gap) => gap.includes("0% dos ativos"))).toBe(false);
  });

  it("returns recommendations array", () => {
    const result = computeGovernanceScore(mockData);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("returns breakdown with expected keys", () => {
    const result = computeGovernanceScore(mockData);
    expect(result.breakdown).toHaveProperty("documentation");
    expect(result.breakdown).toHaveProperty("classification");
    expect(result.breakdown).toHaveProperty("access");
    expect(result.breakdown).toHaveProperty("lineage");
    expect(result.breakdown).toHaveProperty("security");
  });

  it("gives higher score when all best practices are met", () => {
    const goodData: GovernanceAnalysisData = {
      ...mockData,
      glossary: {
        ...mockData.glossary,
        summary: { totalTables: 10, documentedTables: 9, tableDocCoverage: 90, totalColumns: 50, documentedColumns: 35, columnDocCoverage: 70 },
      },
      tags: {
        ...mockData.tags,
        summary: { totalTableTags: 8, totalColumnTags: 5, uniqueTags: 4, tablesWithTags: 2, sensitiveDataTagged: 3 },
      },
      lineage: {
        lineageEdges: [{ source_table_catalog: "main", source_table_schema: "default", source_table_name: "raw", target_table_catalog: "main", target_table_schema: "default", target_table_name: "orders" }],
        summary: { totalEdges: 1, uniqueSources: 1, uniqueTargets: 1 },
      },
      security: {
        ...mockData.security,
        maskingFunctions: [{ routine_catalog: "main", routine_schema: "default", routine_name: "mask_email", routine_definition: "SELECT mask_value(email)" }],
        summary: { totalFunctions: 1, rowFilterCount: 0, columnMaskCount: 1, tablesChecked: 2 },
      },
    };
    const goodResult = computeGovernanceScore(goodData);
    const baseResult = computeGovernanceScore(mockData);
    expect(goodResult.score).toBeGreaterThan(baseResult.score);
  });
});
