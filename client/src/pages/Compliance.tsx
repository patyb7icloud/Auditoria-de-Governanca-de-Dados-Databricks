import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LGPDCompliancePanel } from '@/components/LGPDCompliancePanel';
import { GovernanceRecommendations } from '@/components/GovernanceRecommendations';
import { Shield, AlertCircle, TrendingUp, RefreshCw, Loader, Sun, Moon } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Página dedicada para Compliance LGPD
 * Exibe análise completa, recomendações e status de conformidade
 * Integrada com dados reais do Databricks via tRPC
 */
export default function LGPDCompliance() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // Extract sessionId from URL if available
  const sessionId = location.split('/').pop();

  // Fetch compliance analysis data from backend
  const analyzeComplianceMutation = trpc.lgpd.analyzeCompliance.useMutation();
  const { data: complianceAnalysis, isLoading: isLoadingAnalysis } = analyzeComplianceMutation;
  
  // Get stored Databricks config from session or localStorage
  const [databricksConfig, setDatabricksConfig] = useState<{
    host: string;
    token: string;
    catalog: string;
  } | null>(null);

  useEffect(() => {
    // Load config from localStorage (would typically come from session)
    const stored = localStorage.getItem('databricks_config');
    if (stored) {
      try {
        setDatabricksConfig(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored config:', e);
      }
    }
  }, []);

  // Trigger analysis on mount or when config changes
  const handleAnalyze = async () => {
    if (!databricksConfig) {
      alert('Configuração do Databricks não encontrada. Configure em Nova Auditoria primeiro.');
      return;
    }
    
    try {
      analyzeComplianceMutation.mutate({
        databricksHost: databricksConfig.host,
        databricksToken: databricksConfig.token,
        catalog: databricksConfig.catalog,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Use real data if available, otherwise mock data for demo
  const complianceData = complianceAnalysis || {
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
  };

  const mockRecommendations = [
    {
      id: 'pii-tagging',
      priority: 'critical' as const,
      category: 'pii' as const,
      title: 'Aplicar Tags PII em 5 Colunas',
      description:
        'Detectadas 5 colunas contendo PII não etiquetadas (email, cpf, data_nascimento).',
      impact: 'Melhora score de compliance em 20%',
      estimatedEffort: 'quick' as const,
      action: 'Abrir wizard de etiquetagem automática',
      relatedAssets: ['customers.email', 'customers.cpf', 'orders.birth_date'],
    },
    {
      id: 'retention-policies',
      priority: 'critical' as const,
      category: 'retention' as const,
      title: 'Definir Políticas de Retenção',
      description:
        'Nenhuma política de retenção foi definida para conformidade LGPD.',
      impact: 'Melhora score de compliance em 25%',
      estimatedEffort: 'medium' as const,
      action: 'Criar políticas de retenção por tabela',
      relatedAssets: [
        'customers',
        'orders',
        'transactions',
        'logs',
      ],
    },
    {
      id: 'audit-logs',
      priority: 'high' as const,
      category: 'audit' as const,
      title: 'Habilitar Logs de Acesso',
      description:
        'Logs de acesso não estão habilitados. Necessários para auditoria LGPD.',
      impact: 'Melhora score de compliance em 15%',
      estimatedEffort: 'quick' as const,
      action: 'Habilitar nas configurações do workspace',
    },
    {
      id: 'encryption',
      priority: 'high' as const,
      category: 'encryption' as const,
      title: 'Habilitar Criptografia em 18 Tabelas',
      description:
        'Apenas 2 de 20 tabelas estão criptografadas. Tabelas com PII devem ser criptografadas.',
      impact: 'Melhora score de compliance em 15%',
      estimatedEffort: 'complex' as const,
      action: 'Configurar criptografia em repouso',
      relatedAssets: ['customers', 'orders', 'payments', 'users'],
    },
    {
      id: 'dsr-workflow',
      priority: 'high' as const,
      category: 'access' as const,
      title: 'Implementar Workflow de DSR',
      description:
        'Direitos do titular dos dados (acesso, exportação, exclusão) não estão automatizados.',
      impact: 'Melhora score de compliance em 20%',
      estimatedEffort: 'complex' as const,
      action: 'Criar workflow de Data Subject Request',
    },
    {
      id: 'documentation',
      priority: 'medium' as const,
      category: 'documentation' as const,
      title: 'Documentar Finalidade de Processamento',
      description:
        'Faltam documentações sobre finalidade, base legal e tempo de retenção para várias tabelas.',
      impact: 'Melhora auditabilidade em 10%',
      estimatedEffort: 'medium' as const,
      action: 'Abrir template de documentação LGPD',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compliance LGPD/GDPR
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Análise de conformidade com Lei Geral de Proteção de Dados
            </p>
          </div>
        </div>
        <div className="text-right space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-center"
            title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Tema Claro
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Tema Escuro
              </>
            )}
          </Button>
          <div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {complianceData.score}
              <span className="text-lg text-gray-600">/100</span>
            </div>
            <div className="text-sm font-semibold text-orange-600">
              RISCO {complianceData.riskLevel ? complianceData.riskLevel.toUpperCase() : 'DESCONHECIDO'}
            </div>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={isLoadingAnalysis}
            className="w-full"
          >
            {isLoadingAnalysis ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Analisar Agora
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Critical Alert */}
      {complianceData.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{complianceData.criticalIssues} problemas críticos</strong> identificados.
            Ação imediata recomendada para manter conformidade LGPD.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recomendações
            {mockRecommendations.length > 0 && (
              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {
                  mockRecommendations.filter((r) => r.priority === 'critical')
                    .length
                }
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pii">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <LGPDCompliancePanel
            score={complianceData.score}
            riskLevel={complianceData.riskLevel}
            criticalIssues={complianceData.criticalIssues}
            piiColumnsUntagged={complianceData.piiColumnsUntagged}
            retentionPolicies={complianceData.retentionPolicies}
            encryptedTables={complianceData.encryptedTables}
            auditLogsEnabled={complianceData.auditLogsEnabled}
            dsrReadiness={complianceData.dsrReadiness}
            recommendations={mockRecommendations.slice(0, 3)}
          />
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Plano de Ação Prioritizado
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {mockRecommendations.length} recomendações baseadas em análise de
              conformidade. Priorize as ações críticas para melhorar rapidamente
              o score de compliance.
            </p>
            <GovernanceRecommendations
              recommendations={mockRecommendations}
              onImplement={(rec) =>
                console.log('Implementando:', rec.title)
              }
            />
          </Card>
        </TabsContent>

        {/* PII Tab */}
        <TabsContent value="pii" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Dados Pessoais Identificáveis (PII)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-blue-50">
                <p className="text-sm text-gray-600 mb-1">Total de Colunas</p>
                <p className="text-3xl font-bold text-blue-600">128</p>
              </Card>
              <Card className="p-4 bg-orange-50">
                <p className="text-sm text-gray-600 mb-1">PII Identificado</p>
                <p className="text-3xl font-bold text-orange-600">18</p>
              </Card>
              <Card className="p-4 bg-red-50">
                <p className="text-sm text-gray-600 mb-1">Não Etiquetado</p>
                <p className="text-3xl font-bold text-red-600">5</p>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                Categorias Detectadas:
              </h3>
              {[
                { name: 'Email', count: 3, tagged: 3 },
                { name: 'CPF', count: 2, tagged: 0 },
                { name: 'Data de Nascimento', count: 4, tagged: 4 },
                { name: 'Telefone', count: 5, tagged: 5 },
                { name: 'Endereço', count: 4, tagged: 1 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-sm text-gray-600">
                      {cat.tagged}/{cat.count} etiquetados
                    </p>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(cat.tagged / cat.count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Histórico de Score
              </h3>
              <div className="space-y-2">
                {[
                  { date: 'Hoje', score: 45 },
                  { date: '-7 dias', score: 40 },
                  { date: '-14 dias', score: 35 },
                  { date: '-30 dias', score: 30 },
                ].map((entry) => (
                  <div key={entry.date} className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{entry.date}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${entry.score}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {entry.score}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Próximos Passos
              </h3>
              <div className="space-y-2">
                {[
                  '1️⃣ Aplicar tags PII (5 min)',
                  '2️⃣ Habilitar audit logs (3 min)',
                  '3️⃣ Definir políticas de retenção (30 min)',
                  '4️⃣ Configurar criptografia (1 hour)',
                  '5️⃣ Implementar workflow DSR (2 hours)',
                ].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <p className="text-sm text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Meta</h3>
            <p className="text-sm text-green-800 mb-3">
              Atingir score de 80/100 em 30 dias para conformidade plena.
            </p>
            <div className="w-full bg-green-200 rounded-full h-3">
              <div className="bg-green-600 h-3 rounded-full" style={{ width: '45%' }} />
            </div>
            <p className="text-xs text-green-700 mt-2">45% do caminho</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
