import XLSX from 'xlsx';
import path from 'path';
import { storage } from './storage';
import { insertExpenseSchema, type Category } from '@shared/schema';

export interface ExcelExpenseRow {
  date?: string;
  description?: string;
  amount?: string | number;
  category?: string;
  vendor?: string;
  notes?: string;
  receiptPath?: string;
}

export async function parseExcelFile(filePath: string) {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('Raw Excel data:', rawData);
    console.log('Sample row:', rawData[0]);
    
    return rawData;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
}

export async function mapExcelRowToExpense(row: any, categories: Category[]): Promise<any> {
  // Map common column names to our schema
  const mappings: Record<string, string[]> = {
    date: ['date', 'Date', 'DATE', 'expense_date', 'Expense Date'],
    description: ['description', 'Description', 'DESCRIPTION', 'expense_description', 'Expense Description', 'item', 'Item'],
    amount: ['amount', 'Amount', 'AMOUNT', 'expense_amount', 'Expense Amount', 'cost', 'Cost', 'price', 'Price'],
    category: ['category', 'Category', 'CATEGORY', 'expense_category', 'Expense Category', 'type', 'Type'],
    vendor: ['vendor', 'Vendor', 'VENDOR', 'supplier', 'Supplier', 'merchant', 'Merchant'],
    notes: ['notes', 'Notes', 'NOTES', 'comments', 'Comments', 'remarks', 'Remarks']
  };

  const mappedData: any = {};
  
  // Find and map each field
  for (const [field, possibleKeys] of Object.entries(mappings)) {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        mappedData[field] = row[key];
        break;
      }
    }
  }

  // Process date
  if (mappedData.date) {
    try {
      // Handle Excel date numbers or text dates
      let dateValue;
      if (typeof mappedData.date === 'number') {
        // Excel date number
        const excelDate = new Date((mappedData.date - 25569) * 86400 * 1000);
        dateValue = excelDate.toISOString().split('T')[0];
      } else {
        // Text date
        const date = new Date(mappedData.date);
        dateValue = date.toISOString().split('T')[0];
      }
      mappedData.date = dateValue;
    } catch (error) {
      mappedData.date = new Date().toISOString().split('T')[0];
    }
  } else {
    mappedData.date = new Date().toISOString().split('T')[0];
  }

  // Process amount
  if (mappedData.amount) {
    const amountStr = String(mappedData.amount).replace(/[₹,\s]/g, '');
    mappedData.amount = amountStr;
  }

  // Map category name to category ID
  if (mappedData.category) {
    const categoryName = String(mappedData.category).trim();
    const matchedCategory = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (matchedCategory) {
      mappedData.categoryId = matchedCategory.id;
    } else {
      // Create new category if it doesn't exist
      try {
        const newCategory = await storage.createCategory({ name: categoryName });
        mappedData.categoryId = newCategory.id;
        categories.push(newCategory); // Add to categories list for next iterations
      } catch (error) {
        console.error('Failed to create category:', categoryName, error);
        // Use first available category as fallback
        mappedData.categoryId = categories[0]?.id;
      }
    }
  } else {
    // Use first available category as fallback
    mappedData.categoryId = categories[0]?.id;
  }

  // Ensure required fields
  if (!mappedData.description) {
    mappedData.description = 'Imported expense';
  }
  
  if (!mappedData.amount) {
    mappedData.amount = '0';
  }

  return mappedData;
}

export async function importExpensesFromExcel(filePath: string) {
  try {
    // Parse Excel file
    const rawData = await parseExcelFile(filePath);
    
    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in Excel file');
    }

    // Get existing categories
    const categories = await storage.getCategories();
    
    const importResults = {
      total: rawData.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each row
    for (let i = 0; i < rawData.length; i++) {
      try {
        const row = rawData[i];
        const mappedExpense = await mapExcelRowToExpense(row, categories);
        
        // Validate with schema
        const validatedExpense = insertExpenseSchema.parse(mappedExpense);
        
        // Create expense
        await storage.createExpense(validatedExpense);
        importResults.successful++;
        
      } catch (error) {
        console.error(`Failed to import row ${i + 1}:`, error);
        importResults.failed++;
        importResults.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return importResults;
  } catch (error) {
    console.error('Error importing expenses from Excel:', error);
    throw error;
  }
}