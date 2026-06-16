import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Plus, ArrowRight, Clock, Database,
  TrendingUp, TrendingDown, Minus, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot
} from "recharts";
import { useMemo } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  const s = Math.round(score);
  const color =
    s >= 80 ? "text-success border-success/30 bg-success/10"
    : s >= 60 ? "text-warning border-warning/30 bg-warning/10"
    : s >= 40 ? "text-orange-400 border-orange-400/30 bg-orange-400/10"
    : "text-destructive border-destructive/30 bg-destructive/10";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold font-mono", color)}>
      {s}
    </span>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const score = entry?.value as number;
  const catalog = entry?.payload?.catalog as string;
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl p-4 min-w-[180px]">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-mono text-gold text-xs mb-2">{catalog}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold font-display" style={{ color: scoreColor(score) }}>
          {score}
        </span>
        <span className="text-muted-foreground text-sm">/ 100</span>
      </div>
      <p className="text-xs mt-1" style={{ color: scoreColor(score) }}>
        {score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Regular" : "Crítico"}
      </p>
    </div>
  );
}

// ─── Custom Dot ──────────────────────────────────────────────────────────────

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  const score = payload?.score ?? 0;
  return (
    <circle
      cx={cx} cy={cy} r={5}
      fill={scoreColor(score)}
      stroke="hsl(var(--background))"
      strokeWidth={2}
    />
  );
}

// ─── Score Trend Indicator ────────────────────────────────────────────────────

function TrendIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous == null) return null;
  const delta = current - previous;
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-success text-[10px] font-semibold">
      <TrendingUp className="w-3 h-3" />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-destructive text-[10px] font-semibold">
      <TrendingDown className="w-3 h-3" />{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground text-[10px]">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function History() {
  const { data: sessions, isLoading } = trpc.databricks.listSessions.useQuery();

  // Build chart data — only completed sessions with a score, sorted oldest → newest
  const chartData = useMemo(() => {
    if (!sessions) return [];
    return sessions
      .filter((s) => s.status === "completed" && s.governanceScore != null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((s) => ({
        date: new Date(s.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        score: Math.round(s.governanceScore!),
        catalog: s.targetCatalog,
        id: s.id,
      }));
  }, [sessions]);

  const hasChart = chartData.length >= 2;

  // Latest vs previous score for summary stats
  const latestScore = chartData.length > 0 ? chartData[chartData.length - 1]?.score ?? null : null;
  const prevScore = chartData.length > 1 ? chartData[chartData.length - 2]?.score ?? null : null;
  const avgScore = chartData.length > 0
    ? Math.round(chartData.reduce((acc, d) => acc + d.score, 0) / chartData.length)
    : null;
  const maxScore = chartData.length > 0 ? Math.max(...chartData.map((d) => d.score)) : null;

  return (
    <AppLayout>
      <div className="min-h-screen p-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Histórico de Auditorias</h1>
            <p className="text-muted-foreground mt-1 text-sm">Evolução do score de governança ao longo do tempo</p>
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
          /* Empty state */
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
          <>
            {/* ── Score Evolution Chart ───────────────────────────────────── */}
            {hasChart ? (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg animate-fade-in-up" style={{ animationDelay: "40ms" }}>
                {/* Chart header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-md">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">Evolução do Score de Governança</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{chartData.length} auditorias concluídas</p>
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div className="hidden md:flex items-center gap-6">
                    {latestScore != null && (
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Último Score</p>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-2xl font-bold" style={{ color: scoreColor(latestScore) }}>
                            {latestScore}
                          </span>
                          <TrendIndicator current={latestScore} previous={prevScore} />
                        </div>
                      </div>
                    )}
                    {avgScore != null && (
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Média</p>
                        <span className="font-display text-2xl font-bold text-foreground">{avgScore}</span>
                      </div>
                    )}
                    {maxScore != null && (
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Máximo</p>
                        <span className="font-display text-2xl font-bold text-success">{maxScore}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recharts LineChart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />

                      {/* Reference bands */}
                      <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4}
                        label={{ value: "Excelente", position: "insideTopRight", fill: "#22c55e", fontSize: 10 }} />
                      <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4}
                        label={{ value: "Bom", position: "insideTopRight", fill: "#f59e0b", fontSize: 10 }} />
                      <ReferenceLine y={40} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.4}
                        label={{ value: "Regular", position: "insideTopRight", fill: "#f97316", fontSize: 10 }} />

                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#d4a017"
                        strokeWidth={2.5}
                        dot={<CustomDot />}
                        activeDot={{ r: 7, fill: "#d4a017", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border flex-wrap">
                  {[
                    { color: "#22c55e", label: "Excelente (≥ 80)" },
                    { color: "#f59e0b", label: "Bom (60–79)" },
                    { color: "#f97316", label: "Regular (40–59)" },
                    { color: "#ef4444", label: "Crítico (< 40)" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : sessions.filter((s) => s.status === "completed").length === 1 ? (
              /* Single audit — teaser card */
              <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: "40ms" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-md">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">Evolução do Score</h2>
                    <p className="text-xs text-muted-foreground">O gráfico será exibido após a segunda auditoria concluída</p>
                  </div>
                </div>
                <div className="h-24 flex items-center justify-center rounded-xl bg-muted/30 border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Execute mais uma auditoria para visualizar a tendência</p>
                </div>
              </div>
            ) : null}

            {/* ── Session List ─────────────────────────────────────────────── */}
            <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
              <h2 className="font-display text-lg font-semibold text-foreground px-1">Todas as Auditorias</h2>
              {sessions.map((session, i) => {
                // Find previous completed session score for delta
                const completedBefore = sessions
                  .filter((s) => s.status === "completed" && s.governanceScore != null && new Date(s.createdAt) < new Date(session.createdAt))
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const prevSessionScore = completedBefore[0]?.governanceScore ?? null;

                return (
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
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] flex-shrink-0",
                              session.status === "completed" ? "text-success border-success/30"
                              : session.status === "failed" ? "text-destructive border-destructive/30"
                              : "text-warning border-warning/30"
                            )}
                          >
                            {session.status === "completed" ? "Concluída" : session.status === "failed" ? "Falhou" : "Executando"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="font-mono text-gold/70">{session.targetCatalog}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(session.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            })}
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
                          <div className="flex items-center gap-1.5 justify-center">
                            <ScoreBadge score={session.governanceScore} />
                            {session.status === "completed" && session.governanceScore != null && (
                              <TrendIndicator
                                current={Math.round(session.governanceScore)}
                                previous={prevSessionScore != null ? Math.round(prevSessionScore) : null}
                              />
                            )}
                          </div>
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
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
