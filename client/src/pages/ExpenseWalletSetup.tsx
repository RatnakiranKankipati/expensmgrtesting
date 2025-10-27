import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseWalletSchema, type InsertExpenseWallet, type ExpenseWallet } from "@shared/schema";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Loader2, Target, Edit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function ExpenseWalletSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingWallet, setEditingWallet] = useState<ExpenseWallet | null>(null);

  const currentDate = new Date();
  const form = useForm({
    resolver: zodResolver(insertExpenseWalletSchema),
    defaultValues: {
      amount: "",
      description: "",
      date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
    },
  });

  // Fetch current expense wallet
  const { data: currentWallet, isLoading } = useQuery<ExpenseWallet>({
    queryKey: ["/api/current-expense-wallet"],
  });

  // Fetch all expense wallets for history
  const { data: expenseWallets = [] } = useQuery<ExpenseWallet[]>({
    queryKey: ["/api/expense-wallets"],
  });

  // Add expense wallet balance mutation
  const addBalanceMutation = useMutation({
    mutationFn: async (data: InsertExpenseWallet) => {
      // Always create a new wallet entry to maintain records
      return await apiRequest("POST", "/api/expense-wallets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/current-expense-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/wallet-summary"] });
      
      toast({
        title: "Success!",
        description: "Balance added to expense wallet successfully",
      });
      
      form.reset();
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save expense wallet. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving expense wallet:", error);
    },
  });

  // Update expense wallet mutation
  const updateWalletMutation = useMutation({
    mutationFn: async (data: { id: string; wallet: Partial<InsertExpenseWallet> }) => {
      return await apiRequest("PUT", `/api/expense-wallets/${data.id}`, data.wallet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/current-expense-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/wallet-summary"] });
      
      toast({
        title: "Success!",
        description: "Wallet entry updated successfully",
      });
      
      form.reset();
      setIsEditing(false);
      setEditingWallet(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update wallet entry. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating wallet entry:", error);
    },
  });

  const onSubmit = (values: any) => {
    if (editingWallet) {
      updateWalletMutation.mutate({ id: editingWallet.id, wallet: values });
    } else {
      addBalanceMutation.mutate(values);
    }
  };

  const handleEditWalletEntry = (wallet: ExpenseWallet) => {
    setEditingWallet(wallet);
    form.setValue("amount", String(wallet.amount));
    form.setValue("description", wallet.description || "");
    form.setValue("date", new Date(wallet.date).toISOString().split('T')[0]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingWallet(null);
    form.reset();
  };

  const handleEdit = () => {
    if (currentWallet) {
      form.setValue("amount", String(currentWallet.amount));
      form.setValue("description", currentWallet.description || "");
      form.setValue("date", new Date(currentWallet.date).toISOString().split('T')[0]);
      setIsEditing(true);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="md:hidden" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              
              <div className="md:ml-0 ml-2">
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Expense Wallet</h2>
                <p className="text-muted-foreground">Add balance to your expense wallet</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="p-6 space-y-6">
          {/* Current Expense Wallet Display */}
          {currentWallet && !isEditing && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-primary" />
                    <CardTitle>Total Wallet Balance</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl text-muted-foreground">₹</span>
                    <span className="text-3xl font-bold text-foreground" data-testid="text-current-wallet-amount">
                      {expenseWallets.reduce((total, wallet) => total + parseFloat(wallet.amount), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {currentWallet.description && (
                    <p className="text-muted-foreground" data-testid="text-current-wallet-description">
                      {currentWallet.description}
                    </p>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Total from {expenseWallets.length} balance {expenseWallets.length === 1 ? 'entry' : 'entries'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Balance Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-primary" />
                <CardTitle>{currentWallet ? "Add Balance to Wallet" : "Set Initial Wallet Balance"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {currentWallet 
                    ? "Add funds to your expense wallet. Each addition will be recorded for tracking purposes." 
                    : "Set the initial balance for your expense wallet to get started."
                  }
                </p>
              </div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Amount (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="10000.00"
                              {...field}
                              data-testid="input-wallet-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-wallet-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Initial wallet setup"
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
                              data-testid="input-wallet-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-3">
                      <Button 
                        type="submit" 
                        disabled={addBalanceMutation.isPending || updateWalletMutation.isPending}
                        data-testid="button-save-wallet"
                      >
                        {(addBalanceMutation.isPending || updateWalletMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingWallet ? "Update Entry" : currentWallet ? "Add Balance" : "Set Initial Balance"}
                      </Button>

                      {editingWallet && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                      )}

                    </div>
                  </form>
                </Form>
            </CardContent>
          </Card>

          {/* Balance Additions History */}
          {expenseWallets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Balance Addition History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseWallets
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10) // Show last 10 additions
                    .map((wallet) => (
                      <div
                        key={wallet.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                        data-testid={`item-previous-wallet-${wallet.id}`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg text-muted-foreground">₹</span>
                            <span className="font-medium text-foreground">
                              {parseFloat(wallet.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {wallet.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {wallet.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditWalletEntry(wallet)}
                            data-testid={`button-edit-wallet-${wallet.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {new Date(wallet.date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Added: {new Date(wallet.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}