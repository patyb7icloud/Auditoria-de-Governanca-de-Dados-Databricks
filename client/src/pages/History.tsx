import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, ArrowRight, CheckCircle2, XCircle, Clock, Database } from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  const s = Math.round(score);
  const color = s >= 80 ? "text-success border-success/30 bg-success/10"
    : s >= 60 ? "text-warning border-warning/30 bg-warning/10"
    : s >= 40 ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
    : "text-destructive border-destructive/30 bg-destructive/10";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold font-mono", color)}>
      {s}
    </span>
  );
}

export default function History() {
  const { data: sessions, isLoading } = trpc.databricks.listSessions.useQuery();

  return (
    <AppLayout>
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Histórico de Auditorias</h1>
            <p className="text-muted-foreground mt-1 text-sm">Todas as análises de governança executadas</p>
          </div>
          <Button asChild className="gradient-gold text-white font-semibold h-10">
            <Link href="/connect">
              <Plus className="w-4 h-4 mr-2" />Nova Auditoria
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mb-5 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Nenhuma auditoria encontrada</h2>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Inicie sua primeira auditoria de governança conectando ao seu ambiente Databricks.
            </p>
            <Button asChild className="gradient-gold text-white font-semibold">
              <Link href="/connect">Iniciar Primeira Auditoria</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
            {sessions.map((session, i) => (
              <div
                key={session.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-gold/20 transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold-subtle border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-gold" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-foreground text-sm truncate">{session.databricksHost}</p>
                      <Badge variant="outline" className={cn("text-[10px] flex-shrink-0", session.status === "completed" ? "text-success border-success/30" : session.status === "failed" ? "text-destructive border-destructive/30" : "text-warning border-warning/30")}>
                        {session.status === "completed" ? "Concluída" : session.status === "failed" ? "Falhou" : "Executando"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono text-gold/70">{session.targetCatalog}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {session.totalTables != null && (
                        <>
                          <span>·</span>
                          <span>{session.totalTables} tabelas</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Score</p>
                      <ScoreBadge score={session.governanceScore} />
                    </div>
                    {session.status === "completed" && (
                      <Button asChild size="sm" variant="outline" className="border-border hover:border-gold/40 h-8 text-xs">
                        <Link href={`/dashboard/${session.id}`}>
                          Ver Dashboard <ArrowRight className="w-3 h-3 ml-1.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
