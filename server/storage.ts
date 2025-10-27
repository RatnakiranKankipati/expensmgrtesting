import { type Category, type InsertCategory, type User, type InsertUser, type UpdateUser, type ExpenseWallet, type InsertExpenseWallet, type UpdateExpenseWallet, type Expense, type InsertExpense, type UpdateExpense, type ExpenseWithCategory, type WalletSummary, type CategoryBreakdown, type ExpenseFilters, type ExpenseSortBy, type SortOrder, categories, users, expenseWallets, expenses } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from './db';
import { eq, sql, desc, asc, and, gte, lte, lt, like, isNotNull, count, sum } from 'drizzle-orm';

export interface IStorage {
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAzureObjectId(azureObjectId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpdateUser>): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  deleteUser(id: string): Promise<boolean>;
  
  // Spending Limit operations
  getExpenseWallets(): Promise<ExpenseWallet[]>;
  getCurrentExpenseWallet(): Promise<ExpenseWallet | undefined>;
  createExpenseWallet(wallet: InsertExpenseWallet): Promise<ExpenseWallet>;
  updateExpenseWallet(id: string, wallet: Partial<InsertExpenseWallet>): Promise<ExpenseWallet | undefined>;
  deleteExpenseWallet(id: string): Promise<boolean>;
  
  // Expense operations
  getExpenses(filters?: ExpenseFilters, sortBy?: ExpenseSortBy, sortOrder?: SortOrder, limit?: number, offset?: number): Promise<ExpenseWithCategory[]>;
  getExpenseById(id: string): Promise<ExpenseWithCategory | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<UpdateExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  getExpensesCount(filters?: ExpenseFilters): Promise<number>;
  
  // Analytics operations
  getWalletSummary(): Promise<WalletSummary>;
  getWalletSummaryForMonth(month: number, year: number): Promise<WalletSummary>;
  getCategoryBreakdown(month?: number, year?: number): Promise<CategoryBreakdown[]>;
  getExpenseTrends(days: number): Promise<{ date: string; amount: number }[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, 1));
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const [updated] = await db
      .update(categories)
      .set({ isActive: 0 })
      .where(eq(categories.id, id))
      .returning();
    return !!updated;
  }

  // Expense Wallet operations
  async getExpenseWallets(): Promise<ExpenseWallet[]> {
    return await db.select().from(expenseWallets).orderBy(desc(expenseWallets.createdAt));
  }

  async getCurrentExpenseWallet(): Promise<ExpenseWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(expenseWallets)
      .orderBy(desc(expenseWallets.updatedAt))
      .limit(1);
    return wallet || undefined;
  }

  async createExpenseWallet(wallet: InsertExpenseWallet): Promise<ExpenseWallet> {
    const [newWallet] = await db
      .insert(expenseWallets)
      .values({
        ...wallet,
        amount: wallet.amount.toString()
      })
      .returning();
    return newWallet;
  }

  async updateExpenseWallet(id: string, wallet: Partial<InsertExpenseWallet>): Promise<ExpenseWallet | undefined> {
    const updateData: any = { ...wallet, updatedAt: new Date() };
    if (updateData.amount !== undefined) {
      updateData.amount = updateData.amount.toString();
    }
    const [updated] = await db
      .update(expenseWallets)
      .set(updateData)
      .where(eq(expenseWallets.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpenseWallet(id: string): Promise<boolean> {
    const result = await db.delete(expenseWallets).where(eq(expenseWallets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Expense operations
  async getExpenses(
    filters?: ExpenseFilters,
    sortBy: ExpenseSortBy = 'date',
    sortOrder: SortOrder = 'desc',
    limit = 50,
    offset = 0
  ): Promise<ExpenseWithCategory[]> {
    const baseQuery = db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        vendor: expenses.vendor,
        date: expenses.date,
        receiptPath: expenses.receiptPath,
        notes: expenses.notes,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          description: categories.description,
          isActive: categories.isActive,
        },
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id));

    // Apply filters
    const conditions = [];
    if (filters) {
      if (filters.search) {
        conditions.push(
          like(expenses.description, `%${filters.search}%`)
        );
      }
      if (filters.categoryId) {
        conditions.push(eq(expenses.categoryId, filters.categoryId));
      }
      if (filters.startDate) {
        conditions.push(gte(expenses.date, new Date(filters.startDate)));
      }
      if (filters.endDate) {
        conditions.push(lte(expenses.date, new Date(filters.endDate)));
      }
      if (filters.minAmount !== undefined) {
        conditions.push(gte(expenses.amount, filters.minAmount.toString()));
      }
      if (filters.maxAmount !== undefined) {
        conditions.push(lte(expenses.amount, filters.maxAmount.toString()));
      }
    }

    // Apply sorting
    const sortColumn = {
      date: expenses.date,
      amount: expenses.amount,
      description: expenses.description,
      category: categories.name,
    }[sortBy];

    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Build final query with all conditions
    if (conditions.length > 0) {
      return await baseQuery
        .where(and(...conditions))
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);
    } else {
      return await baseQuery
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);
    }
  }

  async getExpenseById(id: string): Promise<ExpenseWithCategory | undefined> {
    const [expense] = await db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        vendor: expenses.vendor,
        date: expenses.date,
        receiptPath: expenses.receiptPath,
        notes: expenses.notes,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
          description: categories.description,
          isActive: categories.isActive,
        },
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values({
        ...expense,
        amount: expense.amount.toString()
      })
      .returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<UpdateExpense>): Promise<Expense | undefined> {
    const updateData: any = { ...expense, updatedAt: new Date() };
    if (updateData.amount !== undefined && updateData.amount !== null) {
      updateData.amount = updateData.amount.toString();
    }
    const [updated] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getExpensesCount(filters?: ExpenseFilters): Promise<number> {
    const baseQuery = db.select({ count: count() }).from(expenses);

    // Apply same filters as getExpenses
    const conditions = [];
    if (filters) {
      if (filters.search) {
        conditions.push(like(expenses.description, `%${filters.search}%`));
      }
      if (filters.categoryId) {
        conditions.push(eq(expenses.categoryId, filters.categoryId));
      }
      if (filters.startDate) {
        conditions.push(gte(expenses.date, new Date(filters.startDate)));
      }
      if (filters.endDate) {
        conditions.push(lte(expenses.date, new Date(filters.endDate)));
      }
      if (filters.minAmount !== undefined) {
        conditions.push(gte(expenses.amount, filters.minAmount.toString()));
      }
      if (filters.maxAmount !== undefined) {
        conditions.push(lte(expenses.amount, filters.maxAmount.toString()));
      }
    }

    if (conditions.length > 0) {
      const [result] = await baseQuery.where(and(...conditions));
      return result.count;
    } else {
      const [result] = await baseQuery;
      return result.count;
    }
  }

  // Analytics operations
  async getWalletSummary(): Promise<WalletSummary> {
    // Get total wallet amount from all wallet entries
    const [walletResult] = await db
      .select({ totalAmount: sum(expenseWallets.amount) })
      .from(expenseWallets);
    const walletAmount = parseFloat(walletResult.totalAmount || '0');

    // Get total expenses
    const [expenseResult] = await db
      .select({ totalAmount: sum(expenses.amount) })
      .from(expenses);
      
    const totalExpenses = parseFloat(expenseResult.totalAmount || '0');
    
    // Get expense count
    const [countResult] = await db
      .select({ count: count() })
      .from(expenses);
    const expenseCount = countResult.count;

    const remainingAmount = walletAmount - totalExpenses;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
    const percentageUsed = walletAmount > 0 ? (totalExpenses / walletAmount) * 100 : 0;
    


    return {
      walletAmount,
      totalExpenses,
      remainingAmount,
      expenseCount,
      averageExpense,
      percentageUsed,
    };
  }

  async getWalletSummaryForMonth(month: number, year: number): Promise<WalletSummary> {
    // Calculate total wallet balance from all wallet entries (like prepaid recharge)
    const [walletResult] = await db
      .select({ totalAmount: sum(expenseWallets.amount) })
      .from(expenseWallets);
    const totalWalletBalance = parseFloat(walletResult.totalAmount || '0');

    // Get ALL expenses ever made (to calculate remaining balance)
    const [allExpenseResult] = await db
      .select({ totalAmount: sum(expenses.amount) })
      .from(expenses);
    
    const totalExpensesEver = parseFloat(allExpenseResult.totalAmount || '0');
 
    
    // Calculate available balance (like prepaid balance remaining)
    const availableBalance = totalWalletBalance - totalExpensesEver;
      

    // Filter expenses for the specific month and year only
    // const startOfMonth = new Date(year, month - 1, 1);
    // const nextMonthStart = new Date(year, month, 1);
    
    // const [monthlyExpenseResult] = await db
    //   .select({ 
    //     totalAmount: sum(expenses.amount),
    //     count: count()
    //   })
    //   .from(expenses)
    //   .where(and(
    //     gte(expenses.date, startOfMonth),
    //     lt(expenses.date, nextMonthStart)
    //   ));
      
      const startOfMonth = new Date(year, month - 1, 1); // months are 0-indexed
     const nextMonthStart = new Date(year, month, 1);

const [monthlyExpenseResult] = await db
  .select({ 
    totalAmount: sum(expenses.amount),
    count: count()
  })
  .from(expenses)
  .where(and(
    gte(expenses.date, startOfMonth),   // pass Date object
    lt(expenses.date, nextMonthStart)
  ));

    const monthlyExpenseAmount = parseFloat(monthlyExpenseResult.totalAmount || '0');
  
    const monthlyExpenseCount = monthlyExpenseResult.count;
    const monthlyAverageExpense = monthlyExpenseCount > 0 ? monthlyExpenseAmount / monthlyExpenseCount : 0;
    
    // Percentage used is monthly expenses vs total wallet balance
    const monthlyPercentageUsed = totalWalletBalance > 0 ? (monthlyExpenseAmount / totalWalletBalance) * 100 : 0;

    // Calculate daily average for the month
    const currentDate = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = currentDate.getMonth() === month - 1 && currentDate.getFullYear() === year;
    
    // For current month, use completed days only; for past/future months use full month
    let daysPassedForAverage = daysInMonth;
    if (isCurrentMonth) {
      // Use completed days only (current date - 1, but at least 1)
      daysPassedForAverage = Math.max(currentDate.getDate() - 1, 1);
    }
    
    // Calculate daily average (avoid division by zero) and round to 2 decimals
    const dailyAverage = daysPassedForAverage > 0 ? 
      Math.round((monthlyExpenseAmount / daysPassedForAverage) * 100) / 100 : 0;
    
    // Calculate projected total
    let projectedTotal = monthlyExpenseAmount;
    if (isCurrentMonth && currentDate.getDate() < daysInMonth) {
      // For current month: current expenses + (remaining days × daily average)
      const remainingDays = daysInMonth - currentDate.getDate();
      projectedTotal = Math.round((monthlyExpenseAmount + (dailyAverage * remainingDays)) * 100) / 100;
    }
    
    // Calculate days left in month
    const currentYear = currentDate.getFullYear();
    const daysLeft = isCurrentMonth ? daysInMonth - currentDate.getDate() : 
                     (year > currentYear || (year === currentYear && month > currentDate.getMonth() + 1)) ? daysInMonth : 0;

    return {
      walletAmount: totalWalletBalance,           // Total wallet balance (all additions)
      monthlyBudget: totalWalletBalance,         // Same as wallet amount for consistency
      totalExpenses: monthlyExpenseAmount,       // Expenses for this month only
      remainingAmount: availableBalance,         // Available balance after all expenses
      expenseCount: monthlyExpenseCount,         // Count for this month only
      averageExpense: monthlyAverageExpense,     // Average for this month only
      percentageUsed: monthlyPercentageUsed,     // Monthly expenses vs total wallet
      dailyAverage,
      projectedTotal,
      daysLeft,
    };
  }

  async getCategoryBreakdown(month?: number, year?: number): Promise<CategoryBreakdown[]> {
    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        color: categories.color,
        description: categories.description,
        isActive: categories.isActive,
        totalAmount: sum(expenses.amount),
        expenseCount: count(expenses.id),
      })
      .from(categories)
      .leftJoin(expenses, eq(categories.id, expenses.categoryId))
      .where(eq(categories.isActive, 1))
      .groupBy(categories.id, categories.name, categories.color, categories.description, categories.isActive);

    // Filter by month/year if provided
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      
      query = db
        .select({
          id: categories.id,
          name: categories.name,
          color: categories.color,
          description: categories.description,
          isActive: categories.isActive,
          totalAmount: sum(expenses.amount),
          expenseCount: count(expenses.id),
        })
        .from(categories)
        .leftJoin(expenses, and(
          eq(categories.id, expenses.categoryId),
          gte(expenses.date, startOfMonth),
          lte(expenses.date, endOfMonth)
        ))
        .where(eq(categories.isActive, 1))
        .groupBy(categories.id, categories.name, categories.color, categories.description, categories.isActive);
    }

    const results = await query;
    
    // Calculate total amount for percentage calculation
    const totalAmount = results.reduce((sum, cat) => sum + parseFloat(cat.totalAmount || '0'), 0);
    return results.map(cat => ({
      ...cat,
      totalAmount: parseFloat(cat.totalAmount || '0'),
      percentage: totalAmount > 0 ? (parseFloat(cat.totalAmount || '0') / totalAmount) * 100 : 0,
    }));
  }

  async getExpenseTrends(days: number): Promise<{ date: string; amount: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await db
      .select({
        date: sql<string>`DATE(${expenses.date})`,
        amount: sum(expenses.amount),
      })
      .from(expenses)
      .where(gte(expenses.date, startDate))
      .groupBy(sql`DATE(${expenses.date})`)
      .orderBy(sql`DATE(${expenses.date})`);

    return results.map(result => ({
      date: result.date,
      amount: parseFloat(result.amount || '0'),
    }));
  }

  async getMonthlyExpenseTrends(months: number): Promise<{ month: string; amount: number }[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1); // Start from first day of the month

    const results = await db
      .select({
        month: sql<string>`TO_CHAR(${expenses.date}, 'YYYY-MM')`,
        amount: sum(expenses.amount),
      })
      .from(expenses)
      .where(gte(expenses.date, startDate))
      .groupBy(sql`TO_CHAR(${expenses.date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${expenses.date}, 'YYYY-MM')`);

    return results.map(result => ({
      month: result.month,
      amount: parseFloat(result.amount || '0'),
    }));
  }

  // User management methods
  async getUsers(): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return result;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async getUserByAzureObjectId(azureObjectId: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.azureObjectId, azureObjectId))
      .limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = {
      ...user,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [result] = await db
      .insert(users)
      .values(newUser)
      .returning();
    
    return result;
  }

  async updateUser(id: string, user: Partial<UpdateUser>): Promise<User | undefined> {
    const updateData = {
      ...user,
      updatedAt: new Date(),
    };

    const [result] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return result;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));

    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();