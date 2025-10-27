import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type Category } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, X } from "lucide-react";
import type { UploadResult } from "@uppy/core";

// Form input type (before schema transformation)
type ExpenseFormData = {
  description: string;
  amount: string;
  categoryId: string;
  vendor?: string | null;
  date: string; // Input as string, gets transformed to Date by schema
  receiptPath?: string | null;
  notes?: string | null;
};

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<ExpenseFormData>;
  expenseId?: string; // For edit mode
}

export default function ExpenseForm({ onSuccess, onCancel, initialData, expenseId }: ExpenseFormProps) {
  const isEditMode = !!expenseId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState<string | null>(initialData?.receiptPath || null);
  const [uploadedReceipts, setUploadedReceipts] = useState<string[]>(initialData?.receiptPath ? [initialData.receiptPath] : []);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount || "",
      categoryId: initialData?.categoryId || "",
      vendor: initialData?.vendor || "",
      date: initialData?.date || new Date().toISOString().split('T')[0],
      notes: initialData?.notes || "",
      receiptPath: initialData?.receiptPath || null,
    },
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create/Update expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `/api/expenses/${expenseId}` : "/api/expenses";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Success",
        description: isEditMode ? "Expense updated successfully" : "Expense created successfully",
      });
      form.reset();
      setUploadedReceiptUrl(null);
      setUploadedReceipts([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update expense" : "Failed to create expense",
        variant: "destructive",
      });
      console.error("Error creating expense:", error);
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

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-date"
                      />
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
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter expense description"
                      {...field}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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
                      <Input
                        placeholder="Enter vendor name"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-vendor"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  <div className="flex items-center justify-center space-x-2 p-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {uploadedReceipts.length > 0 ? "Add another receipt" : "Click to upload receipt"}
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  </div>
                </ObjectUploader>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Add any additional notes about this expense"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setUploadedReceiptUrl(null);
                  setUploadedReceipts([]);
                  onCancel?.();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExpenseMutation.isPending || categoriesLoading}
                data-testid="button-submit"
              >
                {createExpenseMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isEditMode ? "Update Expense" : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
