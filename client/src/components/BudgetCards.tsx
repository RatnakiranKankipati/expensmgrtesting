import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { MONTHS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface BudgetCardsProps {
  month: number;
  year: number;
}

export default function BudgetCards({ month, year }: BudgetCardsProps) {
  const { data: budgetSummary, isLoading } = useQuery({
    queryKey: ["/api/analytics/budget-summary", month, year],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/budget-summary/${month}/${year}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      console.log(response);
      return response.json();
    },
    staleTime: 0,   // immediately stale
  refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="w-20 h-5 bg-muted rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-muted rounded" />
                <div className="w-32 h-8 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!budgetSummary) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Failed to load expense summary</div>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Wallet Balance",
      value: formatCurrency(budgetSummary.walletAmount),
      icon: Wallet,
      color: "bg-primary/10 text-primary",
      badge: "TOTAL RECHARGED",
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(budgetSummary.totalExpenses),
      icon: TrendingUp,
      color: "bg-destructive/10 text-destructive",
      badge: `${MONTHS[month - 1].substring(0, 3).toUpperCase()} ${year}`,
    },
    {
      title: "Available Balance",
      value: formatCurrency(budgetSummary.remainingAmount),
      icon: TrendingDown,
      color: budgetSummary.remainingAmount < 0 ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-600",
      badge: "REMAINING",
    },
    {
      title: "Monthly Transactions",
      value: budgetSummary.expenseCount.toString(),
      icon: Receipt,
      color: "bg-accent text-muted-foreground",
      badge: `${MONTHS[month - 1].substring(0, 3).toUpperCase()}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-1 rounded-full">
                  {card.badge}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{card.title}</h3>
                <p className="text-3xl font-bold text-foreground" data-testid={`text-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
