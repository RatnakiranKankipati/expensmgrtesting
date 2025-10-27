import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertExpenseWalletSchema, updateExpenseWalletSchema, insertExpenseSchema, updateExpenseSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { importExpensesFromExcel } from "./excelImport";
import { authProvider } from "./authProvider";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {

   app.get("/health", (req, res) => {
  res.status(200).send("Healthy");
});

  // Authentication routes
  app.use("/auth", authRoutes);
  
  // User management routes (admin only)
  app.use("/api/users", userRoutes);
  
  // Apply authentication middleware to all API routes except auth
  app.use("/api", authProvider.requireAuth());
  
  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Expense Wallet routes
  app.get("/api/expense-wallets", async (req, res) => {
    try {
      const expenseWallets = await storage.getExpenseWallets();
      res.json(expenseWallets);
    } catch (error) {
      console.error("Error fetching expense wallets:", error);
      res.status(500).json({ error: "Failed to fetch expense wallets" });
    }
  });

  app.get("/api/current-expense-wallet", async (req, res) => {
    try {
      const currentWallet = await storage.getCurrentExpenseWallet();
      if (!currentWallet) {
        return res.status(404).json({ error: "No expense wallet found" });
      }
      res.json(currentWallet);
    } catch (error) {
      console.error("Error fetching current expense wallet:", error);
      res.status(500).json({ error: "Failed to fetch current expense wallet" });
    }
  });


  app.post("/api/expense-wallets", async (req, res) => {
    try {
      const walletData = insertExpenseWalletSchema.parse(req.body);
      const expenseWallet = await storage.createExpenseWallet(walletData);
      res.status(201).json(expenseWallet);
    } catch (error) {
      console.error("Error creating expense wallet:", error);
      res.status(400).json({ error: "Failed to create expense wallet" });
    }
  });

  app.put("/api/expense-wallets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const walletData = insertExpenseWalletSchema.partial().parse(req.body);
      const expenseWallet = await storage.updateExpenseWallet(id, walletData);
      
      if (!expenseWallet) {
        return res.status(404).json({ error: "Expense wallet not found" });
      }
      
      res.json(expenseWallet);
    } catch (error) {
      console.error("Error updating expense wallet:", error);
      res.status(400).json({ error: "Failed to update expense wallet" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const { 
        search, 
        categoryId, 
        startDate, 
        endDate, 
        minAmount, 
        maxAmount,
        sortBy = 'date',
        sortOrder = 'desc',
        limit = '50',
        offset = '0'
      } = req.query;

      const filters = {
        search: search as string,
        categoryId: categoryId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined || filters[key as keyof typeof filters] === '') {
          delete filters[key as keyof typeof filters];
        }
      });

      const expenses = await storage.getExpenses(
        Object.keys(filters).length > 0 ? filters : undefined,
        sortBy as any,
        sortOrder as any,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      const totalCount = await storage.getExpensesCount(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json({
        expenses,
        totalCount,
        hasMore: parseInt(offset as string) + expenses.length < totalCount,
      });
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const expense = await storage.getExpenseById(id);
      
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(400).json({ error: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const expenseData = updateExpenseSchema.parse({ ...req.body, id });
      const expense = await storage.updateExpense(id, expenseData);
      
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(400).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteExpense(id);
      
      if (!success) {
        return res.status(404).json({ error: "Expense not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/wallet-summary", async (req, res) => {
    try {
      const summary = await storage.getWalletSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching wallet summary:", error);
      res.status(500).json({ error: "Failed to fetch wallet summary" });
    }
  });

  app.get("/api/analytics/budget-summary/:month/:year", async (req, res) => {
    try {
      console.log("budget summary")
      const { month, year } = req.params;
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: "Invalid month or year parameter" });
      }
      
      const summary = await storage.getWalletSummaryForMonth(monthNum, yearNum);
      console.log(summary)
      res.json(summary);
    } catch (error) {
      console.error("Error fetching budget summary:", error);
      res.status(500).json({ error: "Failed to fetch budget summary" });
    }
  });

  app.get("/api/analytics/category-breakdown", async (req, res) => {
    try {
      const { month, year } = req.query;
      const monthNum = month ? parseInt(month as string) : undefined;
      const yearNum = year ? parseInt(year as string) : undefined;
      
      const breakdown = await storage.getCategoryBreakdown(monthNum, yearNum);
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: "Failed to fetch category breakdown" });
    }
  });

  app.get("/api/analytics/expense-trends/:days", async (req, res) => {
    try {
      const days = parseInt(req.params.days);
      
      if (isNaN(days) || days < 1) {
        return res.status(400).json({ error: "Invalid days parameter" });
      }
      
      const trends = await storage.getExpenseTrends(days);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching expense trends:", error);
      res.status(500).json({ error: "Failed to fetch expense trends" });
    }
  });

  app.get("/api/analytics/expense-trends-monthly/:months", async (req, res) => {
    try {
      const months = parseInt(req.params.months);
      
      if (isNaN(months) || months < 1) {
        return res.status(400).json({ error: "Invalid months parameter" });
      }
      
      const trends = await storage.getMonthlyExpenseTrends(months);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching monthly expense trends:", error);
      res.status(500).json({ error: "Failed to fetch monthly expense trends" });
    }
  });

  // Export routes
  app.get("/api/export/csv", async (req, res) => {
    try {
      const { 
        search, 
        categoryId, 
        startDate, 
        endDate, 
        minAmount, 
        maxAmount 
      } = req.query;

      const filters = {
        search: search as string,
        categoryId: categoryId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined || filters[key as keyof typeof filters] === '') {
          delete filters[key as keyof typeof filters];
        }
      });

      const expenses = await storage.getExpenses(
        Object.keys(filters).length > 0 ? filters : undefined,
        'date',
        'desc',
        999999, // Get all expenses for export
        0
      );

      // Convert to CSV format
      const csvData = [
        ['Date', 'Description', 'Category', 'Vendor', 'Amount', 'Notes'].join(','),
        ...expenses.map(expense => [
          new Date(expense.date).toLocaleDateString(),
          `"${expense.description.replace(/"/g, '""')}"`,
          expense.category ? `"${expense.category.name.replace(/"/g, '""')}"` : 'Uncategorized',
          expense.vendor ? `"${expense.vendor.replace(/"/g, '""')}"` : '',
          expense.amount,
          expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : '',
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // Object storage routes for receipts
  app.get("/objects/:objectPath(*)", authProvider.requireAuth(), async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Excel import route
  app.post("/api/expenses/import-excel", async (req, res) => {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: "File path is required" });
      }

      // Construct full path to the uploaded file
      const fullPath = path.join(process.cwd(), filePath);
      
      const results = await importExpensesFromExcel(fullPath);
      
      res.json(results);
    } catch (error) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({ error: "Failed to import Excel file", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
