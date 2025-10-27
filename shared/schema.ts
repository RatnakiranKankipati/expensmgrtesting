import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#3b82f6"),
  description: text("description"),
  isActive: integer("is_active").notNull().default(1),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  azureObjectId: text("azure_object_id").unique(),
  isActive: integer("is_active").notNull().default(1),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const expenseWallets = pgTable("expense_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  vendor: text("vendor"),
  date: timestamp("date").notNull(),
  receiptPath: text("receipt_path"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  isActive: true,
});

export const insertExpenseWalletSchema = createInsertSchema(expenseWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(numVal) || numVal <= 0) {
      throw new Error('Amount must be a positive number');
    }
    return numVal;
  }),
  date: z.string().transform((val) => new Date(val)),
});

export const updateExpenseWalletSchema = insertExpenseWalletSchema.partial().extend({
  id: z.string(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().transform((val) => new Date(val)),
});

export const updateExpenseSchema = insertExpenseSchema.partial().extend({
  id: z.string(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const updateUserSchema = insertUserSchema.partial().extend({
  id: z.string(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ExpenseWallet = typeof expenseWallets.$inferSelect;
export type InsertExpenseWallet = z.infer<typeof insertExpenseWalletSchema>;
export type UpdateExpenseWallet = z.infer<typeof updateExpenseWalletSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpdateExpense = z.infer<typeof updateExpenseSchema>;

// Extended types for API responses
export type ExpenseWithCategory = Expense & {
  category: Category | null;
};

export type WalletSummary = {
  walletAmount: number;
  totalExpenses: number;
  remainingAmount: number;
  expenseCount: number;
  averageExpense: number;
  percentageUsed: number;
  monthlyBudget?: number;
  dailyAverage?: number;
  projectedTotal?: number;
  daysLeft?: number;
};

export type CategoryBreakdown = Category & {
  totalAmount: number;
  percentage: number;
  expenseCount: number;
};

export type ExpenseFilters = {
  search?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
};

export type ExpenseSortBy = 'date' | 'amount' | 'description' | 'category';
export type SortOrder = 'asc' | 'desc';

// Define relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));
