import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Campus from "./pages/Campus";
import { PurchaseCancelled, PurchaseSuccess } from "./pages/PurchaseStates";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/campus/lecon/:lessonId"} component={Campus} />
      <Route path={"/campus"} component={Campus} />
      <Route path={"/achat/succes"} component={PurchaseSuccess} />
      <Route path={"/achat/annule"} component={PurchaseCancelled} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
