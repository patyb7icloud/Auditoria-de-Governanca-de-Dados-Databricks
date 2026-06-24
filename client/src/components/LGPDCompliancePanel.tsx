import React from 'react';
import { AlertCircle, CheckCircle, Clock, Lock, FileText, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { Language } from '@shared/i18n/translations';
import { getTranslation } from '@shared/i18n/translations';

interface LGPDCompliancePanelProps {
  score: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  criticalIssues: number;
  piiColumnsUntagged: number;
  retentionPolicies: number;
  encryptedTables: number;
  auditLogsEnabled: boolean;
  dsrReadiness: {
    export: boolean;
    delete: boolean;
    access: boolean;
  };
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium';
    action: string;
  }>;
  language?: Language;
}

export function LGPDCompliancePanel({
  score,
  riskLevel,
  criticalIssues,
  piiColumnsUntagged,
  retentionPolicies,
  encryptedTables,
  auditLogsEnabled,
  dsrReadiness,
  recommendations,
  language = 'pt',
}: LGPDCompliancePanelProps) {
  const t = getTranslation(language);

  // Provide safe defaults for dsrReadiness if undefined
  const safeDsrReadiness = dsrReadiness || {
    export: false,
    delete: false,
    access: false,
  };

  // Provide safe defaults for recommendations if undefined
  const safeRecommendations = recommendations || [];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50';
      case 'high':
        return 'bg-orange-50';
      case 'medium':
        return 'bg-yellow-50';
      case 'low':
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  const dsrLabels = {
    export: language === 'pt' ? 'Direito de Exportação' : 'Right to Export',
    delete: language === 'pt' ? 'Direito de Exclusão' : 'Right to Delete',
    access: language === 'pt' ? 'Direito de Acesso' : 'Right to Access',
  };

  const dsrStatusLabels = {
    implemented: language === 'pt' ? 'Implementado' : 'Implemented',
    notReady: language === 'pt' ? 'Não Pronto' : 'Not Ready',
  };

  const checklistItems = [
    { label: language === 'pt' ? 'Identificação e Etiquetagem de PII' : 'PII Identification & Tagging', done: piiColumnsUntagged === 0 },
    { label: language === 'pt' ? 'Políticas de Retenção de Dados' : 'Data Retention Policies', done: retentionPolicies > 0 },
    { label: language === 'pt' ? 'Criptografia em Repouso' : 'Encryption at Rest', done: encryptedTables > 0 },
    { label: language === 'pt' ? 'Logs de Auditoria Habilitados' : 'Audit Logging Enabled', done: auditLogsEnabled },
    { label: language === 'pt' ? 'Exportação de Dados Pronta (DSR)' : 'Data Export Ready (DSR)', done: safeDsrReadiness.export },
    { label: language === 'pt' ? 'Exclusão de Dados Pronta (DSR)' : 'Data Deletion Ready (DSR)', done: safeDsrReadiness.delete },
    { label: language === 'pt' ? 'Trilha de Auditoria de Controle de Acesso' : 'Access Control Audit Trail', done: safeDsrReadiness.access },
  ];

  return (
    <div className="space-y-6">
      {/* Compliance Score Card */}
      <Card className="p-6 border-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              LGPD/GDPR {language === 'pt' ? 'Score de Conformidade' : 'Compliance Score'}
            </h3>
            <p className="text-sm text-gray-600">
              {language === 'pt' 
                ? 'Maturidade geral de proteção de dados e governança'
                : 'Overall data protection and governance maturity'
              }
            </p>
          </div>
          <div className={`text-center p-4 rounded-lg ${getRiskBgColor(riskLevel)}`}>
            <div className={`text-4xl font-bold ${getRiskColor(riskLevel)}`}>
              {score}
            </div>
            <div className={`text-xs font-semibold uppercase ${getRiskColor(riskLevel)}`}>
              {language === 'pt' ? 'Risco' : 'Risk'} {riskLevel.toUpperCase()}
            </div>
          </div>
        </div>
      </Card>

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalIssues} {language === 'pt' ? 'Problemas Críticos Encontrados' : 'Critical Issues Found'}</strong> — {language === 'pt' ? 'Ação imediata necessária para conformidade LGPD' : 'Immediate action required for LGPD compliance'}.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PII Protection */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{language === 'pt' ? 'Detecção de PII' : 'PII Detection'}</h4>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {piiColumnsUntagged}
              </p>
              <p className="text-xs text-gray-600">{language === 'pt' ? 'Colunas PII sem etiqueta' : 'Untagged PII columns'}</p>
            </div>
            {piiColumnsUntagged > 0 && (
              <Badge variant="destructive" className="w-full justify-center">
                {language === 'pt' ? 'Ação Requerida' : 'Action Required'}
              </Badge>
            )}
          </div>
        </Card>

        {/* Data Retention */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{language === 'pt' ? 'Política de Retenção' : 'Retention Policy'}</h4>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {retentionPolicies}
              </p>
              <p className="text-xs text-gray-600">{language === 'pt' ? 'Políticas definidas' : 'Policies defined'}</p>
            </div>
            {retentionPolicies === 0 && (
              <Badge variant="outline" className="w-full justify-center">
                {language === 'pt' ? 'Não Configurado' : 'Not Configured'}
              </Badge>
            )}
          </div>
        </Card>

        {/* Encryption */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{language === 'pt' ? 'Criptografia' : 'Encryption'}</h4>
            <Lock className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {encryptedTables}
              </p>
              <p className="text-xs text-gray-600">{language === 'pt' ? 'Tabelas criptografadas' : 'Tables encrypted'}</p>
            </div>
            {encryptedTables > 0 && (
              <Badge variant="outline" className="w-full justify-center bg-green-50">
                {language === 'pt' ? 'Habilitado' : 'Enabled'}
              </Badge>
            )}
          </div>
        </Card>

        {/* Audit Logs */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">{language === 'pt' ? 'Logs de Auditoria' : 'Audit Logs'}</h4>
            <FileText className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogsEnabled ? 'ON' : 'OFF'}
              </p>
              <p className="text-xs text-gray-600">{language === 'pt' ? 'Registro de acesso' : 'Access logging'}</p>
            </div>
            <Badge
              variant={auditLogsEnabled ? 'default' : 'outline'}
              className="w-full justify-center"
            >
              {auditLogsEnabled ? (language === 'pt' ? 'Ativo' : 'Active') : (language === 'pt' ? 'Desabilitado' : 'Disabled')}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Data Subject Rights (DSR) */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">
            {language === 'pt' ? 'Prontidão dos Direitos do Titular' : 'Data Subject Rights Readiness'}
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['export', 'delete', 'access'].map((right) => (
            <div
              key={right}
              className={`p-3 rounded-lg border-2 ${
                safeDsrReadiness[right as keyof typeof safeDsrReadiness]
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {safeDsrReadiness[right as keyof typeof safeDsrReadiness] ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {dsrLabels[right as keyof typeof dsrLabels]}
                </p>
              </div>
              <p className="text-xs text-gray-600">
                {safeDsrReadiness[right as keyof typeof safeDsrReadiness]
                  ? dsrStatusLabels.implemented
                  : dsrStatusLabels.notReady}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      {safeRecommendations.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">
            {language === 'pt' ? 'Recomendações de Conformidade' : 'Compliance Recommendations'}
          </h4>
          <div className="space-y-3">
            {safeRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  rec.priority === 'critical'
                    ? 'border-red-500 bg-red-50'
                    : rec.priority === 'high'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Badge
                    className={
                      rec.priority === 'critical'
                        ? 'bg-red-600'
                        : rec.priority === 'high'
                        ? 'bg-orange-600'
                        : 'bg-yellow-600'
                    }
                  >
                    {rec.priority.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-700 flex-1">{rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Compliance Checklist */}
      <Card className="p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {language === 'pt' ? 'Checklist de Conformidade LGPD' : 'LGPD Compliance Checklist'}
        </h4>
        <div className="space-y-2">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2">
              {item.done ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className={item.done ? 'text-gray-900' : 'text-gray-500'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
