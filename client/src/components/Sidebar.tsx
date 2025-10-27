import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuthState } from "@/hooks/useAuth";
import fdesLogo from "@assets/image_1758110732910.png";
import { 
  Receipt, 
  BarChart3, 
  Plus, 
  List, 
  Tags, 
  Calendar, 
  Download, 
  Settings,
  Menu,
  X,
  Users,
  LogOut,
  LogIn
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Add Expense", href: "/add-expense", icon: Plus },
  { name: "All Expenses", href: "/expenses", icon: List },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Expense Wallet", href: "/budget", icon: Calendar },
];

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const authState = useAuthState();
  const { isAuthenticated, user, isAdmin } = authState;

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        data-testid="button-mobile-menu"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-foreground" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:static w-64 bg-card border-r border-border h-full z-50 transform transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
        style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.1)" }}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <img 
              src={fdesLogo} 
              alt="FDES Logo" 
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-lg font-semibold text-foreground">Expense Tracker</h1>
          </div>
          
          {/* User info */}
          {isAuthenticated && user && (
            <div className="mt-4 p-3 bg-accent/50 rounded-lg">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
                  Admin
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {!isAuthenticated ? (
            <button
              className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
              onClick={authState.login}
              data-testid="button-login"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In with Microsoft</span>
            </button>
          ) : (
            <>
              {navigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setIsMobileOpen(false)}
                    data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Admin-only User Management */}
              {isAdmin && (
                <Link 
                  href="/user-management"
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    location === "/user-management"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                  data-testid="link-user-management"
                >
                  <Users className="w-5 h-5" />
                  <span>User Management</span>
                </Link>
              )}
            </>
          )}
          
          {isAuthenticated && (
            <div className="pt-4 border-t border-border mt-4">
              <button
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                onClick={() => {
                  // Export CSV functionality
                  const params = new URLSearchParams();
                  window.open(`/api/export/csv?${params.toString()}`, '_blank');
                }}
                data-testid="button-export-data"
              >
                <Download className="w-5 h-5" />
                <span>Export Data</span>
              </button>
              
              <Link href="/settings">
                <button
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                  onClick={() => setIsMobileOpen(false)}
                  data-testid="button-settings"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
              </Link>
              
              <button
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
                onClick={authState.logout}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
