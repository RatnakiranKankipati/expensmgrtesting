import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateExpenseSchema } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Edit, Trash2, Paperclip, ChevronUp, ChevronDown, Download, X, Upload, FileText } from "lucide-react";
import type { UploadResult } from "@uppy/core";
import type { ExpenseFilters, ExpenseSortBy, SortOrder, Category, UpdateExpense } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

interface ExpenseTableProps {
  showFilters?: boolean;
  limit?: number;
  title?: string;
}

interface EditExpenseFormInlineProps {
  expense: any;
  categories: Category[];
  onSubmit: (data: Partial<UpdateExpense>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditExpenseFormInline({ expense, categories, onSubmit, onCancel, isLoading }: EditExpenseFormInlineProps) {
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState<string | null>(expense?.receiptPath || null);
  const [uploadedReceipts, setUploadedReceipts] = useState<string[]>(expense?.receiptPath ? [expense.receiptPath] : []);
  const { toast } = useToast();
  
  const form = useForm<Partial<UpdateExpense>>({
    resolver: zodResolver(updateExpenseSchema.partial()),
    defaultValues: {
      description: expense.description,
      amount: expense.amount,
      categoryId: expense.categoryId,
      vendor: expense.vendor ?? '',
      date: new Date(expense.date).toISOString().split('T')[0] as any,
      notes: expense.notes ?? '',
      receiptPath: expense.receiptPath ?? null,
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const removeReceipt = (receiptPath: string) => {
    setUploadedReceipts(prev => prev.filter(path => path !== receiptPath));
    if (receiptPath === form.getValues('receiptPath')) {
      form.setValue('receiptPath', null);
      setUploadedReceiptUrl(null);
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadUrl = result.successful[0].uploadURL;
      if (uploadUrl) {
        setUploadedReceiptUrl(uploadUrl);
        
        // Extract the object path from the upload URL
        const url = new URL(uploadUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(part => part === 'uploads');
        if (bucketIndex !== -1) {
          const objectId = pathParts.slice(bucketIndex + 1).join('/');
          const receiptPath = `/objects/uploads/${objectId}`;
          form.setValue('receiptPath', receiptPath);
          setUploadedReceipts(prev => [...prev, receiptPath]);
        }
      }
      
      toast({
        title: "Success",
        description: "Receipt uploaded successfully",
      });
    }
  };

  const handleSubmit = (data: Partial<UpdateExpense>) => {
    const submitData = {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      amount: data.amount?.toString(),
    };
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter vendor name" {...field} value={field.value || ""} />
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
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value?.toString().split('T')[0] || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add any additional notes..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Label>Receipt Upload</Label>
          <div className="mt-2 space-y-3">
            {/* Show uploaded receipts */}
            {uploadedReceipts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {uploadedReceipts.length} receipt{uploadedReceipts.length !== 1 ? 's' : ''} uploaded
                </p>
                {uploadedReceipts.map((receiptPath, index) => (
                  <div key={receiptPath} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Receipt {index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeReceipt(receiptPath)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload button */}
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full"
            >
              <div className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {uploadedReceipts.length > 0 ? "Replace receipt" : "Click to upload receipt"}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
            </ObjectUploader>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ExpenseTable({ showFilters = true, limit = 50, title = "Expenses" }: ExpenseTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [sortBy, setSortBy] = useState<ExpenseSortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [viewExpense, setViewExpense] = useState<any>(null);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch categories for filter
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch expenses
  const { data: expenseData, isLoading } = useQuery({
    queryKey: ["/api/expenses", filters, sortBy, sortOrder, limit, currentPage * limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minAmount !== undefined && { minAmount: filters.minAmount.toString() }),
        ...(filters.maxAmount !== undefined && { maxAmount: filters.maxAmount.toString() }),
        sortBy,
        sortOrder,
        limit: limit.toString(),
        offset: (currentPage * limit).toString(),
      });

      const response = await fetch(`/api/expenses?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  // Edit expense mutation
  const editExpenseMutation = useMutation({
    mutationFn: async (data: { id: string; expense: Partial<UpdateExpense> }) => {
      await apiRequest("PUT", `/api/expenses/${data.id}`, data.expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setIsEditOpen(false);
      setEditExpense(null);
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  const handleSort = (column: ExpenseSortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(0);
  };

  const handleFilterChange = (key: keyof ExpenseFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
    setCurrentPage(0);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      ...(filters.search && { search: filters.search }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.minAmount !== undefined && { minAmount: filters.minAmount.toString() }),
      ...(filters.maxAmount !== undefined && { maxAmount: filters.maxAmount.toString() }),
    });
    
    window.open(`/api/export/csv?${params.toString()}`, '_blank');
    
    toast({
      title: "Export Started",
      description: "Your filtered expenses are being exported to CSV.",
    });
  };

  const expenses = expenseData?.expenses || [];
  const totalCount = expenseData?.totalCount || 0;
  const hasMore = expenseData?.hasMore || false;

  const getSortIcon = (column: ExpenseSortBy) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.color || '#6b7280';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <CardTitle data-testid="text-expenses-title">{title}</CardTitle>
          
          {showFilters && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search expenses..."
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  data-testid="input-search"
                />
              </div>
              
              <Select value={filters.categoryId || 'all'} onValueChange={(value) => handleFilterChange('categoryId', value === 'all' ? '' : value)}>
                <SelectTrigger className="w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  placeholder="Start date"
                  data-testid="input-start-date"
                />
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  placeholder="End date"
                  data-testid="input-end-date"
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="whitespace-nowrap"
                data-testid="button-export-filtered"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Filtered
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0" >
        <div className="overflow-x-auto" style={{height:"70vh",overflow:"scroll"}}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-1 hover:text-foreground p-0 h-auto"
                    onClick={() => handleSort('date')}
                    data-testid="button-sort-date"
                  >
                    <span>Date</span>
                    {getSortIcon('date')}
                  </Button>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-1 hover:text-foreground p-0 h-auto"
                    onClick={() => handleSort('amount')}
                    data-testid="button-sort-amount"
                  >
                    <span>Amount</span>
                    {getSortIcon('amount')}
                  </Button>
                </TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground">Loading expenses...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {Object.keys(filters).length > 0 ? "No expenses found matching your filters" : "No expenses found"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense: any) => (
                  <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-expense-${expense.id}`}>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground" data-testid={`text-expense-date-${expense.id}`}>
                        {formatDate(expense.date)}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-expense-time-${expense.id}`}>
                        {formatTime(expense.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground" data-testid={`text-expense-description-${expense.id}`}>
                        {expense.description}
                      </div>
                      {expense.vendor && (
                        <div className="text-xs text-muted-foreground" data-testid={`text-expense-vendor-${expense.id}`}>
                          {expense.vendor}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        style={{ backgroundColor: `${getCategoryColor(expense.categoryId)}20`, color: getCategoryColor(expense.categoryId) }}
                        data-testid={`badge-category-${expense.id}`}
                      >
                        {expense.category?.name || 'Unknown Category'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold text-foreground" data-testid={`text-expense-amount-${expense.id}`}>
                        {formatCurrency(expense.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {expense.receiptPath ? (
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-secondary" />
                          <a
                            href={expense.receiptPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`link-receipt-${expense.id}`}
                          >
                            receipt
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No receipt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setViewExpense(expense);
                            setIsViewOpen(true);
                          }}
                          data-testid={`button-view-${expense.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditExpense(expense);
                            setIsEditOpen(true);
                          }}
                          data-testid={`button-edit-${expense.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            const confirmed = window.confirm(`Are you sure you want to delete the expense "${expense.description}"?\n\nAmount: ${formatCurrency(expense.amount)}\nThis action cannot be undone.`);
                            if (confirmed) {
                              deleteExpenseMutation.mutate(expense.id);
                            }
                          }}
                          disabled={deleteExpenseMutation.isPending}
                          data-testid={`button-delete-${expense.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
      
      </CardContent>
      <CardFooter style={{justifyContent:"end",paddingBottom:"0px"}}>
             {expenses.length > 0 && (
          <div className="">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, totalCount)} of {totalCount} expenses
              </div>
              <div className="flex items-center justify-end  space-x-2 p-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  data-testid="button-previous-page"
                >
                  Previous
                </Button>
                <span className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded">
                  {currentPage + 1}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasMore}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>

    {/* View Expense Dialog */}
    <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
        </DialogHeader>
        {viewExpense && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm">{viewExpense.description}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
              <p className="text-lg font-semibold">{formatCurrency(viewExpense.amount)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Category</Label>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: viewExpense.category.color }}
                />
                <p className="text-sm">{viewExpense.category.name}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Vendor</Label>
              <p className="text-sm">{viewExpense.vendor || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date</Label>
              <p className="text-sm">{formatDate(viewExpense.date)} at {formatTime(viewExpense.date)}</p>
            </div>
            {viewExpense.notes && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                <p className="text-sm">{viewExpense.notes}</p>
              </div>
            )}
            {viewExpense.receiptPath && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Receipt</Label>
                <a
                  href={viewExpense.receiptPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Receipt
                </a>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Edit Expense Dialog */}
    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        {editExpense && (
          <EditExpenseFormInline
            expense={editExpense}
            categories={categories}
            onSubmit={(data: Partial<UpdateExpense>) => {
              editExpenseMutation.mutate({ id: editExpense.id, expense: data });
            }}
            onCancel={() => {
              setIsEditOpen(false);
              setEditExpense(null);
            }}
            isLoading={editExpenseMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
