import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, Activity, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function SecOpsPanel() {
  const configStr = localStorage.getItem('databricks_config');
  const config = configStr ? JSON.parse(configStr) : null;

  const { data, isLoading, error } = trpc.copilot.checkAnomalies.useQuery(
    { host: config?.host || "", token: config?.token || "", catalog: config?.catalog || "" },
    { enabled: !!config, refetchInterval: 30000 } // Refetch a cada 30s para simular "Real-time"
  );

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !data) {
    return null;
  }

  if (data.anomaliesFound === 0) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="bg-success/20 p-3 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-success">Monitoramento SecOps Ativo</h3>
            <p className="text-sm text-success/80">Nenhuma anomalia de segurança detectada nas últimas 24h no Unity Catalog.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/50 shadow-md">
      <CardHeader className="bg-destructive/5 pb-4 border-b border-destructive/10">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-destructive text-lg">
            <Activity className="h-5 w-5 animate-pulse" />
            Alertas de SecOps em Tempo Real
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            {data.anomaliesFound} Anomalias Detectadas
          </Badge>
        </div>
        <CardDescription className="text-destructive/80">
          O monitoramento contínuo identificou comportamentos de risco nos logs de auditoria do Databricks.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {data.events.map((event, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-lg border bg-background relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive"></div>
            
            <div className="mt-1">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-sm">{event.eventType.replace(/_/g, ' ')}</h4>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
              
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  Usuário: {event.user}
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Bloquear Acesso
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
