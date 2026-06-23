/**
 * Hook para análise de PII em tempo real
 * Detecta e categoriza colunas contendo dados pessoais identificáveis
 */

import { useMemo } from 'react';

export interface PIIDetectionResult {
  columnName: string;
  category: string;
  confidence: number; // 0-1
  severity: 'critical' | 'high' | 'medium';
  recommendations: string[];
}

interface ColumnInfo {
  name: string;
  type: string;
  description?: string;
  sampleValues?: string[];
}

// Padrões de detecção PII
const PII_PATTERNS = [
  {
    category: 'Email',
    keywords: ['email', 'mail', 'e_mail', 'endereco_email'],
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    severity: 'high' as const,
  },
  {
    category: 'CPF',
    keywords: ['cpf', 'documento', 'numero_documento'],
    regex: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
    severity: 'critical' as const,
  },
  {
    category: 'CNPJ',
    keywords: ['cnpj', 'numero_cnpj'],
    regex: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
    severity: 'critical' as const,
  },
  {
    category: 'Telefone',
    keywords: ['telefone', 'phone', 'celular', 'mobile', 'numero_telefone'],
    regex: /^\(\d{2}\)\s?\d{4,5}-\d{4}$|^\d{10,11}$/,
    severity: 'high' as const,
  },
  {
    category: 'Data de Nascimento',
    keywords: ['data_nascimento', 'birthdate', 'dob', 'nascimento', 'data_nasc'],
    regex: /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/,
    severity: 'high' as const,
  },
  {
    category: 'RG',
    keywords: ['rg', 'registro_geral', 'numero_rg'],
    regex: /^\d{1,2}\.\d{3}\.\d{3}-[\dX]$/,
    severity: 'high' as const,
  },
  {
    category: 'Cartão de Crédito',
    keywords: ['cartao', 'credit_card', 'cc_number', 'card_number'],
    regex: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
    severity: 'critical' as const,
  },
  {
    category: 'Endereço',
    keywords: ['endereco', 'address', 'rua', 'avenida', 'logradouro', 'street'],
    regex: null,
    severity: 'high' as const,
  },
  {
    category: 'Nome',
    keywords: ['nome', 'name', 'nome_completo', 'full_name', 'customer_name'],
    regex: null,
    severity: 'high' as const,
  },
  {
    category: 'Idade',
    keywords: ['idade', 'age', 'anos'],
    regex: /^\d{1,3}$/,
    severity: 'medium' as const,
  },
];

/**
 * Hook para detectar PII em colunas
 */
export function usePIIDetection(columns: ColumnInfo[]) {
  return useMemo(() => {
    const results: PIIDetectionResult[] = [];

    for (const col of columns) {
      const colLower = col.name.toLowerCase();
      const typeUpper = (col.type || '').toUpperCase();

      for (const pattern of PII_PATTERNS) {
        let confidence = 0;

        // Detecção por palavra-chave (50% da confiança)
        const keywordMatch = pattern.keywords.some((kw) =>
          colLower.includes(kw)
        );
        if (keywordMatch) confidence += 0.5;

        // Detecção por tipo de dados (20% da confiança)
        if (
          (pattern.category === 'Email' && typeUpper.includes('VARCHAR')) ||
          (pattern.category === 'Telefone' &&
            (typeUpper.includes('VARCHAR') ||
              typeUpper.includes('BIGINT'))) ||
          (pattern.category === 'Data de Nascimento' &&
            (typeUpper.includes('DATE') ||
              typeUpper.includes('TIMESTAMP')))
        ) {
          confidence += 0.2;
        }

        // Detecção por amostra de dados (30% da confiança)
        if (col.sampleValues && col.sampleValues.length > 0 && pattern.regex) {
          const matches = col.sampleValues.filter((v) =>
            pattern.regex?.test(v.toString())
          ).length;
          if (matches > 0) {
            confidence += 0.3 * (matches / Math.min(3, col.sampleValues.length));
          }
        }

        // Se confiança >= 50%, registrar detecção
        if (confidence >= 0.5) {
          results.push({
            columnName: col.name,
            category: pattern.category,
            confidence: Math.min(1, confidence),
            severity: pattern.severity,
            recommendations: getRecommendations(
              pattern.category,
              pattern.severity
            ),
          });
          break; // Evitar duplicatas
        }
      }
    }

    return results;
  }, [columns]);
}

/**
 * Gera recomendações de proteção baseadas na categoria PII
 */
function getRecommendations(
  category: string,
  severity: 'critical' | 'high' | 'medium'
): string[] {
  const baseRecommendations = [
    'Aplicar tag "pii" à coluna',
    'Revisar quem tem acesso a esta coluna',
  ];

  const categoryRecommendations: Record<string, string[]> = {
    CPF: [
      'Implementar mascaramento (ex: 123.456.789-00)',
      'Considerar criptografia em repouso',
      'Registrar todos os acessos',
    ],
    CNPJ: [
      'Implementar mascaramento',
      'Considerar criptografia em repouso',
    ],
    Email: [
      'Implementar mascaramento (ex: u***@example.com)',
      'Controlar acesso com roles específicos',
    ],
    Telefone: [
      'Implementar mascaramento (ex: 11 99999-****)',
      'Considerar remover após consentimento expirado',
    ],
    'Cartão de Crédito': [
      'Implementar tokenização (nunca armazenar o número completo)',
      'Criptografar em repouso e em trânsito',
      'Auditar todos os acessos',
    ],
    'Data de Nascimento': [
      'Implementar mascaramento de parte da data',
      'Considerar guardar apenas o ano',
    ],
    Endereço: [
      'Implementar pseudonimização',
      'Considerar precisão geográfica reduzida',
    ],
  };

  const specific = categoryRecommendations[category] || [];
  const allRecommendations = [...baseRecommendations, ...specific];

  return allRecommendations.slice(0, 3); // Limitar a 3 recomendações
}

/**
 * Calcula score de proteção PII
 */
export function calculatePIIProtectionScore(
  detected: PIIDetectionResult[],
  protected_: number
): number {
  if (detected.length === 0) return 100;

  const criticalCount = detected.filter((d) => d.severity === 'critical').length;
  const highCount = detected.filter((d) => d.severity === 'high').length;

  const unprotectedCritical = criticalCount - (protected_ > 0 ? 1 : 0);
  const unprotectedHigh = highCount - (protected_ > 1 ? highCount - 1 : 0);

  const penalty = unprotectedCritical * 10 + unprotectedHigh * 5;

  return Math.max(0, 100 - penalty);
}

/**
 * Agrupa detecções por categoria
 */
export function groupPIIByCategory(
  detections: PIIDetectionResult[]
): Record<string, PIIDetectionResult[]> {
  return detections.reduce(
    (acc, detection) => {
      if (!acc[detection.category]) {
        acc[detection.category] = [];
      }
      acc[detection.category].push(detection);
      return acc;
    },
    {} as Record<string, PIIDetectionResult[]>
  );
}

/**
 * Retorna o status de proteção PII
 */
export function getPIIProtectionStatus(
  detections: PIIDetectionResult[],
  tagged: number
): 'safe' | 'warning' | 'critical' {
  if (detections.length === 0) return 'safe';

  const criticalUntagged = detections.filter(
    (d) => d.severity === 'critical' && tagged === 0
  ).length;

  if (criticalUntagged > 0) return 'critical';

  const unprotected = detections.length - tagged;
  if (unprotected / detections.length > 0.5) return 'warning';

  return 'safe';
}
