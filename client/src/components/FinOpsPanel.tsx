import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, Database, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function FinOpsPanel() {
  // Simulando a leitura do config do localStorage
  const configStr = localStorage.getItem('databricks_config');
  const config = configStr ? JSON.parse(configStr) : null;

  const { data, isLoading, error } = trpc.finops.analyzeROI.useQuery(
    { host: config?.host || "", token: config?.token || "", catalog: config?.catalog || "" },
    { enabled: !!config }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-muted-foreground">Não foi possível carregar a análise de FinOps.</p>
        </CardContent>
      </Card>
    );
  }

  const getRoiBadge = (score: string) => {
    switch (score) {
      case "High": return <Badge className="bg-success text-success-foreground">Alto Retorno</Badge>;
      case "Medium": return <Badge variant="secondary">Retorno Médio</Badge>;
      case "Low": return <Badge variant="outline" className="text-warning border-warning">Baixo Retorno</Badge>;
      case "Negative": return <Badge variant="destructive">Custo Ineficiente</Badge>;
      default: return <Badge>{score}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Mensal Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.summary.totalEstimatedMonthlyCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Compute + Storage</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Economia Potencial</CardTitle>
            <TrendingDown className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${data.summary.potentialSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Arquivando {data.summary.negativeRoiTables} tabelas inativas</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Data ROI</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Otimização Ativa</div>
            <p className="text-xs text-primary/80 mt-1">Integração com Unity Catalog Billing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Custo por Tabela</CardTitle>
          <CardDescription>Identifique gargalos financeiros e tabelas subutilizadas que geram custo de storage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead className="text-right">Consultas (30d)</TableHead>
                <TableHead className="text-right">Custo Mensal</TableHead>
                <TableHead>ROI Score</TableHead>
                <TableHead>Recomendação da IA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.tables.slice(0, 10).map((table, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    {table.tableName}
                  </TableCell>
                  <TableCell className="text-right">{table.queryCount30Days}</TableCell>
                  <TableCell className="text-right font-mono">
                    ${(table.estimatedComputeCostUSD + table.estimatedStorageCostUSD).toFixed(2)}
                  </TableCell>
                  <TableCell>{getRoiBadge(table.roiScore)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{table.recommendation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
