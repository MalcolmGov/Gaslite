import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Flame, 
  MapPin, 
  Package, 
  DollarSign, 
  Truck, 
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  Phone
} from "lucide-react";
import type { Order, Driver } from "@shared/schema";

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: driver, isLoading: driverLoading } = useQuery<Driver>({
    queryKey: ["/api/driver/profile"],
  });

  const { data: assignedOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/driver/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return apiRequest("PATCH", "/api/driver/status", { status });
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("PATCH", `/api/driver/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Order updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/10 text-green-600";
      case "busy": return "bg-orange-500/10 text-orange-600";
      case "offline": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-purple-500/10 text-purple-600";
      case "in_progress": return "bg-orange-500/10 text-orange-600";
      case "delivered": return "bg-green-500/10 text-green-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const activeOrders = assignedOrders?.filter(
    (order) => order.status === "assigned" || order.status === "in_progress"
  ) || [];

  const completedOrders = assignedOrders?.filter(
    (order) => order.status === "delivered"
  ) || [];

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
                <span className="text-sm text-muted-foreground ml-2">Driver</span>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <RoleSwitcher currentRole="driver" />
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Driver Dashboard</h1>
              <p className="text-muted-foreground">Manage your deliveries and earnings</p>
            </div>
            {driverLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(driver?.status || "offline")}>
                  {driver?.status || "offline"}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deliveries</p>
                    <p className="text-2xl font-bold">{driver?.totalDeliveries || 0}</p>
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
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">R{Number(driver?.totalEarnings || 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold">{activeOrders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Toggle your availability for new orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={driver?.status === "available" ? "default" : "outline"}
                  onClick={() => updateStatusMutation.mutate({ status: "available" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-status-available"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Available
                </Button>
                <Button
                  variant={driver?.status === "busy" ? "default" : "outline"}
                  onClick={() => updateStatusMutation.mutate({ status: "busy" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-status-busy"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Busy
                </Button>
                <Button
                  variant={driver?.status === "offline" ? "secondary" : "outline"}
                  onClick={() => updateStatusMutation.mutate({ status: "offline" })}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-status-offline"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Offline
                </Button>
              </div>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Active Orders
            </h2>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active orders. Set yourself as available to receive orders.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <Card key={order.id} className="overflow-visible">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{order.orderNumber}</span>
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {order.deliveryAddress}
                          </p>
                          {order.deliveryNotes && (
                            <p className="text-sm text-muted-foreground italic">
                              Note: {order.deliveryNotes}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-primary">
                              Total: R{Number(order.total).toFixed(2)}
                            </span>
                            <span className="text-green-600">
                              Your earnings: R{Number(order.driverEarnings || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`, '_blank')}
                            data-testid={`button-navigate-${order.id}`}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Navigate
                          </Button>
                          {order.status === "assigned" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "in_progress" })}
                              disabled={updateOrderMutation.isPending}
                              data-testid={`button-start-${order.id}`}
                            >
                              Start Delivery
                            </Button>
                          )}
                          {order.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "delivered" })}
                              disabled={updateOrderMutation.isPending}
                              data-testid={`button-complete-${order.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completed Today
            </h2>
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed deliveries yet today.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {completedOrders.slice(0, 5).map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">#{order.orderNumber}</span>
                          <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                        </div>
                        <span className="font-medium text-green-600">
                          +R{Number(order.driverEarnings || 0).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
