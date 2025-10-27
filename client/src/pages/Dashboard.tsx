import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import BudgetCards from "@/components/BudgetCards";
import ExpenseCharts from "@/components/ExpenseCharts";
import ExpenseTable from "@/components/ExpenseTable";
import MonthYearSelector from "@/components/MonthYearSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus, Download, Tags, Bell, User, Calendar } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  console.log("hello")
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // // Fetch budget summary for progress display
  // const { data: budgetSummary } = useQuery({
  //   queryKey: ["/api/analytics/budget-summary", selectedMonth, selectedYear],
  //   queryFn: async () => {
  //     const response = await fetch(`/api/analytics/budget-summary/${selectedMonth}/${selectedYear}`, {
  //       credentials: "include",
  //     });
      
  //     if (!response.ok) {
  //       throw new Error(`${response.status}: ${response.statusText}`);
  //     }
      
  //     return response.json();
  //   },
  // });

  // console.log(budgetSummary)

const { data: budgetSummary, error, isLoading } = useQuery({
  queryKey: ["/api/analytics/budget-summary", selectedMonth, selectedYear],
  queryFn: async () => {
    const response = await fetch(`/api/analytics/budget-summary/${selectedMonth}/${selectedYear}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
});

console.log({ budgetSummary, error, isLoading });



  

  // Fetch category breakdown for category summary
  const { data: categoryData } = useQuery({
    queryKey: ["/api/analytics/category-breakdown", selectedMonth, selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());
      
      const response = await fetch(`/api/analytics/category-breakdown?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    window.open(`/api/export/csv?${params.toString()}`, '_blank');
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
              <div className="md:ml-0 ml-16"> {/* Offset for mobile menu button */}
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Dashboard</h2>
                <p className="text-muted-foreground">Welcome back, Accounting Manager</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex">
                <MonthYearSelector
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onMonthYearChange={handleMonthYearChange}
                />
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="p-6 space-y-6">
          {/* Wallet Overview Cards */}
          <BudgetCards month={selectedMonth} year={selectedYear} />
          
          {/* Monthly Tracking and Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Progress */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Monthly Expense Tracking</CardTitle>
                    <div className="text-sm text-muted-foreground" data-testid="text-budget-usage">
                      {budgetSummary ? `${(budgetSummary.percentageUsed || 0).toFixed(1)}% of wallet used this month` : "Loading... "}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {budgetSummary && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Monthly Usage</span>
                          <span className="font-medium text-foreground" data-testid="text-progress-amount">
                            {formatCurrency(budgetSummary.totalExpenses)} from {formatCurrency(budgetSummary.walletAmount)} wallet
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="h-3 rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-300"
                            style={{ width: `${Math.min(budgetSummary.percentageUsed || 0, 100)}%` }}
                            data-testid="progress-expense-bar"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground" data-testid="text-daily-average">
                            {formatCurrency(budgetSummary.dailyAverage)}
                          </div>
                          <div className="text-xs text-muted-foreground">Daily Average</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground" data-testid="text-projected-spend">
                            {formatCurrency(budgetSummary.projectedTotal)}
                          </div>
                          <div className="text-xs text-muted-foreground">Projected Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-secondary" data-testid="text-days-left">
                            {budgetSummary.daysLeft}
                          </div>
                          <div className="text-xs text-muted-foreground">Days Left</div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Category Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Category Trends</CardTitle>
                  <div className="text-sm text-muted-foreground" data-testid="text-category-count">
                    {categoryData ? `${categoryData.length} categories this month` : "Loading..."}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryData && categoryData.length > 0 ? (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Top Category</span>
                        <span className="font-medium text-foreground" data-testid="text-top-category">
                          {categoryData[0]?.name || "No expenses"}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div 
                          className="h-3 rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-300"
                          style={{ width: `${categoryData[0]?.percentage || 0}%` }}
                          data-testid="progress-category-bar"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground" data-testid="text-top-amount">
                          {formatCurrency(categoryData[0]?.totalAmount || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Top Spend</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground" data-testid="text-avg-category">
                          {formatCurrency(
                            categoryData.length > 0 
                              ? categoryData.reduce((sum: number, cat: any) => sum + cat.totalAmount, 0) / categoryData.length 
                              : 0
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg per Category</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary" data-testid="text-categories-used">
                          {categoryData.filter((cat: any) => cat.totalAmount > 0).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Active Categories</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">No category data available</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Charts and Category Breakdown */}
          <ExpenseCharts month={selectedMonth} year={selectedYear} />
          
          {/* Recent Expenses */}
          <ExpenseTable 
            limit={10} 
            title="Recent Expenses"
            showFilters={false}
          />
        </main>
      </div>
    </div>
  );
}
