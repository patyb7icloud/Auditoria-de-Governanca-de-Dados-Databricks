import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  DollarSign, 
  BrainCircuit, 
  TrendingDown, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonitoringPanelProps {
  tenantCatalog: string;
}

export function MonitoringPanel({ tenantCatalog }: MonitoringPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingUpJob, setIsSettingUpJob] = useState(false);

  // Queries
  const { data: metrics, isLoading, refetch } = trpc.monitoring.getWeeklyMetrics.useQuery(
    { tenantCatalog },
    { refetchInterval: 60000 } // Atualiza a cada 1 minuto
  );

  // Mutations
  const generateMetrics = trpc.monitoring.generateWeeklyMetrics.useMutation({
    onSuccess: () => {
      refetch();
      setIsGenerating(false);
    },
    onError: (err) => {
      console.error("Erro ao gerar métricas:", err);
      setIsGenerating(false);
      alert("Erro ao gerar métricas: " + err.message);
    }
  });

  const setupJob = trpc.monitoring.setupWeeklyJob.useMutation({
    onSuccess: () => {
      setIsSettingUpJob(false);
      alert("Job de monitoramento semanal ativado com sucesso!");
    },
    onError: (err) => {
      console.error("Erro ao ativar job:", err);
      setIsSettingUpJob(false);
      alert("Erro ao ativar job: " + err.message);
    }
  });

  const handleGenerateNow = () => {
    setIsGenerating(true);
    generateMetrics.mutate({ tenantCatalog });
  };

  const handleSetupJob = () => {
    setIsSettingUpJob(true);
    setupJob.mutate({ tenantCatalog });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-500" />
            Monitoramento Semanal de IA
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Desempenho e custos do Copiloto de Governança no catálogo <span className="font-mono font-medium">{tenantCatalog}</span>
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSetupJob}
            disabled={isSettingUpJob}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Clock className="w-4 h-4" />
            {isSettingUpJob ? "Ativando..." : "Ativar Job Semanal"}
          </button>
          
          <button
            onClick={handleGenerateNow}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? "Processando..." : "Gerar Relatório Agora"}
          </button>
        </div>
      </div>

      {!metrics ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <BrainCircuit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum relatório semanal gerado ainda</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            O job de monitoramento roda automaticamente toda segunda-feira. Você pode gerar o primeiro relatório agora mesmo clicando no botão acima.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
            <span>Relatório referente à semana de: <strong className="text-gray-900 dark:text-gray-200">{format(new Date(metrics.weekStartDate), "dd 'de' MMMM", { locale: ptBR })}</strong> a <strong className="text-gray-900 dark:text-gray-200">{format(new Date(metrics.weekEndDate), "dd 'de' MMMM", { locale: ptBR })}</strong></span>
            <span>Gerado em: {format(new Date(metrics.createdAt), "dd/MM/yyyy HH:mm")}</span>
          </div>

          {/* Alertas e Anomalias */}
          {metrics.anomaliesJson && (metrics.anomaliesJson as any[]).length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Alertas da Semana
              </h3>
              <ul className="space-y-2">
                {(metrics.anomaliesJson as any[]).map((anomaly, idx) => (
                  <li key={idx} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{anomaly.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
                <BrainCircuit className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Perguntas Feitas</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.totalQuestions}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
                <DollarSign className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium">Custo Real (USD)</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${metrics.totalCostUSD.toFixed(4)}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">Taxa de Reutilização</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Respondidas sem custo de IA
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
                <TrendingDown className="w-5 h-5 text-brand-500" />
                <span className="text-sm font-medium">Economia Gerada</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${metrics.totalSavedUSD.toFixed(4)}
              </div>
              <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                Poupados pelo Knowledge Base
              </p>
            </div>
          </div>

          {/* Top Perguntas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Perguntas Mais Frequentes</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.topQuestionsJson && (metrics.topQuestionsJson as any[]).length > 0 ? (
                (metrics.topQuestionsJson as any[]).map((q, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Feita {q.hits} vezes na semana</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Economizou ${q.saved}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma pergunta registrada nesta semana.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
