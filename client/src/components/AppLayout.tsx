import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Database,
  FileText,
  History,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Shield,
  Plug,
  CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { href: "/connect", label: "Nova Auditoria", icon: Plug },
  { href: "/compliance", label: "Compliance LGPD", icon: CheckCircle2 },
  { href: "/history", label: "Histórico", icon: History },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
    onError: () => toast.error("Erro ao sair"),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Databricks Governance</h1>
              <p className="text-xs text-muted-foreground">Unity Catalog Audit Tool</p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-sm">Faça login para acessar a ferramenta de auditoria e governança de dados.</p>
          <Button asChild className="gradient-gold text-white font-semibold px-8 py-2.5 rounded-lg">
            <a href={getLoginUrl()}>Entrar</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-sidebar-border">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shadow-lg group-hover:shadow-gold/30 transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-sidebar-foreground text-sm leading-tight">Databricks</p>
                <p className="text-[10px] text-gold font-medium tracking-wider uppercase">Governance Tool</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">Navegação</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150",
                  active
                    ? "bg-gold-subtle text-gold border border-gold/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "Usuário"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <div className="flex gap-2 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex-1 text-muted-foreground hover:text-foreground h-8 text-xs"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 mr-1.5" /> : <Moon className="w-3.5 h-3.5 mr-1.5" />}
              {theme === "dark" ? "Claro" : "Escuro"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              className="flex-1 text-muted-foreground hover:text-destructive h-8 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
