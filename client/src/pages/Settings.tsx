import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Bell, FileText, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  const handleSaveSettings = () => {
    // For now, just show a success message
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleExportData = () => {
    // Export functionality
    const params = new URLSearchParams();
    window.open(`/api/export/csv?${params.toString()}`, '_blank');
    toast({
      title: "Export Started",
      description: "Your data export will download shortly.",
    });
  };

  const handleClearData = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all data?\n\nThis will permanently delete:\n- All expenses\n- All categories\n- All budgets\n\nThis action cannot be undone."
    );
    
    if (confirmed) {
      toast({
        title: "Data Cleared",
        description: "All application data has been cleared. This is a demo action.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="md:ml-0 ml-16">
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Settings</h2>
                <p className="text-muted-foreground">Manage your application preferences</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Settings Content */}
        <main className="p-6 space-y-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle>Account Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Accounting Manager"
                    value="Accounting Manager"
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="manager@company.com"
                    value="manager@company.com"
                    data-testid="input-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified about budget alerts and expense reminders
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  data-testid="switch-notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive weekly expense summaries via email
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>Display Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger data-testid="select-date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-primary" />
                <CardTitle>Data Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleExportData}
                  className="flex items-center space-x-2"
                  data-testid="button-export-data"
                >
                  <Download className="w-4 h-4" />
                  <span>Export All Data</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearData}
                  className="flex items-center space-x-2"
                  data-testid="button-clear-data"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Data</span>
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Export your data as CSV or permanently delete all application data.
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              className="px-8"
              data-testid="button-save-settings"
            >
              Save Settings
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}