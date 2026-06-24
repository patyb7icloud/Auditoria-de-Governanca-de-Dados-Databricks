/**
 * Sistema de Internacionalização (i18n)
 * Traduções centralizadas para toda a aplicação
 */

export type Language = 'pt' | 'en';

export const translations = {
  pt: {
    // Compliance Page
    compliance: {
      title: 'Compliance LGPD/GDPR',
      subtitle: 'Análise de conformidade com Lei Geral de Proteção de Dados',
      score: '/100',
      risk: 'Risco',
      analyzeNow: 'Analisar Agora',
      analyzing: 'Analisando...',
      criticalIssues: 'problemas críticos',
      criticalIssuesDesc: 'identificados. Ação imediata recomendada para manter conformidade LGPD.',
      configNotFound: 'Configuração do Databricks não encontrada. Configure em Nova Auditoria primeiro.',
      
      // Tabs
      tabs: {
        overview: 'Visão Geral',
        recommendations: 'Recomendações',
        pii: 'Dados Pessoais',
        progress: 'Progresso',
      },

      // Recommendations
      actionPlan: 'Plano de Ação Prioritizado',
      recommendationsCount: 'recomendações baseadas em análise de conformidade. Priorize as ações críticas para melhorar rapidamente o score de compliance.',

      // PII Tab
      piiTitle: 'Dados Pessoais Identificáveis (PII)',
      totalColumns: 'Total de Colunas',
      piiIdentified: 'PII Identificado',
      notTagged: 'Não Etiquetado',
      categoriesDetected: 'Categorias Detectadas:',
      tagged: 'etiquetados',
      
      piiCategories: {
        email: 'Email',
        cpf: 'CPF',
        birthDate: 'Data de Nascimento',
        phone: 'Telefone',
        address: 'Endereço',
      },

      // Progress Tab
      scoreHistory: 'Histórico de Score',
      today: 'Hoje',
      daysAgo: (days: number) => `${days > 1 ? `-${days} dias` : '-7 dias'}`,
      nextSteps: 'Próximos Passos',
      goal: 'Meta',
      goalDesc: 'Atingir 90+ pontos para garantir conformidade LGPD completa.',

      steps: [
        'Aplicar tags PII (5 min)',
        'Habilitar audit logs (3 min)',
        'Definir políticas de retenção (30 min)',
        'Configurar criptografia (1 hour)',
        'Implementar workflow DSR (2 hours)',
      ],
    },

    // Recommendations component
    recommendations: {
      piiTagging: 'Aplicar Tags PII em 5 Colunas',
      piiDescription: 'Detectadas 5 colunas contendo PII não etiquetadas (email, cpf, data_nascimento).',
      piiImpact: 'Melhora score de compliance em 20%',
      piiAction: 'Abrir wizard de etiquetagem automática',

      retentionPolicies: 'Definir Políticas de Retenção',
      retentionDescription: 'Nenhuma política de retenção foi definida para conformidade LGPD.',
      retentionImpact: 'Melhora score de compliance em 25%',
      retentionAction: 'Criar políticas de retenção por tabela',

      auditLogs: 'Habilitar Logs de Acesso',
      auditDescription: 'Logs de acesso não estão habilitados. Necessários para auditoria LGPD.',
      auditImpact: 'Melhora score de compliance em 15%',
      auditAction: 'Habilitar nas configurações do workspace',

      encryption: 'Habilitar Criptografia em 18 Tabelas',
      encryptionDescription: 'Apenas 2 de 20 tabelas estão criptografadas. Tabelas com PII devem ser criptografadas.',
      encryptionImpact: 'Melhora score de compliance em 15%',
      encryptionAction: 'Configurar criptografia em repouso',

      dsrWorkflow: 'Implementar Workflow de DSR',
      dsrDescription: 'Direitos do titular dos dados (acesso, exportação, exclusão) não estão automatizados.',
      dsrImpact: 'Melhora score de compliance em 20%',
      dsrAction: 'Criar workflow de Data Subject Request',

      documentation: 'Documentar Finalidade de Processamento',
      docDescription: 'Faltam documentações sobre finalidade, base legal e tempo de retenção para várias tabelas.',
      docImpact: 'Melhora auditabilidade em 10%',
      docAction: 'Abrir template de documentação LGPD',
    },

    // Home Page
    home: {
      heroTag: 'Unity Catalog · Databricks',
      heroTitle: 'Auditoria de Governança',
      heroTitleHighlight: 'de Dados Databricks',
      heroDesc: 'Ferramenta profissional para levantamento, mapeamento e análise de governança no Unity Catalog. Execute seis análises estruturadas e obtenha um score executivo de maturidade.',
      startAudit: 'Iniciar Nova Auditoria',
      viewHistory: 'Ver Histórico',
      beginNow: 'Começar Agora',

      analyses: {
        structure: 'Mapeamento de Estrutura',
        structureDesc: 'Catálogos, schemas e tabelas/views',
        glossary: 'Glossário de Dados',
        glossaryDesc: 'Comentários e cobertura de documentação',
        tags: 'Classificação por Tags',
        tagsDesc: 'PII, LGPD, confidencial e domínios',
        access: 'Políticas de Acesso',
        accessDesc: 'Grants por grantor, grantee e privilégio',
        lineage: 'Linhagem de Dados',
        lineageDesc: 'Origem e destino entre tabelas',
        security: 'Segurança Dinâmica',
        securityDesc: 'Row/Column Level Security e mascaramento',
      },
    },

    // Dashboard Page
    dashboard: {
      auditTitle: 'Auditoria',
      executiveTitle: 'Dashboard Executivo',
      loadingResults: 'Carregando resultados...',
      sessionNotFound: 'Sessão não encontrada',
      completed: 'Concluída',
      withErrors: 'Com erros',
      catalog: 'Catálogo',
      exportReport: 'Exportar Relatório',
      downloadPdf: 'Baixar PDF',
      score: 'Pontuação',
      excellent: 'Excelente',
      good: 'Bom',
      fair: 'Regular',
      critical: 'Crítico',
      
      // Score tabs
      scoreDetail: 'Detalhe do Score',
      analysisResults: 'Resultados das Análises',
      recommendations: 'Recomendações',
      gaps: 'Lacunas Identificadas',
      viewFullReport: 'Ver Relatório Completo',

      // Analysis types
      structureAnalysis: 'Mapeamento de Estrutura',
      glossaryAnalysis: 'Glossário de Dados',
      tagsAnalysis: 'Classificação por Tags',
      accessAnalysis: 'Políticas de Acesso',
      lineageAnalysis: 'Linhagem de Dados',
      securityAnalysis: 'Segurança Dinâmica',
    },

    // Connect Page
    connect: {
      title: 'Conectar ao Databricks',
      subtitle: 'Configure sua conexão para executar a auditoria',
      hostLabel: 'Host Databricks',
      hostPlaceholder: 'https://dbc-xxxxx.cloud.databricks.com',
      tokenLabel: 'Token de Autenticação',
      tokenPlaceholder: 'dapi...',
      catalogLabel: 'Catálogo Alvo',
      catalogPlaceholder: 'Nome do catálogo',
      testConnection: 'Testar Conexão',
      startAudit: 'Iniciar Auditoria',
      testing: 'Testando...',
      connectionEstablished: 'Conexão estabelecida com sucesso!',
      connectionFailed: 'Falha na conexão',
      connectionSuccess: 'Conexão testada com sucesso',
      fillAllFields: 'Preencha todos os campos antes de testar a conexão',
      testBeforeStart: 'Teste a conexão antes de iniciar a auditoria',
      auditStarting: 'Auditoria iniciada com sucesso!',
      auditError: 'Erro ao executar auditoria',
      connectionError: 'Erro ao testar conexão',

      // Security note
      securityNote: 'Sua segurança é nossa prioridade',
      securityDesc: 'As credenciais são transmitidas de forma segura e nunca são armazenadas no navegador.',

      // Steps
      stepsTitle: 'Como funciona',
      step1: 'Conecte seu workspace Databricks',
      step2: 'Teste a conexão',
      step3: 'Inicie a auditoria',
      step4: 'Veja os resultados',
    },

    // History Page
    history: {
      title: 'Histórico de Auditorias',
      subtitle: 'Acompanhe todas as auditorias executadas',
      noAudits: 'Nenhuma auditoria encontrada',
      startFirst: 'Comece uma nova auditoria para ver o histórico',
      newAudit: 'Nova Auditoria',
      
      // Table headers
      id: 'ID',
      catalog: 'Catálogo',
      host: 'Host',
      date: 'Data',
      score: 'Score',
      status: 'Status',
      actions: 'Ações',
      
      // Table content
      excellent: 'Excelente',
      good: 'Bom',
      fair: 'Regular',
      critical: 'Crítico',
      completed: 'Concluída',
      error: 'Erro',
      
      // Buttons
      view: 'Visualizar',
      delete: 'Excluir',
      compare: 'Comparar',
      
      // Comparison
      compareTitle: 'Comparar Auditorias',
      selectTwo: 'Selecione duas auditorias para comparar',
      comparison: 'Comparação',
    },

    // Common
    common: {
      lightTheme: 'Tema Claro',
      darkTheme: 'Tema Escuro',
      language: 'Idioma',
      portuguese: 'Português',
      english: 'English',
      login: 'Entrar',
      logout: 'Sair',
      close: 'Fechar',
      error: 'Erro',
      success: 'Sucesso',
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      goHome: 'Ir para Home',
      daysAgo: (days: number) => `${days} dias atrás`,
    },
  },

  en: {
    // Compliance Page
    compliance: {
      title: 'LGPD/GDPR Compliance',
      subtitle: 'Compliance analysis with General Data Protection Law',
      score: '/100',
      risk: 'Risk',
      analyzeNow: 'Analyze Now',
      analyzing: 'Analyzing...',
      criticalIssues: 'critical issues',
      criticalIssuesDesc: 'identified. Immediate action recommended to maintain LGPD compliance.',
      configNotFound: 'Databricks configuration not found. Configure in New Audit first.',
      
      // Tabs
      tabs: {
        overview: 'Overview',
        recommendations: 'Recommendations',
        pii: 'Personal Data',
        progress: 'Progress',
      },

      // Recommendations
      actionPlan: 'Prioritized Action Plan',
      recommendationsCount: 'recommendations based on compliance analysis. Prioritize critical actions to quickly improve your compliance score.',

      // PII Tab
      piiTitle: 'Personally Identifiable Information (PII)',
      totalColumns: 'Total Columns',
      piiIdentified: 'PII Identified',
      notTagged: 'Not Tagged',
      categoriesDetected: 'Detected Categories:',
      tagged: 'tagged',

      piiCategories: {
        email: 'Email',
        cpf: 'CPF',
        birthDate: 'Birth Date',
        phone: 'Phone',
        address: 'Address',
      },

      // Progress Tab
      scoreHistory: 'Score History',
      today: 'Today',
      daysAgo: (days: number) => `${days > 1 ? `-${days} days` : '-7 days'}`,
      nextSteps: 'Next Steps',
      goal: 'Goal',
      goalDesc: 'Reach 90+ points to ensure complete LGPD compliance.',

      steps: [
        'Apply PII tags (5 min)',
        'Enable audit logs (3 min)',
        'Define retention policies (30 min)',
        'Configure encryption (1 hour)',
        'Implement DSR workflow (2 hours)',
      ],
    },

    // Recommendations component
    recommendations: {
      piiTagging: 'Apply PII Tags to 5 Columns',
      piiDescription: 'Detected 5 columns containing untagged PII (email, cpf, birth_date).',
      piiImpact: 'Improves compliance score by 20%',
      piiAction: 'Open automatic tagging wizard',

      retentionPolicies: 'Define Retention Policies',
      retentionDescription: 'No retention policies have been defined for LGPD compliance.',
      retentionImpact: 'Improves compliance score by 25%',
      retentionAction: 'Create retention policies per table',

      auditLogs: 'Enable Access Logs',
      auditDescription: 'Access logs are not enabled. Required for LGPD audit.',
      auditImpact: 'Improves compliance score by 15%',
      auditAction: 'Enable in workspace settings',

      encryption: 'Enable Encryption on 18 Tables',
      encryptionDescription: 'Only 2 of 20 tables are encrypted. Tables with PII should be encrypted.',
      encryptionImpact: 'Improves compliance score by 15%',
      encryptionAction: 'Configure encryption at rest',

      dsrWorkflow: 'Implement DSR Workflow',
      dsrDescription: 'Data subject rights (access, export, deletion) are not automated.',
      dsrImpact: 'Improves compliance score by 20%',
      dsrAction: 'Create Data Subject Request workflow',

      documentation: 'Document Processing Purpose',
      docDescription: 'Missing documentation about purpose, legal basis and retention time for several tables.',
      docImpact: 'Improves auditability by 10%',
      docAction: 'Open LGPD documentation template',
    },

    // Home Page
    home: {
      heroTag: 'Unity Catalog · Databricks',
      heroTitle: 'Governance Audit',
      heroTitleHighlight: 'for Databricks Data',
      heroDesc: 'Professional tool for surveying, mapping and analyzing governance in the Unity Catalog. Run six structured analyses and get an executive maturity score.',
      startAudit: 'Start New Audit',
      viewHistory: 'View History',
      beginNow: 'Get Started',

      analyses: {
        structure: 'Structure Mapping',
        structureDesc: 'Catalogs, schemas and tables/views',
        glossary: 'Data Glossary',
        glossaryDesc: 'Comments and documentation coverage',
        tags: 'Classification by Tags',
        tagsDesc: 'PII, LGPD, confidential and domains',
        access: 'Access Policies',
        accessDesc: 'Grants by grantor, grantee and privilege',
        lineage: 'Data Lineage',
        lineageDesc: 'Source and destination between tables',
        security: 'Dynamic Security',
        securityDesc: 'Row/Column Level Security and masking',
      },
    },

    // Dashboard Page
    dashboard: {
      auditTitle: 'Audit',
      executiveTitle: 'Executive Dashboard',
      loadingResults: 'Loading results...',
      sessionNotFound: 'Session not found',
      completed: 'Completed',
      withErrors: 'With errors',
      catalog: 'Catalog',
      exportReport: 'Export Report',
      downloadPdf: 'Download PDF',
      score: 'Score',
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      critical: 'Critical',
      
      // Score tabs
      scoreDetail: 'Score Detail',
      analysisResults: 'Analysis Results',
      recommendations: 'Recommendations',
      gaps: 'Identified Gaps',
      viewFullReport: 'View Full Report',

      // Analysis types
      structureAnalysis: 'Structure Mapping',
      glossaryAnalysis: 'Data Glossary',
      tagsAnalysis: 'Classification by Tags',
      accessAnalysis: 'Access Policies',
      lineageAnalysis: 'Data Lineage',
      securityAnalysis: 'Dynamic Security',
    },

    // Connect Page
    connect: {
      title: 'Connect to Databricks',
      subtitle: 'Configure your connection to run the audit',
      hostLabel: 'Databricks Host',
      hostPlaceholder: 'https://dbc-xxxxx.cloud.databricks.com',
      tokenLabel: 'Authentication Token',
      tokenPlaceholder: 'dapi...',
      catalogLabel: 'Target Catalog',
      catalogPlaceholder: 'Catalog name',
      testConnection: 'Test Connection',
      startAudit: 'Start Audit',
      testing: 'Testing...',
      connectionEstablished: 'Connection established successfully!',
      connectionFailed: 'Connection failed',
      connectionSuccess: 'Connection tested successfully',
      fillAllFields: 'Fill all fields before testing the connection',
      testBeforeStart: 'Test the connection before starting the audit',
      auditStarting: 'Audit started successfully!',
      auditError: 'Error starting audit',
      connectionError: 'Error testing connection',

      // Security note
      securityNote: 'Your security is our priority',
      securityDesc: 'Credentials are transmitted securely and never stored in the browser.',

      // Steps
      stepsTitle: 'How it works',
      step1: 'Connect your Databricks workspace',
      step2: 'Test the connection',
      step3: 'Start the audit',
      step4: 'View the results',
    },

    // History Page
    history: {
      title: 'Audit History',
      subtitle: 'Track all audits executed',
      noAudits: 'No audits found',
      startFirst: 'Start a new audit to see the history',
      newAudit: 'New Audit',
      
      // Table headers
      id: 'ID',
      catalog: 'Catalog',
      host: 'Host',
      date: 'Date',
      score: 'Score',
      status: 'Status',
      actions: 'Actions',
      
      // Table content
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      critical: 'Critical',
      completed: 'Completed',
      error: 'Error',
      
      // Buttons
      view: 'View',
      delete: 'Delete',
      compare: 'Compare',
      
      // Comparison
      compareTitle: 'Compare Audits',
      selectTwo: 'Select two audits to compare',
      comparison: 'Comparison',
    },

    // Common
    common: {
      lightTheme: 'Light Theme',
      darkTheme: 'Dark Theme',
      language: 'Language',
      portuguese: 'Português',
      english: 'English',
      login: 'Login',
      logout: 'Logout',
      close: 'Close',
      error: 'Error',
      success: 'Success',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      goHome: 'Go Home',
      daysAgo: (days: number) => `${days} days ago`,
    },
  },
};

export const getTranslation = (lang: Language) => translations[lang];
