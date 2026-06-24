import { invokeLLM } from "./_core/llm";
import { executeStatement, DatabricksConfig } from "./databricks";

export interface CopilotResponse {
  answer: string;
  sqlExecuted?: string;
  data?: any[];
  actionRequired?: boolean;
}

/**
 * Agente conversacional que traduz linguagem natural para consultas de governança no Databricks
 */
export async function askCopilot(
  config: DatabricksConfig,
  question: string
): Promise<CopilotResponse> {
  // 1. LLM decide qual consulta SQL executar baseado na pergunta
  const systemPrompt = `
    Você é o 'Data Steward AI', um assistente especializado em Databricks Unity Catalog.
    O catálogo atual é: '${config.catalog}'.
    
    Tabelas de sistema disponíveis (Information Schema):
    - system.information_schema.tables (table_catalog, table_schema, table_name, table_type, comment)
    - system.information_schema.columns (table_catalog, table_schema, table_name, column_name, data_type, comment)
    - system.information_schema.table_privileges (grantor, grantee, table_schema, table_name, privilege_type)
    - system.information_schema.table_tags (schema_name, table_name, tag_name, tag_value)
    
    Analise a pergunta do usuário e retorne um JSON com a query SQL para responder a pergunta.
    Se a pergunta for sobre criar uma política (ex: mascaramento), retorne a query de criação.
    
    Formato de saída:
    {
      "intent": "read" | "write",
      "sql": "SELECT ... FROM ...",
      "explanation": "Vou buscar os dados na tabela X..."
    }
  `;

  try {
    const llmDecisionStr = await invokeLLM(question, {
      systemPrompt,
      temperature: 0.1
    });

    const decision = JSON.parse(llmDecisionStr);

    // 2. Executar a query (Apenas READ de forma automática por segurança)
    if (decision.intent === "read" && decision.sql) {
      const result = await executeStatement(config, decision.sql);
      
      // 3. LLM formata a resposta final
      const answerPrompt = `
        Pergunta original: ${question}
        Resultado do Databricks: ${JSON.stringify(result.rows.slice(0, 10))}
        Responda à pergunta do usuário de forma natural, clara e profissional.
      `;
      
      const finalAnswer = await invokeLLM(answerPrompt, { temperature: 0.7 });
      
      return {
        answer: finalAnswer,
        sqlExecuted: decision.sql,
        data: result.rows
      };
    } else if (decision.intent === "write") {
      return {
        answer: `Entendi que você quer realizar uma alteração. A query gerada foi:\n\n\`\`\`sql\n${decision.sql}\n\`\`\`\n\nPor questões de segurança (SecOps), por favor revise e confirme a execução.`,
        sqlExecuted: decision.sql,
        actionRequired: true
      };
    }

    return { answer: decision.explanation || "Não consegui formular uma consulta para sua pergunta." };

  } catch (error: any) {
    console.error("Erro no Copilot:", error);
    return { answer: `Desculpe, ocorreu um erro ao processar sua requisição: ${error.message}` };
  }
}

/**
 * Real-time SecOps: Simula a verificação de anomalias recentes nos logs de acesso
 */
export async function checkSecurityAnomalies(config: DatabricksConfig) {
  // Em produção, consultaria system.access.audit filtrando as últimas 24h
  // Procurando por GRANTs excessivos, falhas de permissão repetidas, etc.
  
  return {
    anomaliesFound: 2,
    severity: "High",
    events: [
      {
        timestamp: new Date().toISOString(),
        eventType: "EXCESSIVE_GRANT",
        user: "junior.engineer@company.com",
        description: "GRANT SELECT concedido para o grupo 'users' na tabela 'customers' (contém PII).",
        recommendedAction: "REVOKE SELECT ON TABLE customers FROM users;"
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        eventType: "MULTIPLE_DENIED_ACCESS",
        user: "service.principal.etl",
        description: "50 falhas de acesso negado na tabela 'financial_transactions' nos últimos 60 minutos.",
        recommendedAction: "Revisar as credenciais do Service Principal e conceder permissão se necessário."
      }
    ]
  };
}
