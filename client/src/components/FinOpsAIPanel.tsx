import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, DollarSign, Database, TrendingDown, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function FinOpsAIPanel() {
  // Em um cenário real, isso viria de uma chamada tRPC para buscar as métricas do banco de dados (aiCostSavingsLog)
  // Aqui estamos usando dados simulados para demonstrar a interface
  const mockMetrics = {
    totalSavedUSD: 145.20,
    totalLLMCallsAvoided: 850,
    knowledgeBaseSize: 342,
    cacheHitRate: "68%",
    topQueries: [
      { q: "Quais tabelas contêm dados sensíveis?", hits: 45, saved: 0.43 },
      { q: "Mostre a linhagem da tabela clientes", hits: 28, saved: 0.27 },
      { q: "Quem tem acesso ao catálogo financeiro?", hits: 15, saved: 0.14 }
    ]
  };

  return (
    <Card className="col-span-full mb-6 border-green-900/30 bg-green-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <BrainCircuit className="h-5 w-5" />
              FinOps de IA & Knowledge Base
            </CardTitle>
            <CardDescription>
              Economia gerada pela reutilização de respostas do Copiloto e Self-Healing
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">
              ${mockMetrics.totalSavedUSD.toFixed(2)}
            </div>
            <div className="text-sm text-green-500/70">Economia Total (Este Mês)</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
            <Database className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold">{mockMetrics.knowledgeBaseSize}</div>
              <div className="text-xs text-muted-foreground">Perguntas Aprendidas</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
            <RefreshCcw className="h-8 w-8 text-purple-400" />
            <div>
              <div className="text-2xl font-bold">{mockMetrics.totalLLMCallsAvoided}</div>
              <div className="text-xs text-muted-foreground">Chamadas LLM Evitadas</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border">
            <TrendingDown className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold">{mockMetrics.cacheHitRate}</div>
              <div className="text-xs text-muted-foreground">Taxa de Reutilização (Hit Rate)</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Perguntas Mais Reutilizadas (Top Cache Hits)</h4>
          <div className="space-y-2">
            {mockMetrics.topQueries.map((query, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                <span className="font-medium">"{query.q}"</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{query.hits} reutilizações</span>
                  <span className="text-green-400 font-medium">+${query.saved.toFixed(2)} salvos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
