import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Bot, User, Send, Sparkles, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sqlExecuted?: string;
  actionRequired?: boolean;
}

export function CopilotChat({ host, token, catalog }: { host?: string, token?: string, catalog?: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou seu Data Steward AI. Posso ajudar você a analisar acessos, gerar políticas de mascaramento ou entender a linhagem dos seus dados. O que você gostaria de saber?"
    }
  ]);
  const [input, setInput] = useState("");

  const askMutation = trpc.copilot.ask.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        sqlExecuted: data.sqlExecuted,
        actionRequired: data.actionRequired
      }]);
    },
    onError: (error) => {
      toast.error("Erro ao consultar o Copilot: " + error.message);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua solicitação."
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || askMutation.isPending) return;

    const userMsg = input.trim();
    setInput("");
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: userMsg
    }]);

    if (host && token && catalog) {
      askMutation.mutate({ host, token, catalog, question: userMsg });
      return;
    }

    // Fallback: Recuperar config do localStorage
    const configStr = localStorage.getItem('databricks_config');
    if (!configStr) {
      toast.error("Configuração do Databricks não encontrada. Por favor, reconecte-se.");
      return;
    }

    try {
      const config = JSON.parse(configStr);
      askMutation.mutate({
        host: config.host,
        token: config.token,
        catalog: config.catalog,
        question: userMsg
      });
    } catch (e) {
      toast.error("Erro ao ler configuração do Databricks.");
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-card border rounded-lg overflow-hidden shadow-sm">
      <div className="bg-muted/50 p-3 border-b flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-full">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Data Steward AI</h3>
          <p className="text-xs text-muted-foreground">Seu assistente de governança</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-lg p-3 text-sm",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                
                {msg.sqlExecuted && (
                  <div className="mt-3 bg-background/50 rounded p-2 text-xs font-mono overflow-x-auto border border-border/50">
                    <div className="text-muted-foreground mb-1 flex items-center gap-1">
                      <Bot className="h-3 w-3" /> SQL Executado
                    </div>
                    {msg.sqlExecuted}
                  </div>
                )}

                {msg.actionRequired && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="default" className="w-full gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Aprovar Execução
                    </Button>
                    <Button size="sm" variant="outline" className="w-full gap-1 text-destructive">
                      <XCircle className="h-4 w-4" /> Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {askMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Analisando metadados...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 bg-background border-t">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Quais tabelas não possuem tags LGPD?"
            disabled={askMutation.isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || askMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
