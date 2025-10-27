import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface ExpenseChartsProps {
  month?: number;
  year?: number;
}

export default function ExpenseCharts({ month, year }: ExpenseChartsProps) {
  const [trendMonths, setTrendMonths] = useState("6");

  // Fetch monthly expense trends
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/analytics/expense-trends-monthly", trendMonths],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/expense-trends-monthly/${trendMonths}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  // Fetch category breakdown
  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["/api/analytics/category-breakdown", month, year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      
      const response = await fetch(`/api/analytics/category-breakdown?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  const formatTrendData = (data: any[]) => {
    return data.map(item => ({
      ...item,
      amount: Number(item.amount) || 0,
      month: item.month ? new Date(item.month + '-01').toLocaleDateString('en-US', { 
        month: 'short',
        year: 'numeric' 
      }) : item.date,
    }));
  };

  const getMonthsLabel = (months: string) => {
    switch (months) {
      case "3": return "Last 3 months";
      case "6": return "Last 6 months";
      case "12": return "Last 12 months";
      default: return "Last 6 months";
    }
  };

  // Colors for pie chart - distinct colors like the reference image
  const COLORS = [
    "#3B82F6", // Blue
    "#8B5CF6", // Purple  
    "#A855F7", // Violet
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F97316", // Orange
    "#EAB308", // Yellow
    "#84CC16", // Lime
    "#22C55E", // Green
    "#10B981", // Emerald
    "#06B6D4", // Cyan
    "#0EA5E9", // Sky blue
    "#6366F1", // Indigo
    "#8B5A2B", // Brown
    "#6B7280", // Gray
  ];

  const formatPieData = (data: any[]) => {
    const total = data.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0);
    return data.map((item, index) => {
      const value = parseFloat(item.totalAmount);
      
      // Special colors for specific categories
      let fillColor = COLORS[index % COLORS.length];
      if (item.name && item.name.toLowerCase() === 'kitchen') {
        fillColor = "#FF6B35"; // Orange-red color for Kitchen
      } else if (item.name && item.name.toLowerCase() === 'festivals') {
        fillColor = "#0F5132"; // Dark green color for Festivals
      }
      
      return {
        ...item,
        value,
        percentage: (value / total) * 100,
        fill: fillColor,
      };
    });
  };

  // Removed custom label function - no longer showing percentages on pie slices

  // Calculate total amount from trends data
  const totalAmount = trendsData?.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0) || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Expense Trends Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Expense Trends</CardTitle>
            <Select value={trendMonths} onValueChange={setTrendMonths}>
              <SelectTrigger className="w-40" data-testid="select-trend-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Total Amount Display */}
          {trendsData && trendsData.length > 0 && (
            <div className="mb-6 text-center">
              <div className="text-3xl font-bold text-primary" data-testid="text-total-amount">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total for {getMonthsLabel(trendMonths)}
              </div>
            </div>
          )}
          <div className="h-[300px]" data-testid="chart-expense-trends">
            {trendsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading chart...</span>
                </div>
              </div>
            ) : trendsData && trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={formatTrendData(trendsData)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="hsl(var(--border))" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      color: "white",
                      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Amount"]}
                    cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                    labelStyle={{ color: "white", fontSize: "12px" }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No data available</p>
                  <p className="text-xs">Add some expenses to see trends</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Expense Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-[350px]" data-testid="category-breakdown">
            {categoryLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading chart...</span>
                </div>
              </div>
            ) : categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatPieData(categoryData)}
                    cx="50%"
                    cy="45%"
                    outerRadius={110}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {formatPieData(categoryData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      fontSize: '11px',
                      paddingTop: '20px',
                      lineHeight: '1.8'
                    }}
                    formatter={(value: string, entry: any) => (
                      <span style={{ color: "hsl(var(--foreground))", fontSize: '11px' }}>
                        {value} - {formatCurrency(entry.payload.value)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No category data available</p>
                  <p className="text-xs">Add some expenses to see breakdown</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
