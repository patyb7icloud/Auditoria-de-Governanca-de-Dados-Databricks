// Example usage of LGPD Compliance features

// ============================================================
// 1. BACKEND: Analyzing LGPD Compliance
// ============================================================

import { analyzeLGPDCompliance, generateLGPDRecommendations } from './server/lgpd-compliance';

async function exampleBackendAnalysis() {
  // Configuration for Databricks
  const config = {
    host: 'https://adb-2338706343670020.0.azuredatabricks.net',
    token: 'dapi12345...',
    catalog: 'test_sistema',
  };

  // 1. Analyze LGPD compliance
  const analysis = await analyzeLGPDCompliance(config);
  
  console.log('Compliance Score:', analysis.summary.complianceScore); // 45
  console.log('Risk Level:', analysis.summary.riskLevel); // 'high'
  console.log('Critical Issues:', analysis.summary.criticalIssues); // 3
  console.log('Untagged PII Risk:', analysis.piiDetection.untaggedPiiRisk); // 5
  
  // 2. Generate recommendations
  const recommendations = generateLGPDRecommendations(analysis);
  
  recommendations.forEach((rec) => {
    console.log(`[${rec.priority.toUpperCase()}] ${rec.action}`);
  });
  // Output:
  // [CRITICAL] Apply PII tags to 5 untagged PII columns
  // [CRITICAL] Define and implement data retention policies
  // [HIGH] Enable comprehensive access logging for compliance audit trails
  // [HIGH] Implement automated Data Subject Request (DSR) workflow
  // [MEDIUM] Add consent tracking fields to tables containing personal data
}

// ============================================================
// 2. FRONTEND: Using PII Detection Hook
// ============================================================

import { usePIIDetection, groupPIIByCategory, getPIIProtectionStatus } from '@/hooks/usePIIDetection';

function ExampleTableAnalysis() {
  // Sample table columns
  const columns = [
    { name: 'id', type: 'INT' },
    { name: 'email_cliente', type: 'VARCHAR', sampleValues: ['john@example.com'] },
    { name: 'cpf_cadastro', type: 'STRING', sampleValues: ['123.456.789-00'] },
    { name: 'data_nascimento', type: 'DATE', sampleValues: ['1990-05-15'] },
    { name: 'endereco_completo', type: 'VARCHAR' },
    { name: 'telefone_contato', type: 'VARCHAR', sampleValues: ['11999999999'] },
    { name: 'nome_completo', type: 'VARCHAR' },
  ];

  // Use the hook
  const detections = usePIIDetection(columns);
  
  console.log('Detected PII:');
  detections.forEach((det) => {
    console.log(`  ${det.columnName}: ${det.category} (${Math.round(det.confidence * 100)}% confidence, ${det.severity})`);
  });
  // Output:
  // Detected PII:
  //   email_cliente: Email (85% confidence, high)
  //   cpf_cadastro: CPF (95% confidence, critical)
  //   data_nascimento: Data de Nascimento (90% confidence, high)
  //   endereco_completo: Endereço (60% confidence, high)
  //   telefone_contato: Telefone (88% confidence, high)
  //   nome_completo: Nome (72% confidence, high)
  
  // Group by category
  const grouped = groupPIIByCategory(detections);
  console.log('Grouped PII:');
  Object.entries(grouped).forEach(([category, items]) => {
    console.log(`  ${category}: ${items.length} columns`);
  });
  // Output:
  // Grouped PII:
  //   Email: 1 columns
  //   CPF: 1 columns
  //   Data de Nascimento: 1 columns
  //   Endereço: 1 columns
  //   Telefone: 1 columns
  //   Nome: 1 columns
  
  // Get protection status
  const status = getPIIProtectionStatus(detections, 0); // 0 = no columns tagged
  console.log('Protection Status:', status); // 'critical' (untagged critical PII detected)
  
  return (
    <div>
      <h2>PII Detection Results</h2>
      <p>Found {detections.length} PII columns (Status: {status})</p>
      <ul>
        {detections.map((det) => (
          <li key={det.columnName}>
            <strong>{det.columnName}</strong> — {det.category} 
            ({Math.round(det.confidence * 100)}% confidence, <span style={{ color: 'red' }}>{det.severity}</span>)
            <ul>
              {det.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// 3. FRONTEND: Using LGPD Compliance Panel
// ============================================================

import { LGPDCompliancePanel } from '@/components/LGPDCompliancePanel';

function ExampleComplianceDashboard() {
  // Data from backend analysis
  const complianceData = {
    score: 45,
    riskLevel: 'high' as const,
    criticalIssues: 3,
    piiColumnsUntagged: 5,
    retentionPolicies: 0,
    encryptedTables: 2,
    auditLogsEnabled: false,
    dsrReadiness: {
      export: false,
      delete: false,
      access: false,
    },
    recommendations: [
      {
        priority: 'critical' as const,
        action: 'Apply PII tags to 5 untagged columns (CPF, Email, etc.)',
      },
      {
        priority: 'critical' as const,
        action: 'Define data retention policies for customer data',
      },
      {
        priority: 'high' as const,
        action: 'Enable comprehensive access logging',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1>Data Governance Dashboard</h1>
      
      <LGPDCompliancePanel {...complianceData} />
      
      {/* This renders:
        - LGPD/GDPR Compliance Score card (45/100, HIGH risk)
        - Alert for 3 critical issues
        - Metrics grid: PII Detection (5 untagged), Retention Policy (0), 
                        Encryption (2 tables), Audit Logs (OFF)
        - Data Subject Rights readiness (Export: ❌, Delete: ❌, Access: ❌)
        - Compliance recommendations with badges
        - LGPD Compliance Checklist with checkmarks
      */}
    </div>
  );
}

// ============================================================
// 4. FRONTEND: Using Governance Recommendations
// ============================================================

import { 
  GovernanceRecommendations, 
  generateRecommendations 
} from '@/components/GovernanceRecommendations';

function ExampleRecommendationsPanel() {
  // Analysis data from audit
  const analysisData = {
    piiUntagged: 5,
    tagCoverage: 40,
    docCoverage: 50,
    encryptedTables: 2,
    totalTables: 20,
    auditLogsEnabled: false,
    retentionPolicies: 0,
  };

  // Generate recommendations
  const recommendations = generateRecommendations(analysisData);

  const handleImplementRecommendation = (rec) => {
    console.log(`Implementing: ${rec.title}`);
    
    // Depending on the recommendation, trigger different workflows:
    switch (rec.id) {
      case 'pii-tagging':
        // Open PII tagging wizard
        openPIITaggingWizard();
        break;
      case 'audit-logs':
        // Navigate to workspace settings
        window.open('https://databricks.com/settings/audit-logs');
        break;
      case 'retention-policies':
        // Open retention policy creator
        openRetentionPolicyCreator();
        break;
      // ... other cases
    }
  };

  return (
    <div className="p-6">
      <h2>Governance Recommendations</h2>
      <p>{recommendations.length} recommendations found</p>
      
      <GovernanceRecommendations
        recommendations={recommendations}
        onImplement={handleImplementRecommendation}
      />
      
      {/* This renders:
        - Summary stats: 1 Critical, 2 High, 1 Medium, 1 Low
        - Grouped by priority with icons
        - Each recommendation shows:
          - Title and description
          - Impact estimate ("Improves score by X%")
          - Estimated effort badge
          - Related assets
          - "Implement" button
        - Quick wins section highlighting fastest wins
      */}
    </div>
  );
}

// ============================================================
// 5. FRONTEND: Compliance Page (Complete Example)
// ============================================================

import { LGPDCompliance } from '@/pages/Compliance';

// In your App.tsx router:
// <Route path="/compliance" component={LGPDCompliance} />

// The page includes:
// - Header with compliance score (45/100) and risk level (HIGH)
// - Critical alert banner
// - 4 tabs:
//   1. "Visão Geral" — LGPDCompliancePanel
//   2. "Recomendações" — GovernanceRecommendations (with badges)
//   3. "Dados Pessoais" — PII breakdown by category
//   4. "Progresso" — Historical score tracking and next steps

// ============================================================
// 6. BACKEND: tRPC Router Integration
// ============================================================

import { appRouter } from './server/routers';
import { analyzeLGPDCompliance } from './server/lgpd-compliance';

// Add to server/routers.ts:
const updatedRouter = {
  ...appRouter,
  lgpd: router({
    // Analyze LGPD compliance for catalog
    analyzeCompliance: protectedProcedure
      .input(z.object({
        host: z.string(),
        token: z.string(),
        catalog: z.string(),
      }))
      .mutation(async ({ input }) => {
        const analysis = await analyzeLGPDCompliance(input);
        
        // TODO: Save to compliance_assessments table
        // await db.complianceAssessments.insert({...})
        
        return analysis;
      }),

    // Detect PII in specific table
    detectTablePII: protectedProcedure
      .input(z.object({
        catalog: z.string(),
        schema: z.string(),
        table: z.string(),
      }))
      .query(async ({ input }) => {
        // TODO: Query Databricks for table schema
        // TODO: Run PII detection using detectPIIColumns
        // TODO: Return results
      }),

    // Generate compliance report
    generateComplianceReport: protectedProcedure
      .input(z.object({
        sessionId: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // TODO: Fetch analysis from DB
        // TODO: Generate PDF using LGPDCompliancePdfPage
        // TODO: Return PDF stream
      }),
  }),
};

// ============================================================
// 7. USAGE IN TESTS
// ============================================================

describe('LGPD Compliance Features', () => {
  test('should detect PII in table columns', () => {
    const columns = [
      { name: 'cpf', type: 'STRING' },
      { name: 'email', type: 'VARCHAR' },
    ];
    
    const detections = usePIIDetection(columns);
    
    expect(detections).toHaveLength(2);
    expect(detections[0].category).toBe('CPF');
    expect(detections[0].severity).toBe('critical');
    expect(detections[1].category).toBe('Email');
    expect(detections[1].severity).toBe('high');
  });

  test('should generate compliance recommendations', () => {
    const data = {
      piiUntagged: 5,
      tagCoverage: 0,
      docCoverage: 30,
      encryptedTables: 0,
      totalTables: 20,
      auditLogsEnabled: false,
      retentionPolicies: 0,
    };
    
    const recs = generateRecommendations(data);
    
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some(r => r.priority === 'critical')).toBe(true);
    expect(recs.some(r => r.category === 'pii')).toBe(true);
  });

  test('should classify PII protection status', () => {
    const detections = [
      { 
        columnName: 'cpf', 
        category: 'CPF', 
        severity: 'critical',
        confidence: 0.95,
        recommendations: [],
      },
    ];
    
    const status = getPIIProtectionStatus(detections, 0); // 0 tagged
    expect(status).toBe('critical');
    
    const statusTagged = getPIIProtectionStatus(detections, 1); // 1 tagged
    expect(statusTagged).toBe('safe');
  });
});

// ============================================================
// 8. INTEGRATION CHECKLIST
// ============================================================

/*
To integrate LGPD Compliance features into your app:

Frontend:
  [ ] Import and render <Compliance /> page component
  [ ] Add /compliance route to App.tsx
  [ ] Integrate <LGPDCompliancePanel /> in main Dashboard
  [ ] Use usePIIDetection hook in table analysis workflows
  [ ] Display <GovernanceRecommendations /> in governance views

Backend:
  [ ] Add lgpd router to appRouter in routers.ts
  [ ] Create compliance_assessments table in schema.ts
  [ ] Implement DB helpers in db.ts for compliance data
  [ ] Add tRPC procedures for compliance analysis
  [ ] Wire PDF generation for reports

Testing:
  [ ] Write tests for PII detection accuracy
  [ ] Test recommendation generation
  [ ] Verify PDF report rendering
  [ ] Integration tests for full compliance workflow

Deployment:
  [ ] Run database migrations: pnpm db:push
  [ ] Build frontend: pnpm build
  [ ] Deploy to production
  [ ] Verify compliance features are accessible
  [ ] Run first audit: POST /trpc/lgpd.analyzeCompliance
  [ ] Review score and recommendations

Operations:
  [ ] Schedule periodic compliance audits (daily/weekly)
  [ ] Monitor compliance score trends
  [ ] Alert on critical issues
  [ ] Generate monthly compliance reports for stakeholders
  [ ] Track remediation progress
*/
