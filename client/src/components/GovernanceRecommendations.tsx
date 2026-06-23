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
}: {
  recommendations: GovernanceRecommendation[];
  onImplement?: (rec: GovernanceRecommendation) => void;
}) {
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
            label: 'Críticas',
            count: grouped.critical.length,
            color: 'text-red-600',
          },
          {
            label: 'Altas',
            count: grouped.high.length,
            color: 'text-orange-600',
          },
          {
            label: 'Médias',
            count: grouped.medium.length,
            color: 'text-yellow-600',
          },
          {
            label: 'Baixas',
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
              {priority === 'critical' && 'Críticas'}
              {priority === 'high' && 'Altas'}
              {priority === 'medium' && 'Médias'}
              {priority === 'low' && 'Baixas'}
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
                            Ativos Afetados:
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
                            Impacto:
                          </span>
                          <span className="text-xs text-gray-700">
                            {rec.impact}
                          </span>
                        </div>
                        <Badge className={getEffortBadgeColor(rec.estimatedEffort)}>
                          {rec.estimatedEffort === 'quick' && 'Rápido'}
                          {rec.estimatedEffort === 'medium' && 'Médio'}
                          {rec.estimatedEffort === 'complex' && 'Complexo'}
                        </Badge>
                      </div>
                    </div>

                    {onImplement && (
                      <button
                        onClick={() => onImplement(rec)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                      >
                        Implementar
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
            Nenhuma recomendação no momento. Seu ambiente está bem configurado!
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
                Quick Wins ({grouped.quick.length})
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Essas recomendações podem ser implementadas rapidamente e
                terão impacto significativo:
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
export function generateRecommendations(analysisData: {
  piiUntagged: number;
  tagCoverage: number;
  docCoverage: number;
  encryptedTables: number;
  totalTables: number;
  auditLogsEnabled: boolean;
  retentionPolicies: number;
}): GovernanceRecommendation[] {
  const recommendations: GovernanceRecommendation[] = [];

  // Recomendações de PII
  if (analysisData.piiUntagged > 0) {
    recommendations.push({
      id: 'pii-tagging',
      priority: 'critical',
      category: 'pii',
      title: 'Tag PII Columns',
      description: `${analysisData.piiUntagged} colunas contendo dados pessoais não estão etiquetadas.`,
      impact: 'Improves compliance score by 20%',
      estimatedEffort: 'quick',
      action: 'Apply pii and sensitivity tags to identified columns',
    });
  }

  // Recomendações de cobertura de documentação
  if (analysisData.docCoverage < 60) {
    recommendations.push({
      id: 'documentation-coverage',
      priority: 'high',
      category: 'documentation',
      title: 'Improve Documentation Coverage',
      description: `Apenas ${analysisData.docCoverage}% das tabelas têm descrição.`,
      impact: 'Improves clarity by 25%',
      estimatedEffort: 'medium',
      action: 'Add descriptions to undocumented tables and columns',
    });
  }

  // Recomendações de criptografia
  if (analysisData.encryptedTables < analysisData.totalTables * 0.5) {
    recommendations.push({
      id: 'encryption-coverage',
      priority: 'high',
      category: 'encryption',
      title: 'Enable Encryption at Rest',
      description: `Apenas ${analysisData.encryptedTables} de ${analysisData.totalTables} tabelas estão criptografadas.`,
      impact: 'Improves security posture by 15%',
      estimatedEffort: 'complex',
      action: 'Enable encryption for PII-containing tables',
    });
  }

  // Recomendações de audit
  if (!analysisData.auditLogsEnabled) {
    recommendations.push({
      id: 'audit-logs',
      priority: 'critical',
      category: 'audit',
      title: 'Enable Audit Logging',
      description: 'Access logs are not being collected.',
      impact: 'Improves compliance score by 25%',
      estimatedEffort: 'quick',
      action: 'Enable Databricks audit logs in workspace settings',
    });
  }

  // Recomendações de retenção
  if (analysisData.retentionPolicies === 0) {
    recommendations.push({
      id: 'retention-policies',
      priority: 'high',
      category: 'retention',
      title: 'Define Data Retention Policies',
      description:
        'Nenhuma política de retenção definida para conformidade LGPD.',
      impact: 'Improves LGPD compliance by 30%',
      estimatedEffort: 'medium',
      action: 'Create retention policies for customer data',
    });
  }

  return recommendations;
}
