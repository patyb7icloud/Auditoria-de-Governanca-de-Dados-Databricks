import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Shield, Database, Tag, Lock, GitBranch, Eye, BarChart3, ArrowRight, CheckCircle2, Zap, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@shared/i18n/translations";
import { Sun, Moon } from "lucide-react";

function FileText2(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = getTranslation(language);

  const analyses = [
    { icon: Database, label: t.home.analyses.structure, desc: t.home.analyses.structureDesc },
    { icon: FileText2, label: t.home.analyses.glossary, desc: t.home.analyses.glossaryDesc },
    { icon: Tag, label: t.home.analyses.tags, desc: t.home.analyses.tagsDesc },
    { icon: Lock, label: t.home.analyses.access, desc: t.home.analyses.accessDesc },
    { icon: GitBranch, label: t.home.analyses.lineage, desc: t.home.analyses.lineageDesc },
    { icon: Eye, label: t.home.analyses.security, desc: t.home.analyses.securityDesc },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground text-sm">Databricks</span>
              <span className="text-gold text-xs font-medium ml-1.5 tracking-wider uppercase">Governance</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-1 border-l border-border/30 pl-3">
              <button
                onClick={() => setLanguage('pt')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  language === 'pt'
                    ? 'bg-gold text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                PT
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-gold text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
            </div>
            {!loading && (
              isAuthenticated ? (
                <Button asChild size="sm" className="gradient-gold text-white font-semibold">
                  <Link href="/connect">{t.home.startAudit} <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="gradient-gold text-white font-semibold">
                  <a href={getLoginUrl()}>{t.common.login}</a>
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-subtle border border-gold/20 text-gold text-xs font-semibold mb-8 tracking-wide uppercase">
            <Zap className="w-3 h-3" />
            {t.home.heroTag}
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            {t.home.heroTitle}<br />
            <span className="text-gold">{t.home.heroTitleHighlight}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.home.heroDesc}
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button asChild size="lg" className="gradient-gold text-white font-semibold px-8 h-12 rounded-xl shadow-lg hover:shadow-gold/30 transition-shadow">
                <Link href="/connect">{t.home.startAudit} <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="gradient-gold text-white font-semibold px-8 h-12 rounded-xl shadow-lg hover:shadow-gold/30 transition-shadow">
                <a href={getLoginUrl()}>{t.home.beginNow} <ArrowRight className="w-4 h-4 ml-2" /></a>
              </Button>
            )}
            {isAuthenticated && (
              <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl border-border hover:border-gold/40">
                <Link href="/history">{t.home.viewHistory}</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 6 Analyses Grid */}
      <section className="py-20 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-foreground mb-3">
              {language === 'pt' ? 'Seis Análises Estruturadas' : 'Six Structured Analyses'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'pt' ? 'Cobertura completa da governança do seu ambiente Databricks' : 'Complete coverage of your Databricks environment governance'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {analyses.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className="group p-6 rounded-xl bg-card border border-border hover:border-gold/30 transition-all duration-200 hover:shadow-lg hover:shadow-gold/5 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-gold-subtle border border-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">
                    {language === 'pt' ? `Análise ${i + 1}` : `Analysis ${i + 1}`}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-1.5 text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: language === 'pt' ? 'Dashboard Executivo' : 'Executive Dashboard',
                desc: language === 'pt'
                  ? 'Score de governança consolidado com métricas, gaps e recomendações automáticas baseadas em melhores práticas.'
                  : 'Consolidated governance score with metrics, gaps and automatic recommendations based on best practices.',
              },
              {
                icon: CheckCircle2,
                title: language === 'pt' ? 'Melhores Práticas' : 'Best Practices',
                desc: language === 'pt'
                  ? 'Comparação automática com checklist de governança: documentação, classificação, acesso, linhagem e segurança.'
                  : 'Automatic comparison with governance checklist: documentation, classification, access, lineage and security.',
              },
              {
                icon: Shield,
                title: language === 'pt' ? 'Exportação Completa' : 'Complete Export',
                desc: language === 'pt'
                  ? 'Relatório em JSON e CSV com todos os dados das seis análises para apresentação ou integração com outras ferramentas.'
                  : 'Report in JSON and CSV with all data from six analyses for presentation or integration with other tools.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-8 rounded-xl bg-card border border-border">
                <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-3">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          Databricks Governance Tool · Unity Catalog Audit Platform
        </p>
      </footer>
    </div>
  );
}
