import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LGPDCompliancePanel } from '@/components/LGPDCompliancePanel';
import { GovernanceRecommendations } from '@/components/GovernanceRecommendations';
import { Shield, AlertCircle, TrendingUp, RefreshCw, Loader, Sun, Moon, Globe, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@shared/i18n/translations';

/**
 * Página dedicada para Compliance LGPD
 * Exibe análise completa, recomendações e status de conformidade
 * Integrada com dados reais do Databricks via tRPC
 * Suporte a i18n (Português e Inglês)
 */
export default function LGPDCompliance() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  const t = getTranslation(language);

  // Extract sessionId from URL if available
  const sessionId = location.split('/').pop();

  // Fetch compliance analysis data from backend
  const analyzeComplianceMutation = trpc.lgpd.analyzeCompliance.useMutation();
  const { data: complianceAnalysis, isPending: isLoadingAnalysis } = analyzeComplianceMutation;
  const recommendationsQuery = trpc.lgpd.generateRecommendations.useQuery(
    { analysis: complianceAnalysis ?? {} },
    { enabled: !!complianceAnalysis },
  );
  const { data: auditSessions = [] } = trpc.databricks.listSessions.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Get stored Databricks config from session or localStorage
  const [databricksConfig, setDatabricksConfig] = useState<{
    host: string;
    token: string;
    catalog: string;
    useVault?: boolean;
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
  const handleAnalyze = () => {
    if (!databricksConfig) {
      alert(t.compliance.configNotFound);
      return;
    }

    analyzeComplianceMutation.mutate({
      databricksHost: databricksConfig.host,
      databricksToken: databricksConfig.token || undefined,
      catalog: databricksConfig.catalog,
      useVault: databricksConfig.useVault,
    });
  };

  useEffect(() => {
    if (databricksConfig && !complianceAnalysis && !isLoadingAnalysis) {
      analyzeComplianceMutation.mutate({
        databricksHost: databricksConfig.host,
        databricksToken: databricksConfig.token || undefined,
        catalog: databricksConfig.catalog,
        useVault: databricksConfig.useVault,
      });
    }
  }, [databricksConfig]);

  // Normaliza LGPDAnalysis (estrutura aninhada do servidor) para estrutura flat usada no template.
  // Sem uma análise executada, não exibe números inventados.
  const complianceData = complianceAnalysis
    ? {
        score: complianceAnalysis.summary.complianceScore,
        riskLevel: complianceAnalysis.summary.riskLevel,
        criticalIssues: complianceAnalysis.summary.criticalIssues,
        piiColumnsUntagged: complianceAnalysis.piiDetection.untaggedPiiRisk,
        retentionPolicies: complianceAnalysis.retention.policies.filter((p) => p.assessment === 'defined').length,
        encryptedTables: complianceAnalysis.encryption.encryptedTables,
        auditLogsEnabled: complianceAnalysis.audit.accessLogsEnabled,
        dsrReadiness: {
          export: complianceAnalysis.dsr.readyForExport,
          delete: complianceAnalysis.dsr.readyForDeletion,
          access: complianceAnalysis.dsr.readyForDSR,
        },
      }
    : null;

  const recommendations = (recommendationsQuery.data ?? []).map((recommendation, index) => ({
    id: `lgpd-${index}`,
    priority: recommendation.priority,
    category: recommendation.priority === 'critical' ? 'pii' as const : 'documentation' as const,
    title: recommendation.action,
    description: recommendation.action,
    impact: language === 'pt' ? 'Recomendação derivada da análise atual do catálogo.' : 'Recommendation derived from the current catalog analysis.',
    estimatedEffort: recommendation.priority === 'critical' ? 'quick' as const : 'medium' as const,
    action: recommendation.action,
  }));

  const scoreHistory = auditSessions
    .filter((session) => session.governanceScore !== null && session.governanceScore !== undefined)
    .slice(0, 4)
    .map((session) => ({
      date: new Date(session.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US'),
      score: Math.round(session.governanceScore ?? 0),
    }));

  const piiData = complianceAnalysis?.piiDetection;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mr-2"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t.compliance.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t.compliance.subtitle}
            </p>
          </div>
        </div>
        <div className="text-right space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              title={`Mudar para tema ${theme === 'dark' ? t.common.lightTheme : t.common.darkTheme}`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  {t.common.lightTheme}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  {t.common.darkTheme}
                </>
              )}
            </Button>
            <div className="flex gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-md">
              <Button
                variant={language === 'pt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('pt')}
                className="text-xs"
              >
                PT
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="text-xs"
              >
                EN
              </Button>
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {complianceData?.score ?? '—'}
              <span className="text-lg text-gray-600">{t.compliance.score}</span>
            </div>
            <div className="text-sm font-semibold text-orange-600">
              {t.compliance.risk.toUpperCase()} {complianceData?.riskLevel ? complianceData.riskLevel.toUpperCase() : 'NÃO ANALISADO'}
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
                {t.compliance.analyzing}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t.compliance.analyzeNow}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Critical Alert */}
      {complianceData && complianceData.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
                            <strong>{complianceData.criticalIssues} {t.compliance.criticalIssues}</strong> {t.compliance.criticalIssuesDesc}

          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t.compliance.tabs.overview}</TabsTrigger>
          <TabsTrigger value="recommendations">
            {t.compliance.tabs.recommendations}
            {recommendations.length > 0 && (
              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {
                  recommendations.filter((r) => r.priority === 'critical')
                    .length
                }
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pii">{t.compliance.tabs.pii}</TabsTrigger>
          <TabsTrigger value="progress">{t.compliance.tabs.progress}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {complianceData ? <LGPDCompliancePanel
            score={complianceData.score}
            riskLevel={complianceData.riskLevel}
            criticalIssues={complianceData.criticalIssues}
            piiColumnsUntagged={complianceData.piiColumnsUntagged}
            retentionPolicies={complianceData.retentionPolicies}
            encryptedTables={complianceData.encryptedTables}
            auditLogsEnabled={complianceData.auditLogsEnabled}
            dsrReadiness={complianceData.dsrReadiness}
            recommendations={recommendations.slice(0, 3)}
            language={language}
          /> : (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {databricksConfig ? t.compliance.analyzeNow : t.compliance.configNotFound}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t.compliance.actionPlan}
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {recommendations.length} {t.compliance.recommendationsCount}
            </p>
            <GovernanceRecommendations
              recommendations={recommendations}
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
              {t.compliance.piiTitle}
            </h2>

            {piiData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 bg-blue-50">
                    <p className="text-sm text-gray-600 mb-1">{t.compliance.totalColumns}</p>
                    <p className="text-3xl font-bold text-blue-600">{piiData.totalColumns}</p>
                  </Card>
                  <Card className="p-4 bg-orange-50">
                    <p className="text-sm text-gray-600 mb-1">{t.compliance.piiIdentified}</p>
                    <p className="text-3xl font-bold text-orange-600">{piiData.piiColumnsIdentified}</p>
                  </Card>
                  <Card className="p-4 bg-red-50">
                    <p className="text-sm text-gray-600 mb-1">{t.compliance.notTagged}</p>
                    <p className="text-3xl font-bold text-red-600">{piiData.untaggedPiiRisk}</p>
                  </Card>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    {t.compliance.categoriesDetected}
                  </h3>
                  {piiData.categories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{cat.name}</p>
                        <p className="text-sm text-gray-600">
                          {cat.tagged}/{cat.count} {t.compliance.tagged}
                        </p>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${cat.count > 0 ? (cat.tagged / cat.count) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {databricksConfig ? t.compliance.analyzeNow : t.compliance.configNotFound}
                </AlertDescription>
              </Alert>
            )}
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t.compliance.scoreHistory}
              </h3>
              <div className="space-y-2">
                {scoreHistory.length > 0 ? scoreHistory.map((entry) => (
                  <div key={`${entry.date}-${entry.score}`} className="flex justify-between items-center">
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
                )) : (
                  <p className="text-sm text-gray-600">{databricksConfig ? t.compliance.analyzeNow : t.compliance.configNotFound}</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {t.compliance.nextSteps}
              </h3>
              <div className="space-y-2">
                {recommendations.length > 0 ? recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <p className="text-sm text-gray-600">{recommendation.action}</p>
                  </div>
                )) : (
                  <p className="text-sm text-gray-600">{databricksConfig ? t.compliance.analyzeNow : t.compliance.configNotFound}</p>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">{t.compliance.goal}</h3>
            <p className="text-sm text-green-800 mb-3">
              {t.compliance.goalDesc}
            </p>
            <div className="w-full bg-green-200 rounded-full h-3">
              <div className="bg-green-600 h-3 rounded-full" style={{ width: `${complianceData?.score ?? 0}%` }} />
            </div>
            <p className="text-xs text-green-700 mt-2">
              {complianceData ? `${complianceData.score}%` : 'N/D'} {language === 'pt' ? 'do caminho' : 'of the way'}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
