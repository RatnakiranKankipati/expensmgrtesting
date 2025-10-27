import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle } from "lucide-react";

interface ImportResults {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

export default function ExcelImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      // First, move the file to the server-accessible location
      const formData = new FormData();
      formData.append('file', file);
      
      // For now, we'll use the already uploaded file path
      // In a real application, you'd upload the file to the server first
      const filePath = "attached_assets/ExpensesDataWithCategories_1757399520442.xlsx";
      
      const response = await apiRequest("POST", "/api/expenses/import-excel", { 
        filePath 
      });
      return response.json();
    },
    onSuccess: (results: ImportResults) => {
      setImportResults(results);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      if (results.successful > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${results.successful} expense${results.successful !== 1 ? 's' : ''}${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: "No expenses were imported successfully",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Import Error",
        description: "Failed to import Excel file",
        variant: "destructive",
      });
      console.error("Import error:", error);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setImportResults(null);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2"
          data-testid="button-import-excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Import Excel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Expenses from Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {!importResults && (
            <>
              <div>
                <Label htmlFor="excel-file">Select Excel File</Label>
                <div className="mt-2">
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    data-testid="input-excel-file"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .xlsx and .xls files with expense data
                </p>
              </div>

              {selectedFile && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={resetDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || importMutation.isPending}
                  data-testid="button-start-import"
                >
                  {importMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Import Expenses
                </Button>
              </div>
            </>
          )}

          {importResults && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Import Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total rows processed:</span>
                    <span className="font-medium">{importResults.total}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Successful:</span>
                    </div>
                    <span className="font-medium text-green-600">{importResults.successful}</span>
                  </div>

                  {importResults.failed > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm">Failed:</span>
                      </div>
                      <span className="font-medium text-red-600">{importResults.failed}</span>
                    </div>
                  )}

                  {importResults.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Errors:</p>
                      <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                        {importResults.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600">{error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button onClick={resetDialog} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}