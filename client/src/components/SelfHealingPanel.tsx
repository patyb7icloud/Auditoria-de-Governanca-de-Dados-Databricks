import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, CheckCircle2, XCircle, Loader2, Database, ShieldAlert, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface SelfHealingPanelProps {
  schema: string;
  tableName: string;
}

export function SelfHealingPanel({ schema, tableName }: SelfHealingPanelProps) {
  const [analyzed, setAnalyzed] = useState(false);
  
  const configStr = localStorage.getItem('databricks_config');
  const config = configStr ? JSON.parse(configStr) : null;

  const analyzeMutation = trpc.selfHealing.analyzeTable.useMutation({
    onSuccess: () => setAnalyzed(true),
    onError: (e) => toast.error("Erro na análise da IA: " + e.message)
  });

  const applyMutation = trpc.selfHealing.applyFixes.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Sucesso! ${data.executedCommands} comandos de governança aplicados no Databricks.`);
      } else {
        toast.error("Erro ao aplicar correções: " + data.error);
      }
    },
    onError: (e) => toast.error("Erro de conexão: " + e.message)
  });

  const handleAnalyze = () => {
    if (!config) {
      toast.error("Configuração não encontrada");
      return;
    }
    analyzeMutation.mutate({
      host: config.host,
      token: config.token,
      catalog: config.catalog,
      schema,
      tableName
    });
  };

  const handleApply = () => {
    if (!config || !analyzeMutation.data) return;
    
    const sqlCommands = analyzeMutation.data.map(s => s.sqlCommand);
    
    applyMutation.mutate({
      host: config.host,
      token: config.token,
      catalog: config.catalog,
      sqlCommands
    });
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Wand2 className="h-5 w-5" />
              Governança de Auto-Cura (Self-Healing)
            </CardTitle>
            <CardDescription className="mt-1">
              A IA analisa os metadados e amostras de dados para sugerir e aplicar documentação e tags LGPD automaticamente.
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {schema}.{tableName}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {!analyzed && !analyzeMutation.isPending && (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Tabela não documentada detectada</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Deixe nossa IA atuar como seu Data Steward. Ela vai inferir o propósito da tabela e identificar dados sensíveis automaticamente.
            </p>
            <Button onClick={handleAnalyze} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Analisar com IA
            </Button>
          </div>
        )}

        {analyzeMutation.isPending && (
          <div className="text-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground animate-pulse">Lendo metadados e gerando sugestões de governança...</p>
          </div>
        )}

        {analyzed && analyzeMutation.data && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-warning" />
                Diagnóstico da IA
              </h4>
              <p className="text-sm text-muted-foreground">
                {analyzeMutation.data[0]?.reasoning}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Descrição Sugerida</TableHead>
                  <TableHead>Tags Identificadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyzeMutation.data.map((suggestion, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {suggestion.columnName ? (
                        <span className="text-muted-foreground ml-4 pl-2 border-l-2 border-muted">
                          {suggestion.columnName}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" /> {suggestion.tableName}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{suggestion.suggestedDescription}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.suggestedTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {suggestion.suggestedTags.length === 0 && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {analyzed && analyzeMutation.data && (
        <CardFooter className="bg-muted/30 border-t flex justify-between">
          <p className="text-xs text-muted-foreground">
            Revise as sugestões acima. As políticas só serão aplicadas após sua aprovação.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAnalyzed(false)} disabled={applyMutation.isPending}>
              Descartar
            </Button>
            <Button onClick={handleApply} disabled={applyMutation.isPending} className="gap-2">
              {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aplicar no Databricks
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
