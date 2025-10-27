import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/Sidebar";
import { User } from "@shared/schema";
import { Users, Shield, UserCheck, UserX, RefreshCw, Plus, Edit, Trash2, ArrowLeft, Bell } from "lucide-react";
import { Link } from "wouter";

// User form schema
const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["user", "admin"]),
  isActive: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
    action: 'activate' | 'deactivate' | 'delete';
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    action: 'activate',
    userName: ''
  });

  const [userFormDialog, setUserFormDialog] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    user?: User;
  }>({
    isOpen: false,
    mode: 'create',
    user: undefined
  });

  // Form for creating/editing users
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      isActive: true,
    },
  });

  // Fetch all users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json() as Promise<User[]>;
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return apiRequest('POST', '/api/users', {
        ...data,
        isActive: data.isActive ? 1 : 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User created",
        description: "User has been created successfully.",
      });
      setUserFormDialog({ isOpen: false, mode: 'create' });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<UserFormData> }) => {
      return apiRequest('PUT', `/api/users/${userId}`, {
        ...data,
        isActive: data.isActive !== undefined ? (data.isActive ? 1 : 0) : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });
      setUserFormDialog({ isOpen: false, mode: 'create' });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  });

  // Toggle user active status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/users/${userId}/status`, { isActive: isActive ? 1 : 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User status updated",
        description: "User access has been successfully updated.",
      });
      setConfirmDialog({ isOpen: false, userId: '', action: 'activate', userName: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
      setConfirmDialog({ isOpen: false, userId: '', action: 'activate', userName: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  });

  // Handler functions
  const handleStatusToggle = (user: User, newStatus: boolean) => {
    setConfirmDialog({
      isOpen: true,
      userId: user.id,
      action: newStatus ? 'activate' : 'deactivate',
      userName: user.name
    });
  };

  const handleDeleteUser = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      userId: user.id,
      action: 'delete',
      userName: user.name
    });
  };

  const handleEditUser = (user: User) => {
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role as "user" | "admin",
      isActive: Boolean(user.isActive),
    });
    setUserFormDialog({
      isOpen: true,
      mode: 'edit',
      user: user
    });
  };

  const handleCreateUser = () => {
    form.reset({
      name: "",
      email: "",
      role: "user",
      isActive: true,
    });
    setUserFormDialog({
      isOpen: true,
      mode: 'create'
    });
  };

  const confirmStatusChange = () => {
    if (confirmDialog.action === 'delete') {
      deleteUserMutation.mutate(confirmDialog.userId);
    } else {
      toggleUserStatusMutation.mutate({
        userId: confirmDialog.userId,
        isActive: confirmDialog.action === 'activate'
      });
    }
  };

  const onSubmitUser = (data: UserFormData) => {
    if (userFormDialog.mode === 'create') {
      createUserMutation.mutate(data);
    } else if (userFormDialog.user) {
      updateUserMutation.mutate({
        userId: userFormDialog.user.id,
        data: data
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-0 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p>You don't have permission to view user management.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 md:ml-0 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p>Loading user management...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                <div className="flex items-center space-x-4">
                  <Link href="/">
                    <Button variant="ghost" size="sm" data-testid="button-back">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">User Management</h2>
                    <p className="text-muted-foreground">Manage user access and permissions for the expense tracking system</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {users?.length || 0} Total Users
              </Badge>
              <Button onClick={handleCreateUser} data-testid="button-add-user">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </header>
        
        {/* User Management Content */}
        <main className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!users || users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    Click "Add User" to create the first user account.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium" data-testid={`text-name-${user.id}`}>
                          {user.name}
                        </TableCell>
                        <TableCell data-testid={`text-email-${user.id}`}>
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            data-testid={`badge-role-${user.id}`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={Boolean(user.isActive) ? 'default' : 'destructive'}
                            data-testid={`badge-status-${user.id}`}
                          >
                            {Boolean(user.isActive) ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-joined-${user.id}`}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              data-testid={`button-edit-${user.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Switch
                              checked={Boolean(user.isActive)}
                              onCheckedChange={(checked) => handleStatusToggle(user, checked)}
                              disabled={toggleUserStatusMutation.isPending}
                              data-testid={`switch-status-${user.id}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              data-testid={`button-delete-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* User Form Dialog */}
      <Dialog open={userFormDialog.isOpen} onOpenChange={() => setUserFormDialog({ ...userFormDialog, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {userFormDialog.mode === 'create' ? (
                <Plus className="h-5 w-5 text-primary" />
              ) : (
                <Edit className="h-5 w-5 text-primary" />
              )}
              {userFormDialog.mode === 'create' ? 'Add New User' : 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {userFormDialog.mode === 'create' 
                ? "Create a new user account for the expense tracking system."
                : "Update user information and permissions."
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter user's full name" {...field} data-testid="input-user-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter user's email address" {...field} data-testid="input-user-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-user-role">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow this user to access the application
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-user-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUserFormDialog({ ...userFormDialog, isOpen: false })}
                  data-testid="button-cancel-user-form"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  {(createUserMutation.isPending || updateUserMutation.isPending) && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {userFormDialog.mode === 'create' ? 'Create User' : 'Update User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'activate' && <UserCheck className="h-5 w-5 text-green-600" />}
              {confirmDialog.action === 'deactivate' && <UserX className="h-5 w-5 text-yellow-600" />}
              {confirmDialog.action === 'delete' && <Trash2 className="h-5 w-5 text-red-600" />}
              {confirmDialog.action === 'activate' && 'Activate User'}
              {confirmDialog.action === 'deactivate' && 'Deactivate User'}
              {confirmDialog.action === 'delete' && 'Delete User'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'activate' && 
                `Are you sure you want to activate ${confirmDialog.userName}? This user will regain access to the expense tracking system.`
              }
              {confirmDialog.action === 'deactivate' && 
                `Are you sure you want to deactivate ${confirmDialog.userName}? This user will lose access to the expense tracking system.`
              }
              {confirmDialog.action === 'delete' && 
                `Are you sure you want to permanently delete ${confirmDialog.userName}? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
              data-testid="button-cancel-action"
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.action === 'delete' ? 'destructive' : confirmDialog.action === 'activate' ? 'default' : 'secondary'}
              onClick={confirmStatusChange}
              disabled={toggleUserStatusMutation.isPending || deleteUserMutation.isPending}
              data-testid="button-confirm-action"
            >
              {(toggleUserStatusMutation.isPending || deleteUserMutation.isPending) && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {confirmDialog.action === 'activate' && 'Activate'}
              {confirmDialog.action === 'deactivate' && 'Deactivate'}
              {confirmDialog.action === 'delete' && 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}