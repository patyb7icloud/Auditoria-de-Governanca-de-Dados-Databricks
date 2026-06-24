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

    // Common
    common: {
      lightTheme: 'Tema Claro',
      darkTheme: 'Tema Escuro',
      language: 'Idioma',
      portuguese: 'Português',
      english: 'English',
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

    // Common
    common: {
      lightTheme: 'Light Theme',
      darkTheme: 'Dark Theme',
      language: 'Language',
      portuguese: 'Português',
      english: 'English',
    },
  },
};

export const getTranslation = (lang: Language) => translations[lang];
