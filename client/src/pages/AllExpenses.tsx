import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import ExpenseTable from "@/components/ExpenseTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

export default function AllExpenses() {
  return (
    <div className="min-h-screen flex bg-background" style={{height:"100vh",overflow:"none"}}>
      <Sidebar />
      
      <div className="flex-1 md:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="md:ml-0 ml-16">
                <div className="flex items-center space-x-4">
                  <Link href="/">
                    <Button variant="ghost" size="sm" data-testid="button-back">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">All Expenses</h2>
                    <p className="text-muted-foreground">View and manage all expense entries</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Link href="/add-expense">
              <Button data-testid="button-add-expense">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </Link>
          </div>
        </header>
        
        <main className="p-6" style={{height:"80vh",overflow:"none"}}>
          <ExpenseTable 
            title="All Expenses" 
            showFilters={true}
            limit={50}
          />
        </main>
      </div>
    </div>
  );
}
