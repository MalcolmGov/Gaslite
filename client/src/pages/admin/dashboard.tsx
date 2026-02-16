import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { GasliteLogo } from "@/components/gaslite-logo";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  MapPin, 
  Package, 
  Truck, 
  LogOut,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Flame,
  User,
  Clock,
  AlertTriangle,
  Timer,
  Mail,
  Phone,
  Car,
  CalendarDays,
  Eye,
  Filter,
  Landmark,
  CreditCard,
  Map
} from "lucide-react";
import { ChatPanel } from "@/components/chat-panel";
import { MessageCircle } from "lucide-react";
import type { Order, DriverApplication, Driver } from "@shared/schema";

const availableDriverIcon = L.divIcon({
  className: "driver-marker-available",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const busyDriverIcon = L.divIcon({
  className: "driver-marker-busy",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const offlineDriverIcon = L.divIcon({
  className: "driver-marker-offline",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#94a3b8;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

type DriverWithApplication = Driver & { application?: DriverApplication };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("orders");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [applicationFilter, setApplicationFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [chatDriverId, setChatDriverId] = useState<string | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    refetchInterval: 30000,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<DriverApplication[]>({
    queryKey: ["/api/admin/driver-applications"],
    refetchInterval: 30000,
  });

  const { data: drivers, isLoading: driversLoading } = useQuery<DriverWithApplication[]>({
    queryKey: ["/api/admin/drivers"],
    refetchInterval: selectedTab === "driver-map" ? 15000 : undefined,
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
    onSuccess: (_, variables) => {
      const action = variables.status === "approved" ? "approved" : "rejected";
      toast({ title: `Application ${action}` });
      setRejectingAppId(null);
      setRejectNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/driver-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ title: "Failed to review application", description: "Please try again.", variant: "destructive" });
    },
  });

  const SLA_THRESHOLD_MINUTES = 60;

  const getOrderAgeMinutes = (order: Order) => {
    if (!order.createdAt) return 0;
    return Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  };

  const getOrderSlaStatus = (order: Order): "within" | "warning" | "breached" => {
    if (order.status === "delivered" || order.status === "cancelled") return "within";
    const age = getOrderAgeMinutes(order);
    if (age > SLA_THRESHOLD_MINUTES) return "breached";
    if (age > 30) return "warning";
    return "within";
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600";
      case "confirmed": return "bg-blue-500/10 text-blue-600";
      case "assigned": return "bg-purple-500/10 text-purple-600";
      case "picked_up": return "bg-indigo-500/10 text-indigo-600";
      case "in_transit": return "bg-orange-500/10 text-orange-600";
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

  const getDriverName = (driverId: string) => {
    const driver = drivers?.find((d) => d.id === driverId);
    if (driver?.application) {
      return `${driver.application.firstName} ${driver.application.lastName}`;
    }
    return `Driver ${driverId.slice(0, 8)}`;
  };

  const pendingOrders = orders?.filter((o) => o.status === "pending") || [];
  const activeOrders = orders?.filter((o) => ["confirmed", "assigned", "picked_up", "in_transit"].includes(o.status)) || [];
  const completedOrders = orders?.filter((o) => o.status === "delivered") || [];
  const slaBreachedOrders = orders?.filter((o) => getOrderSlaStatus(o) === "breached") || [];
  const slaWarningOrders = orders?.filter((o) => getOrderSlaStatus(o) === "warning") || [];

  const pendingApplications = applications?.filter((a) => a.status === "pending") || [];
  const filteredApplications = (applications || [])
    .filter((a) => applicationFilter === "all" || a.status === applicationFilter)
    .sort((a, b) => {
      const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
      return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <GasliteLogo size="sm" />
              <Badge variant="outline">Admin</Badge>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <RoleSwitcher currentRole="admin" />
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
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
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
                    <p className="text-2xl font-bold" data-testid="text-total-orders">{stats?.totalOrders || 0}</p>
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
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold" data-testid="text-total-revenue">R{(stats?.totalRevenue || 0).toFixed(2)}</p>
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
                    <p className="text-2xl font-bold" data-testid="text-active-drivers">{stats?.activeDrivers || 0}</p>
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
                    <p className="text-2xl font-bold" data-testid="text-pending-apps">{stats?.pendingApplications || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {(slaBreachedOrders.length > 0 || slaWarningOrders.length > 0) && (
            <Card className={`overflow-visible ${slaBreachedOrders.length > 0 ? "border-red-500/40" : "border-yellow-500/30"}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${slaBreachedOrders.length > 0 ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
                    <AlertTriangle className={`h-5 w-5 ${slaBreachedOrders.length > 0 ? "text-red-600" : "text-yellow-600"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">SLA Monitor (Target: {SLA_THRESHOLD_MINUTES} min delivery)</p>
                    <p className="text-xs text-muted-foreground">
                      {slaBreachedOrders.length > 0 && <span className="text-red-600 font-medium">{slaBreachedOrders.length} breached (&gt;{SLA_THRESHOLD_MINUTES} min)</span>}
                      {slaBreachedOrders.length > 0 && slaWarningOrders.length > 0 && " · "}
                      {slaWarningOrders.length > 0 && <span className="text-yellow-600 font-medium">{slaWarningOrders.length} at risk (&gt;30 min)</span>}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[...slaBreachedOrders, ...slaWarningOrders].slice(0, 5).map((order) => {
                    const age = getOrderAgeMinutes(order);
                    const sla = getOrderSlaStatus(order);
                    return (
                      <div key={order.id} className={`flex items-center justify-between gap-2 text-sm p-2 rounded-md ${sla === "breached" ? "bg-red-500/5" : "bg-yellow-500/5"}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">#{order.orderNumber}</span>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status.replace("_", " ")}
                          </Badge>
                          <span className="text-muted-foreground text-xs">{order.deliveryAddress}</span>
                        </div>
                        <Badge className={sla === "breached" ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"} data-testid={`badge-sla-${order.id}`}>
                          <Timer className="h-3 w-3 mr-1" />
                          {age >= 60 ? `${Math.floor(age / 60)}h ${age % 60}m` : `${age}m`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="orders" data-testid="tab-orders">
                <Package className="h-4 w-4 mr-2" />
                Orders
                {pendingOrders.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingOrders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="applications" data-testid="tab-applications">
                <FileText className="h-4 w-4 mr-2" />
                Applications
                {pendingApplications.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingApplications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="drivers" data-testid="tab-drivers">
                <Truck className="h-4 w-4 mr-2" />
                Drivers
              </TabsTrigger>
              <TabsTrigger value="driver-map" data-testid="tab-driver-map">
                <Map className="h-4 w-4 mr-2" />
                Map
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>
                    {orders?.length || 0} total orders — {pendingOrders.length} pending, {activeOrders.length} active, {completedOrders.length} delivered
                  </CardDescription>
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
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium" data-testid={`text-order-${order.id}`}>#{order.orderNumber}</span>
                                    <Badge className={getOrderStatusColor(order.status)}>
                                      {order.status.replace("_", " ")}
                                    </Badge>
                                    {order.driverId && (
                                      <Badge variant="outline">
                                        <User className="h-3 w-3 mr-1" />
                                        {getDriverName(order.driverId)}
                                      </Badge>
                                    )}
                                    {(() => {
                                      const sla = getOrderSlaStatus(order);
                                      const age = getOrderAgeMinutes(order);
                                      if (sla === "breached") return (
                                        <Badge className="bg-red-500/10 text-red-600" data-testid={`badge-sla-order-${order.id}`}>
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          SLA Breached ({age >= 60 ? `${Math.floor(age / 60)}h ${age % 60}m` : `${age}m`})
                                        </Badge>
                                      );
                                      if (sla === "warning") return (
                                        <Badge className="bg-yellow-500/10 text-yellow-600" data-testid={`badge-sla-order-${order.id}`}>
                                          <Timer className="h-3 w-3 mr-1" />
                                          At Risk ({age}m)
                                        </Badge>
                                      );
                                      if (order.status === "delivered" || order.status === "cancelled") return (
                                        <Badge className="bg-green-500/10 text-green-600">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Within SLA
                                        </Badge>
                                      );
                                      return null;
                                    })()}
                                  </div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {order.deliveryAddress}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm flex-wrap">
                                    <span className="font-medium">R{Number(order.total).toFixed(2)}</span>
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(order.createdAt!).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} {new Date(order.createdAt!).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    {order.deliveryNotes && (
                                      <span className="text-muted-foreground italic">Note: {order.deliveryNotes}</span>
                                    )}
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
                                      <SelectItem value="picked_up">Picked Up</SelectItem>
                                      <SelectItem value="in_transit">In Transit</SelectItem>
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
                                            {driver.application
                                              ? `${driver.application.firstName} ${driver.application.lastName}`
                                              : `Driver ${driver.id.slice(0, 8)}`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                    data-testid={`button-expand-${order.id}`}
                                  >
                                    {expandedOrder === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              {expandedOrder === order.id && (
                                <OrderItemsDetail orderId={order.id} />
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

            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Driver Applications</CardTitle>
                      <CardDescription>
                        {applications?.length || 0} total — {pendingApplications.length} pending review
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={applicationFilter} onValueChange={(v) => setApplicationFilter(v as any)}>
                        <SelectTrigger className="w-[140px]" data-testid="select-app-filter">
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {applicationFilter === "all" ? "No applications yet" : `No ${applicationFilter} applications`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredApplications.map((app) => (
                        <Card key={app.id} className={`overflow-visible ${app.status === "pending" ? "border-yellow-500/30" : ""}`}>
                          <CardContent className="p-5">
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    app.status === "pending" ? "bg-yellow-500/10" :
                                    app.status === "approved" ? "bg-green-500/10" :
                                    "bg-red-500/10"
                                  }`}>
                                    <User className={`h-5 w-5 ${
                                      app.status === "pending" ? "text-yellow-600" :
                                      app.status === "approved" ? "text-green-600" :
                                      "text-red-600"
                                    }`} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-base" data-testid={`text-applicant-${app.id}`}>
                                        {app.firstName} {app.lastName}
                                      </span>
                                      <Badge className={getApplicationStatusColor(app.status)} data-testid={`badge-app-status-${app.id}`}>
                                        {app.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <CalendarDays className="h-3 w-3" />
                                      Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                                      {app.reviewedAt && (
                                        <span className="ml-2">
                                          — Reviewed {new Date(app.reviewedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                                        </span>
                                      )}
                                    </p>
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
                                      onClick={() => { setRejectingAppId(app.id); setRejectNotes(""); }}
                                      disabled={reviewApplicationMutation.isPending}
                                      data-testid={`button-reject-${app.id}`}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">Email:</span>
                                  <span className="font-medium" data-testid={`text-app-email-${app.id}`}>{app.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span className="font-medium" data-testid={`text-app-phone-${app.id}`}>{app.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">Address:</span>
                                  <span className="font-medium">{app.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">License:</span>
                                  <span className="font-medium" data-testid={`text-app-license-${app.id}`}>{app.licenseNumber}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Car className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">Vehicle:</span>
                                  <span className="font-medium" data-testid={`text-app-vehicle-${app.id}`}>{app.vehicleRegistration}</span>
                                </div>
                              </div>

                              {app.bankName && (
                                <div className="border rounded-md p-3 space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                    <Landmark className="h-3 w-3" />
                                    Banking Details
                                  </p>
                                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Bank:</span>{" "}
                                      <span className="font-medium" data-testid={`text-app-bank-${app.id}`}>{app.bankName}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Branch Code:</span>{" "}
                                      <span className="font-medium" data-testid={`text-app-branch-${app.id}`}>{app.branchCode}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Account No:</span>{" "}
                                      <span className="font-medium" data-testid={`text-app-account-${app.id}`}>{app.accountNumber}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Type:</span>{" "}
                                      <span className="font-medium" data-testid={`text-app-acctype-${app.id}`}>{app.accountType}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2 flex-wrap">
                                {app.licenseDocumentUrl ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(app.licenseDocumentUrl!, '_blank')}
                                    data-testid={`button-view-license-${app.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    License Document
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">No license document</Badge>
                                )}
                                {app.vehicleDocumentUrl ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(app.vehicleDocumentUrl!, '_blank')}
                                    data-testid={`button-view-vehicle-${app.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Vehicle Document
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">No vehicle document</Badge>
                                )}
                              </div>

                              {app.reviewNotes && (
                                <div className="bg-muted/50 rounded-md p-3 text-sm">
                                  <span className="text-muted-foreground font-medium">Review Notes:</span>
                                  <p className="mt-1">{app.reviewNotes}</p>
                                </div>
                              )}

                              {rejectingAppId === app.id && (
                                <div className="border border-red-500/20 rounded-md p-4 space-y-3 bg-red-500/5">
                                  <p className="text-sm font-medium">Provide a reason for rejection (optional):</p>
                                  <Textarea
                                    placeholder="e.g. Missing vehicle documentation, invalid license number..."
                                    value={rejectNotes}
                                    onChange={(e) => setRejectNotes(e.target.value)}
                                    className="text-sm"
                                    data-testid={`textarea-reject-notes-${app.id}`}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        reviewApplicationMutation.mutate(
                                          { applicationId: app.id, status: "rejected", notes: rejectNotes || undefined }
                                        );
                                      }}
                                      disabled={reviewApplicationMutation.isPending}
                                      data-testid={`button-confirm-reject-${app.id}`}
                                    >
                                      Confirm Rejection
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => { setRejectingAppId(null); setRejectNotes(""); }}
                                      data-testid={`button-cancel-reject-${app.id}`}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
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
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Truck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium" data-testid={`text-driver-name-${driver.id}`}>
                                      {driver.application
                                        ? `${driver.application.firstName} ${driver.application.lastName}`
                                        : `Driver ${driver.id.slice(0, 8)}`}
                                    </span>
                                    <Badge className={getDriverStatusColor(driver.status)}>
                                      {driver.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                    <span>{driver.totalDeliveries} deliveries</span>
                                    <span>R{Number(driver.totalEarnings || 0).toFixed(2)} earned</span>
                                    {driver.application && (
                                      <>
                                        <span>{driver.application.phone}</span>
                                        <span>{driver.application.vehicleRegistration}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="default"
                                className="gap-2"
                                data-testid={`button-chat-driver-${driver.id}`}
                                onClick={() => setChatDriverId(chatDriverId === driver.id ? null : driver.id)}
                              >
                                <MessageCircle className="h-4 w-4" />
                                Chat
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="driver-map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Driver Coverage Map
                  </CardTitle>
                  <CardDescription>
                    Live view of driver locations and their 10km delivery radius
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-muted-foreground">Available ({drivers?.filter(d => d.status === "available").length || 0})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-muted-foreground">Busy ({drivers?.filter(d => d.status === "busy").length || 0})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-400" />
                      <span className="text-sm text-muted-foreground">Offline ({drivers?.filter(d => d.status === "offline").length || 0})</span>
                    </div>
                  </div>

                  {driversLoading ? (
                    <Skeleton className="h-[500px] w-full rounded-md" />
                  ) : (() => {
                    const driversWithLocation = drivers?.filter(
                      d => d.currentLatitude && d.currentLongitude
                    ) || [];

                    if (driversWithLocation.length === 0) {
                      return (
                        <div className="text-center py-16">
                          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-2">No driver locations available yet</p>
                          <p className="text-sm text-muted-foreground">Drivers will appear on the map once they go online and share their location.</p>
                        </div>
                      );
                    }

                    const avgLat = driversWithLocation.reduce((sum, d) => sum + Number(d.currentLatitude), 0) / driversWithLocation.length;
                    const avgLng = driversWithLocation.reduce((sum, d) => sum + Number(d.currentLongitude), 0) / driversWithLocation.length;

                    return (
                      <div className="rounded-md overflow-hidden border border-border" style={{ height: "500px" }}>
                        <MapContainer
                          center={[avgLat, avgLng]}
                          zoom={12}
                          style={{ height: "100%", width: "100%" }}
                          scrollWheelZoom={true}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {driversWithLocation.map((driver) => {
                            const lat = Number(driver.currentLatitude);
                            const lng = Number(driver.currentLongitude);
                            const icon = driver.status === "available"
                              ? availableDriverIcon
                              : driver.status === "busy"
                              ? busyDriverIcon
                              : offlineDriverIcon;
                            const driverName = driver.application
                              ? `${driver.application.firstName} ${driver.application.lastName}`
                              : `Driver ${driver.id.slice(0, 8)}`;

                            return (
                              <div key={driver.id}>
                                <Circle
                                  center={[lat, lng]}
                                  radius={10000}
                                  pathOptions={{
                                    color: driver.status === "available" ? "#22c55e" : driver.status === "busy" ? "#f59e0b" : "#94a3b8",
                                    fillColor: driver.status === "available" ? "#22c55e" : driver.status === "busy" ? "#f59e0b" : "#94a3b8",
                                    fillOpacity: 0.06,
                                    weight: 1,
                                    opacity: 0.3,
                                  }}
                                />
                                <Marker position={[lat, lng]} icon={icon}>
                                  <Popup>
                                    <div className="text-sm" data-testid={`popup-driver-${driver.id}`}>
                                      <p className="font-medium">{driverName}</p>
                                      <p className="capitalize">{driver.status}</p>
                                      <p>{driver.totalDeliveries} deliveries</p>
                                      {driver.application?.phone && (
                                        <p>{driver.application.phone}</p>
                                      )}
                                      {driver.application?.vehicleRegistration && (
                                        <p>{driver.application.vehicleRegistration}</p>
                                      )}
                                    </div>
                                  </Popup>
                                </Marker>
                              </div>
                            );
                          })}
                        </MapContainer>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {drivers && drivers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Driver Summary by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="font-medium text-sm">Available</span>
                        </div>
                        <p className="text-2xl font-bold" data-testid="text-available-count">
                          {drivers.filter(d => d.status === "available").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Ready for deliveries</p>
                      </div>
                      <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="font-medium text-sm">Busy</span>
                        </div>
                        <p className="text-2xl font-bold" data-testid="text-busy-count">
                          {drivers.filter(d => d.status === "busy").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Currently on delivery</p>
                      </div>
                      <div className="p-4 rounded-md bg-slate-500/10 border border-slate-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-slate-400" />
                          <span className="font-medium text-sm">Offline</span>
                        </div>
                        <p className="text-2xl font-bold" data-testid="text-offline-count">
                          {drivers.filter(d => d.status === "offline").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Not accepting orders</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {chatDriverId && user && (() => {
        const chatDriver = drivers?.find(d => d.id === chatDriverId);
        const driverName = chatDriver?.application
          ? chatDriver.application.firstName
          : "Driver";
        return (
          <ChatPanel
            threadType="admin_driver"
            threadId={chatDriverId}
            currentUserId={user.id}
            title={`Chat with ${driverName}`}
            onClose={() => setChatDriverId(null)}
          />
        );
      })()}
    </div>
  );
}

function OrderItemsDetail({ orderId }: { orderId: string }) {
  const { data: items, isLoading } = useQuery<Array<{
    id: string;
    productName: string;
    productSize: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>>({
    queryKey: [`/api/admin/orders/${orderId}/items`],
  });

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!items?.length) {
    return <p className="text-sm text-muted-foreground">No items found</p>;
  }

  return (
    <div className="border-t border-border pt-3 mt-1">
      <p className="text-sm font-medium mb-2">Order Items:</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <span>{item.productName}</span>
              <span className="text-muted-foreground">({item.productSize})</span>
              <span className="text-muted-foreground">x{item.quantity}</span>
            </div>
            <span className="font-medium">R{Number(item.totalPrice).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
