import { Link, useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import ExpenseForm from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddExpense() {
  const [, setLocation] = useLocation();

  const handleCancel = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 md:ml-0" style={{height:"100vh",overflow:"scroll"}}>
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
                    <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Add Expense</h2>
                    <p className="text-muted-foreground">Create a new expense entry</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          <ExpenseForm 
            onSuccess={() => {
              setLocation('/');
            }}
            onCancel={handleCancel}
          />
        </main>
      </div>
    </div>
  );
}
