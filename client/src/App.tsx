import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Connect from "./pages/Connect";
import Audit from "./pages/Audit";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import History from "./pages/History";
import Compliance from "./pages/Compliance";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/connect" component={Connect} />
      <Route path="/audit/:sessionId" component={Audit} />
      <Route path="/dashboard/:sessionId" component={Dashboard} />
      <Route path="/compliance/:sessionId?" component={Compliance} />
      <Route path="/report/:sessionId" component={Report} />
      <Route path="/history" component={History} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Load saved theme on app start
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      const root = document.documentElement;
      if (savedTheme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.add("dark");
        root.classList.remove("light");
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" switchable>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
