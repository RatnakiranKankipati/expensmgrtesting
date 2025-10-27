import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import AddExpense from "@/pages/AddExpense";
import AllExpenses from "@/pages/AllExpenses";
import Categories from "@/pages/Categories";
import ExpenseWalletSetup from "@/pages/ExpenseWalletSetup";
import Settings from "@/pages/Settings";
import UserManagement from "@/pages/UserManagement";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/add-expense" component={() => <ProtectedRoute><AddExpense /></ProtectedRoute>} />
      <Route path="/expenses" component={() => <ProtectedRoute><AllExpenses /></ProtectedRoute>} />
      <Route path="/categories" component={() => <ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/budget" component={() => <ProtectedRoute><ExpenseWalletSetup /></ProtectedRoute>} />
      <Route path="/settings" component={() => <ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/user-management" component={() => <ProtectedRoute requireAdmin><UserManagement /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
