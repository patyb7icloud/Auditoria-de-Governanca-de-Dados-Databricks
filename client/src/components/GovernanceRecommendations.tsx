import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Shield,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Language } from '@shared/i18n/translations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export interface GovernanceRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category:
    | 'pii'
    | 'retention'
    | 'encryption'
    | 'access'
    | 'audit'
    | 'documentation';
  title: string;
  description: string;
  impact: string; // e.g., "Improves compliance score by 15%"
  estimatedEffort: 'quick' | 'medium' | 'complex'; // Effort to implement
  action: string; // Call-to-action
  relatedAssets?: string[]; // Affected tables/schemas
}

export interface RecommendationGroup {
  category: string;
  icon: React.ReactNode;
  recommendations: GovernanceRecommendation[];
  totalImpact: number; // Sum of potential score improvements
}

/**
 * Componente que exibe recomendações de governança
 */
export function GovernanceRecommendations({
  recommendations,
  onImplement,
  language = 'pt',
}: {
  recommendations: GovernanceRecommendation[];
  onImplement?: (rec: GovernanceRecommendation) => void;
  language?: Language;
}) {
  const isEnglish = language === 'en';
  const labels = isEnglish
    ? {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        affectedAssets: 'Affected Assets:',
        impact: 'Impact:',
        quick: 'Quick',
        mediumEffort: 'Medium',
        complex: 'Complex',
        implement: 'Implement',
        none: 'No recommendations at this time. Your environment is well configured!',
        quickWins: 'Quick Wins',
        quickWinsDescription: 'These recommendations can be implemented quickly and will have a significant impact:',
      }
    : {
        critical: 'Críticas',
        high: 'Altas',
        medium: 'Médias',
        low: 'Baixas',
        affectedAssets: 'Ativos Afetados:',
        impact: 'Impacto:',
        quick: 'Rápido',
        mediumEffort: 'Médio',
        complex: 'Complexo',
        implement: 'Implementar',
        none: 'Nenhuma recomendação no momento. Seu ambiente está bem configurado!',
        quickWins: 'Quick Wins',
        quickWinsDescription: 'Essas recomendações podem ser implementadas rapidamente e terão impacto significativo:',
      };

  // Agrupa por prioridade
  const grouped = useMemo(() => {
    const groups: Record<string, GovernanceRecommendation[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };

    recommendations.forEach((rec) => {
      groups[rec.priority].push(rec);
    });

    return groups;
  }, [recommendations]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEffortBadgeColor = (effort: string) => {
    switch (effort) {
      case 'quick':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: labels.critical,
            count: grouped.critical.length,
            color: 'text-red-600',
          },
          {
            label: labels.high,
            count: grouped.high.length,
            color: 'text-orange-600',
          },
          {
            label: labels.medium,
            count: grouped.medium.length,
            color: 'text-yellow-600',
          },
          {
            label: labels.low,
            count: grouped.low.length,
            color: 'text-blue-600',
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.count}
            </div>
            <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Recommendations by Priority */}
      {(['critical', 'high', 'medium', 'low'] as const).map((priority) => {
        if (grouped[priority].length === 0) return null;

        return (
          <div key={priority}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {priority === 'critical' && (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              {priority === 'high' && (
                <Shield className="h-5 w-5 text-orange-600" />
              )}
              {priority === 'medium' && (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              {priority === 'low' && (
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              )}
              {priority === 'critical' && labels.critical}
              {priority === 'high' && labels.high}
              {priority === 'medium' && labels.medium}
              {priority === 'low' && labels.low}
            </h3>

            <div className="space-y-3">
              {grouped[priority].map((rec) => (
                <Card key={rec.id} className={`p-4 border-l-4 ${getPriorityColor(rec.priority)}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {rec.title}
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">
                        {rec.description}
                      </p>

                      {rec.relatedAssets && rec.relatedAssets.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-600 font-semibold mb-1">
                            {labels.affectedAssets}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {rec.relatedAssets.map((asset) => (
                              <Badge key={asset} variant="outline" className="text-xs">
                                {asset}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">
                            {labels.impact}
                          </span>
                          <span className="text-xs text-gray-700">
                            {rec.impact}
                          </span>
                        </div>
                        <Badge className={getEffortBadgeColor(rec.estimatedEffort)}>
                          {rec.estimatedEffort === 'quick' && labels.quick}
                          {rec.estimatedEffort === 'medium' && labels.mediumEffort}
                          {rec.estimatedEffort === 'complex' && labels.complex}
                        </Badge>
                      </div>
                    </div>

                    {onImplement && (
                      <button
                        onClick={() => onImplement(rec)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                      >
                        {labels.implement}
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {recommendations.length === 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {labels.none}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick wins section */}
      {grouped.quick?.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                {labels.quickWins} ({grouped.quick.length})
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                {labels.quickWinsDescription}
              </p>
              <div className="space-y-2">
                {grouped.quick.map((rec) => (
                  <div key={rec.id} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {rec.title}
                      </p>
                      <p className="text-xs text-blue-800">{rec.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * Gera recomendações baseadas em análises
 */
export function generateRecommendations(
  analysisData: {
    piiUntagged: number;
    tagCoverage: number;
    docCoverage: number;
    encryptedTables: number | null;
    totalTables: number;
    auditLogsEnabled: boolean | null;
    retentionPolicies: number;
  },
  language: Language = 'pt',
): GovernanceRecommendation[] {
  const recommendations: GovernanceRecommendation[] = [];
  const isEnglish = language === 'en';

  if (analysisData.piiUntagged > 0) {
    recommendations.push({
      id: 'pii-tagging',
      priority: 'critical',
      category: 'pii',
      title: isEnglish ? 'Tag PII Columns' : 'Etiquetar Colunas PII',
      description: isEnglish
        ? `${analysisData.piiUntagged} columns containing personal data are not tagged.`
        : `${analysisData.piiUntagged} colunas contendo dados pessoais não estão etiquetadas.`,
      impact: isEnglish ? 'Improves compliance score by 20%' : 'Melhora o score de conformidade em 20%',
      estimatedEffort: 'quick',
      action: isEnglish ? 'Apply PII and sensitivity tags to identified columns' : 'Aplicar tags de PII e sensibilidade às colunas identificadas',
    });
  }

  if (analysisData.docCoverage < 60) {
    recommendations.push({
      id: 'documentation-coverage',
      priority: 'high',
      category: 'documentation',
      title: isEnglish ? 'Improve Documentation Coverage' : 'Melhorar Cobertura de Documentação',
      description: isEnglish
        ? `Only ${analysisData.docCoverage}% of tables have a description.`
        : `Apenas ${analysisData.docCoverage}% das tabelas têm descrição.`,
      impact: isEnglish ? 'Improves clarity by 25%' : 'Melhora a clareza em 25%',
      estimatedEffort: 'medium',
      action: isEnglish ? 'Add descriptions to undocumented tables and columns' : 'Adicionar descrições às tabelas e colunas não documentadas',
    });
  }

  if (analysisData.encryptedTables !== null && analysisData.encryptedTables < analysisData.totalTables * 0.5) {
    recommendations.push({
      id: 'encryption-coverage',
      priority: 'high',
      category: 'encryption',
      title: isEnglish ? 'Enable Encryption at Rest' : 'Habilitar Criptografia em Repouso',
      description: isEnglish
        ? `Only ${analysisData.encryptedTables} of ${analysisData.totalTables} tables are encrypted.`
        : `Apenas ${analysisData.encryptedTables} de ${analysisData.totalTables} tabelas estão criptografadas.`,
      impact: isEnglish ? 'Improves security posture by 15%' : 'Melhora a postura de segurança em 15%',
      estimatedEffort: 'complex',
      action: isEnglish ? 'Enable encryption for PII-containing tables' : 'Habilitar criptografia para tabelas que contêm PII',
    });
  }

  if (analysisData.auditLogsEnabled === false) {
    recommendations.push({
      id: 'audit-logs',
      priority: 'critical',
      category: 'audit',
      title: isEnglish ? 'Enable Audit Logging' : 'Habilitar Logs de Auditoria',
      description: isEnglish ? 'Access logs are not being collected.' : 'Os logs de acesso não estão sendo coletados.',
      impact: isEnglish ? 'Improves compliance score by 25%' : 'Melhora o score de conformidade em 25%',
      estimatedEffort: 'quick',
      action: isEnglish ? 'Enable Databricks audit logs in workspace settings' : 'Habilitar logs de auditoria do Databricks nas configurações do workspace',
    });
  }

  if (analysisData.retentionPolicies === 0) {
    recommendations.push({
      id: 'retention-policies',
      priority: 'high',
      category: 'retention',
      title: isEnglish ? 'Define Data Retention Policies' : 'Definir Políticas de Retenção de Dados',
      description: isEnglish
        ? 'No retention policy has been defined for LGPD compliance.'
        : 'Nenhuma política de retenção foi definida para conformidade LGPD.',
      impact: isEnglish ? 'Improves LGPD compliance by 30%' : 'Melhora a conformidade LGPD em 30%',
      estimatedEffort: 'medium',
      action: isEnglish ? 'Create retention policies for customer data' : 'Criar políticas de retenção para dados de clientes',
    });
  }

  return recommendations;
}
