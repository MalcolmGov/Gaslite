import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Flame, 
  MapPin, 
  Package, 
  Users, 
  Truck, 
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp
} from "lucide-react";
import type { Order, DriverApplication, Driver } from "@shared/schema";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("orders");

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<DriverApplication[]>({
    queryKey: ["/api/admin/driver-applications"],
  });

  const { data: drivers, isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/admin/drivers"],
  });

  const { data: stats } = useQuery<{
    totalOrders: number;
    totalRevenue: number;
    activeDrivers: number;
    pendingApplications: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, driverId }: { orderId: string; status?: string; driverId?: string }) => {
      return apiRequest("PATCH", `/api/admin/orders/${orderId}`, { status, driverId });
    },
    onSuccess: () => {
      toast({ title: "Order updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const reviewApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status, notes }: { applicationId: string; status: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/admin/driver-applications/${applicationId}`, { status, reviewNotes: notes });
    },
    onSuccess: () => {
      toast({ title: "Application reviewed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/driver-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to review application", variant: "destructive" });
    },
  });

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600";
      case "confirmed": return "bg-blue-500/10 text-blue-600";
      case "assigned": return "bg-purple-500/10 text-purple-600";
      case "in_progress": return "bg-orange-500/10 text-orange-600";
      case "delivered": return "bg-green-500/10 text-green-600";
      case "cancelled": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600";
      case "approved": return "bg-green-500/10 text-green-600";
      case "rejected": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/10 text-green-600";
      case "busy": return "bg-orange-500/10 text-orange-600";
      case "offline": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const availableDrivers = drivers?.filter((d) => d.status === "available") || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold">Gaslite</span>
                <span className="text-sm text-muted-foreground ml-2">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user?.firstName || user?.email}
                </span>
                <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage orders, drivers, and applications</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">R{(stats?.totalRevenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Drivers</p>
                    <p className="text-2xl font-bold">{stats?.activeDrivers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Applications</p>
                    <p className="text-2xl font-bold">{stats?.pendingApplications || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders" data-testid="tab-orders">
                <Package className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="applications" data-testid="tab-applications">
                <FileText className="h-4 w-4 mr-2" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="drivers" data-testid="tab-drivers">
                <Truck className="h-4 w-4 mr-2" />
                Drivers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>Manage and track all customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : orders?.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders?.map((order) => (
                        <Card key={order.id} className="overflow-visible">
                          <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">#{order.orderNumber}</span>
                                  <Badge className={getOrderStatusColor(order.status)}>
                                    {order.status.replace("_", " ")}
                                  </Badge>
                                  {order.driverId && (
                                    <Badge variant="outline">Driver Assigned</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {order.deliveryAddress}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="font-medium">Total: R{Number(order.total).toFixed(2)}</span>
                                  <span className="text-muted-foreground">
                                    {new Date(order.createdAt!).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => updateOrderMutation.mutate({ orderId: order.id, status: value })}
                                >
                                  <SelectTrigger className="w-[140px]" data-testid={`select-status-${order.id}`}>
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                {!order.driverId && availableDrivers.length > 0 && (
                                  <Select
                                    onValueChange={(value) => updateOrderMutation.mutate({ orderId: order.id, driverId: value, status: "assigned" })}
                                  >
                                    <SelectTrigger className="w-[160px]" data-testid={`select-driver-${order.id}`}>
                                      <SelectValue placeholder="Assign Driver" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableDrivers.map((driver) => (
                                        <SelectItem key={driver.id} value={driver.id}>
                                          Driver {driver.id.slice(0, 8)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Driver Applications</CardTitle>
                  <CardDescription>Review and approve driver applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : applications?.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No applications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications?.map((app) => (
                        <Card key={app.id} className="overflow-visible">
                          <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{app.firstName} {app.lastName}</span>
                                  <Badge className={getApplicationStatusColor(app.status)}>
                                    {app.status}
                                  </Badge>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <p>Email: {app.email}</p>
                                  <p>Phone: {app.phone}</p>
                                  <p>License: {app.licenseNumber}</p>
                                  <p>Vehicle: {app.vehicleRegistration}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">Address: {app.address}</p>
                                <div className="flex gap-2 mt-2">
                                  {app.licenseDocumentUrl && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(app.licenseDocumentUrl!, '_blank')}
                                      data-testid={`button-view-license-${app.id}`}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      View License
                                    </Button>
                                  )}
                                  {app.vehicleDocumentUrl && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(app.vehicleDocumentUrl!, '_blank')}
                                      data-testid={`button-view-vehicle-${app.id}`}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      View Vehicle Doc
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {app.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => reviewApplicationMutation.mutate({ applicationId: app.id, status: "approved" })}
                                    disabled={reviewApplicationMutation.isPending}
                                    data-testid={`button-approve-${app.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => reviewApplicationMutation.mutate({ applicationId: app.id, status: "rejected" })}
                                    disabled={reviewApplicationMutation.isPending}
                                    data-testid={`button-reject-${app.id}`}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drivers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Drivers</CardTitle>
                  <CardDescription>View all approved drivers and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {driversLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : drivers?.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No approved drivers yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {drivers?.map((driver) => (
                        <Card key={driver.id} className="overflow-visible">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Truck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Driver {driver.id.slice(0, 8)}</span>
                                    <Badge className={getDriverStatusColor(driver.status)}>
                                      {driver.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{driver.totalDeliveries} deliveries</span>
                                    <span>R{Number(driver.totalEarnings || 0).toFixed(2)} earned</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
