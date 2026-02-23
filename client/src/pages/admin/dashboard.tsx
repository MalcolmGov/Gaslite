import { useState, Fragment } from "react";
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
  Users,
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
  Map,
  Search,
  TrendingUp,
  UserCheck,
  UserX,
  ShoppingBag,
  Wallet,
  Banknote,
  Calendar,
  Gift,
  Rocket,
  ToggleLeft,
  ToggleRight,
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

interface CustomerSignup {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  address: string | null;
  onboardingCompleted: boolean;
  createdAt: string | null;
  orderCount: number;
  totalSpent: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("orders");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerRoleFilter, setCustomerRoleFilter] = useState<"all" | "customer" | "driver" | "admin">("all");
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

  const { data: customers, isLoading: customersLoading } = useQuery<CustomerSignup[]>({
    queryKey: ["/api/admin/customers"],
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery<{
    totalOrders: number;
    totalRevenue: number;
    activeDrivers: number;
    pendingApplications: number;
  }>({
    queryKey: ["/api/admin/stats"],
  });

  const [earningsWeekOffset, setEarningsWeekOffset] = useState(0);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  interface DeliveryItem {
    productSize: string;
    quantity: number;
    commission: number;
  }
  interface DeliveryDetail {
    orderId: string;
    orderNumber: string;
    deliveredAt: string;
    items: DeliveryItem[];
    commission: string;
  }
  interface DriverEarningRow {
    driverId: string;
    driverName: string;
    phone: string | null;
    bankName: string | null;
    accountNumber: string | null;
    status: string;
    weekDeliveries: number;
    weekEarnings: string;
    allTimeEarnings: string;
    deliveries: DeliveryDetail[];
    settlement: {
      id: string;
      status: string;
      paidAt: string | null;
      notes: string | null;
    } | null;
  }
  interface EarningsResponse {
    drivers: DriverEarningRow[];
    week: {
      start: string;
      end: string;
      offset: number;
    };
    summary: {
      weekTotal: string;
      grandTotal: string;
      totalDrivers: number;
    };
  }

  const { data: earningsData, isLoading: earningsLoading } = useQuery<EarningsResponse>({
    queryKey: [`/api/admin/driver-earnings?weekOffset=${earningsWeekOffset}`],
    enabled: selectedTab === "earnings",
    refetchInterval: selectedTab === "earnings" ? 30000 : false,
  });

  interface LaunchSpecialData {
    launchSpecialActive: boolean;
    foundingDriverLimit: number;
    referralLimitPerDriver: number;
    subscriptionFeeActive: boolean;
    totalFoundingDrivers: number;
    totalReferredDrivers: number;
    totalExemptDrivers: number;
    totalDrivers: number;
  }

  const { data: launchSpecialData, isLoading: launchSpecialLoading } = useQuery<LaunchSpecialData>({
    queryKey: ["/api/admin/launch-special"],
    enabled: selectedTab === "launch-special",
  });

  const toggleLaunchSpecialMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/admin/launch-special", data);
    },
    onSuccess: () => {
      toast({ title: "Setting updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/launch-special"] });
    },
    onError: () => {
      toast({ title: "Failed to update setting", variant: "destructive" });
    },
  });

  const markSettlementMutation = useMutation({
    mutationFn: async (data: { driverId: string; weekStart: string; weekEnd: string; totalEarnings: string; deliveryCount: number; status: string }) => {
      return apiRequest("POST", "/api/admin/settlements/mark", data);
    },
    onSuccess: () => {
      toast({ title: "Settlement updated" });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/driver-earnings?weekOffset=${earningsWeekOffset}`] });
    },
    onError: () => {
      toast({ title: "Failed to update settlement", variant: "destructive" });
    },
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
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <GasliteLogo size="sm" />
              <Badge variant="outline">Admin</Badge>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
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
            <p className="text-muted-foreground">Manage orders, drivers, applications, and customers</p>
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

          {false && (slaBreachedOrders.length > 0 || slaWarningOrders.length > 0) && (
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
                      {slaWarningOrders.length > 0 && <span className="text-yellow-600 font-medium">{slaWarningOrders.length} at risk</span>}
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
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-7 gap-1">
                <TabsTrigger value="orders" data-testid="tab-orders" className="shrink-0">
                  <Package className="h-4 w-4 mr-1.5" />
                  <span>Orders</span>
                  {pendingOrders.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{pendingOrders.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="customers" data-testid="tab-customers" className="shrink-0">
                  <Users className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Customers</span>
                  <span className="sm:hidden">Cust.</span>
                </TabsTrigger>
                <TabsTrigger value="applications" data-testid="tab-applications" className="shrink-0">
                  <FileText className="h-4 w-4 mr-1.5" />
                  <span>Apps</span>
                  {pendingApplications.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{pendingApplications.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="drivers" data-testid="tab-drivers" className="shrink-0">
                  <Truck className="h-4 w-4 mr-1.5" />
                  <span>Drivers</span>
                </TabsTrigger>
                <TabsTrigger value="earnings" data-testid="tab-earnings" className="shrink-0">
                  <Wallet className="h-4 w-4 mr-1.5" />
                  <span>Earnings</span>
                </TabsTrigger>
                <TabsTrigger value="driver-map" data-testid="tab-driver-map" className="shrink-0">
                  <Map className="h-4 w-4 mr-1.5" />
                  <span>Map</span>
                </TabsTrigger>
                <TabsTrigger value="launch-special" data-testid="tab-launch-special" className="shrink-0">
                  <Rocket className="h-4 w-4 mr-1.5" />
                  <span>Launch</span>
                </TabsTrigger>
              </TabsList>
            </div>

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

            <TabsContent value="customers" className="space-y-4">
              {(() => {
                const allCustomers = customers || [];
                const filteredCustomers = allCustomers.filter(c => {
                  const matchesRole = customerRoleFilter === "all" || c.role === customerRoleFilter;
                  const searchLower = customerSearch.toLowerCase();
                  const matchesSearch = !customerSearch || 
                    (c.firstName?.toLowerCase().includes(searchLower)) ||
                    (c.lastName?.toLowerCase().includes(searchLower)) ||
                    (c.email?.toLowerCase().includes(searchLower)) ||
                    (c.phone?.includes(customerSearch));
                  return matchesRole && matchesSearch;
                });

                const totalCustomerRole = allCustomers.filter(c => c.role === "customer").length;
                const totalDriverRole = allCustomers.filter(c => c.role === "driver").length;
                const completedOnboarding = allCustomers.filter(c => c.onboardingCompleted).length;
                const withOrders = allCustomers.filter(c => c.orderCount > 0).length;

                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekStart = new Date(todayStart);
                weekStart.setDate(weekStart.getDate() - 7);
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                const signupsToday = allCustomers.filter(c => c.createdAt && new Date(c.createdAt) >= todayStart).length;
                const signupsThisWeek = allCustomers.filter(c => c.createdAt && new Date(c.createdAt) >= weekStart).length;
                const signupsThisMonth = allCustomers.filter(c => c.createdAt && new Date(c.createdAt) >= monthStart).length;

                return (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Sign-ups</p>
                              <p className="text-2xl font-bold" data-testid="text-total-signups">{allCustomers.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Today / Week / Month</p>
                              <p className="text-2xl font-bold" data-testid="text-signup-trend">
                                {signupsToday} / {signupsThisWeek} / {signupsThisMonth}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Onboarded</p>
                              <p className="text-2xl font-bold" data-testid="text-onboarded">{completedOnboarding} / {allCustomers.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Have Ordered</p>
                              <p className="text-2xl font-bold" data-testid="text-with-orders">{withOrders}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <CardTitle>All Sign-ups</CardTitle>
                            <CardDescription>
                              {allCustomers.length} total users — {totalCustomerRole} customers, {totalDriverRole} drivers
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Search name, email, phone..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background"
                                data-testid="input-customer-search"
                              />
                            </div>
                            <Select value={customerRoleFilter} onValueChange={(v) => setCustomerRoleFilter(v as any)}>
                              <SelectTrigger className="w-[130px]" data-testid="select-role-filter">
                                <SelectValue placeholder="All Roles" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="customer">Customers</SelectItem>
                                <SelectItem value="driver">Drivers</SelectItem>
                                <SelectItem value="admin">Admins</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {customersLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            <p>No users found</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredCustomers.map((customer) => (
                              <div key={customer.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border border-border" data-testid={`card-customer-${customer.id}`}>
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium text-sm" data-testid={`text-customer-name-${customer.id}`}>
                                        {customer.firstName && customer.lastName
                                          ? `${customer.firstName} ${customer.lastName}`
                                          : "Not onboarded"}
                                      </p>
                                      <Badge variant="outline" className="text-xs">
                                        {customer.role}
                                      </Badge>
                                      {customer.onboardingCompleted ? (
                                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Onboarded
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                                          <UserX className="h-3 w-3 mr-1" />
                                          Incomplete
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                      {customer.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="h-3 w-3" />
                                          {customer.email}
                                        </span>
                                      )}
                                      {customer.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {customer.phone}
                                        </span>
                                      )}
                                      {customer.createdAt && (
                                        <span className="flex items-center gap-1">
                                          <CalendarDays className="h-3 w-3" />
                                          {new Date(customer.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}
                                        </span>
                                      )}
                                    </div>
                                    {customer.address && (
                                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{customer.address}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm shrink-0 sm:text-right">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Orders</p>
                                    <p className="font-medium" data-testid={`text-customer-orders-${customer.id}`}>{customer.orderCount}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Spent</p>
                                    <p className="font-medium" data-testid={`text-customer-spent-${customer.id}`}>R{customer.totalSpent.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
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

            <TabsContent value="earnings" className="space-y-4">
              {earningsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : earningsData ? (
                <>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEarningsWeekOffset(earningsWeekOffset - 1)}
                      data-testid="button-prev-week"
                    >
                      <ChevronDown className="h-4 w-4 mr-1 rotate-90" /> Previous
                    </Button>
                    <div className="text-center">
                      <p className="text-sm font-semibold" data-testid="text-week-range">
                        {new Date(earningsData.week.start).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })} – {new Date(earningsData.week.end).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {earningsWeekOffset === 0 ? "Current Week" : earningsWeekOffset === -1 ? "Last Week" : `${Math.abs(earningsWeekOffset)} weeks ${earningsWeekOffset < 0 ? "ago" : "ahead"}`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEarningsWeekOffset(earningsWeekOffset + 1)}
                      disabled={earningsWeekOffset >= 0}
                      data-testid="button-next-week"
                    >
                      Next <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card className="overflow-visible">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Week Total</p>
                            <p className="text-2xl font-bold" data-testid="text-admin-week-total">R{earningsData.summary.weekTotal}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="overflow-visible">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">All Time</p>
                            <p className="text-2xl font-bold" data-testid="text-admin-grand-total">R{earningsData.summary.grandTotal}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Weekly Settlement
                      </CardTitle>
                      <CardDescription>
                        Friday-to-Thursday earnings cycle. Click a driver row to see delivery details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {earningsData.drivers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No drivers yet</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Driver</th>
                                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Deliveries</th>
                                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Earnings</th>
                                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Payout</th>
                                <th className="text-center py-3 px-2 font-medium text-muted-foreground w-8"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {earningsData.drivers
                                .sort((a, b) => Number(b.weekEarnings) - Number(a.weekEarnings))
                                .map(driver => (
                                <Fragment key={driver.driverId}>
                                  <tr
                                    className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setExpandedDriver(expandedDriver === driver.driverId ? null : driver.driverId)}
                                    data-testid={`row-driver-earnings-${driver.driverId}`}
                                  >
                                    <td className="py-3 px-2">
                                      <div className="font-medium" data-testid={`text-driver-name-${driver.driverId}`}>{driver.driverName}</div>
                                      <div className="text-xs text-muted-foreground sm:hidden">{driver.phone || "-"}</div>
                                    </td>
                                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell" data-testid={`text-driver-phone-${driver.driverId}`}>{driver.phone || "-"}</td>
                                    <td className="py-3 px-2 text-center" data-testid={`text-driver-deliveries-${driver.driverId}`}>{driver.weekDeliveries}</td>
                                    <td className="py-3 px-2 text-right font-bold" data-testid={`text-driver-week-${driver.driverId}`}>
                                      {Number(driver.weekEarnings) > 0 ? (
                                        <span className="text-green-600">R{driver.weekEarnings}</span>
                                      ) : (
                                        <span className="text-muted-foreground">R0.00</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      {driver.settlement?.status === "paid" ? (
                                        <Badge variant="default" className="bg-green-600" data-testid={`badge-settlement-${driver.driverId}`}>
                                          <CheckCircle className="h-3 w-3 mr-1" /> Paid
                                        </Badge>
                                      ) : driver.settlement?.status === "processing" ? (
                                        <Badge variant="secondary" data-testid={`badge-settlement-${driver.driverId}`}>
                                          <Clock className="h-3 w-3 mr-1" /> Processing
                                        </Badge>
                                      ) : Number(driver.weekEarnings) > 0 ? (
                                        <Badge variant="outline" className="text-amber-600 border-amber-600" data-testid={`badge-settlement-${driver.driverId}`}>
                                          <AlertTriangle className="h-3 w-3 mr-1" /> Pending
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      {expandedDriver === driver.driverId ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </td>
                                  </tr>
                                  {expandedDriver === driver.driverId && (
                                    <tr>
                                      <td colSpan={6} className="bg-muted/30 px-4 py-4">
                                        {driver.deliveries.length === 0 ? (
                                          <p className="text-sm text-muted-foreground text-center py-2">No deliveries this week</p>
                                        ) : (
                                          <div className="space-y-3">
                                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Deliveries this week</div>
                                            {driver.deliveries.map(del => (
                                              <div key={del.orderId} className="flex items-center justify-between p-2 rounded bg-background border border-border">
                                                <div>
                                                  <span className="font-mono text-xs">{del.orderNumber}</span>
                                                  <span className="text-xs text-muted-foreground ml-2">
                                                    {new Date(del.deliveredAt).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
                                                  </span>
                                                  <div className="text-xs text-muted-foreground mt-0.5">
                                                    {del.items.map(i => `${i.quantity}x ${i.productSize} (R${i.commission})`).join(", ")}
                                                  </div>
                                                </div>
                                                <span className="font-bold text-green-600">R{del.commission}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {driver.bankName && (
                                          <div className="mt-3 p-2 rounded bg-background border border-border text-xs">
                                            <span className="text-muted-foreground">Bank: </span>
                                            <span className="font-medium">{driver.bankName}</span>
                                            {driver.accountNumber && (
                                              <>
                                                <span className="text-muted-foreground ml-3">Acc: </span>
                                                <span className="font-medium">{driver.accountNumber}</span>
                                              </>
                                            )}
                                          </div>
                                        )}

                                        {Number(driver.weekEarnings) > 0 && driver.settlement?.status !== "paid" && (
                                          <div className="mt-3 flex gap-2">
                                            {driver.settlement?.status !== "processing" && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  markSettlementMutation.mutate({
                                                    driverId: driver.driverId,
                                                    weekStart: earningsData.week.start,
                                                    weekEnd: earningsData.week.end,
                                                    totalEarnings: driver.weekEarnings,
                                                    deliveryCount: driver.weekDeliveries,
                                                    status: "processing",
                                                  });
                                                }}
                                                data-testid={`button-mark-processing-${driver.driverId}`}
                                              >
                                                <Clock className="h-3 w-3 mr-1" /> Mark Processing
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              className="bg-green-600 hover:bg-green-700"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                markSettlementMutation.mutate({
                                                  driverId: driver.driverId,
                                                  weekStart: earningsData.week.start,
                                                  weekEnd: earningsData.week.end,
                                                  totalEarnings: driver.weekEarnings,
                                                  deliveryCount: driver.weekDeliveries,
                                                  status: "paid",
                                                });
                                              }}
                                              data-testid={`button-mark-paid-${driver.driverId}`}
                                            >
                                              <CheckCircle className="h-3 w-3 mr-1" /> Mark as Paid
                                            </Button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-border">
                                <td colSpan={3} className="py-3 px-2 font-bold">Total ({earningsData.summary.totalDrivers} drivers)</td>
                                <td className="py-3 px-2 text-right font-bold text-green-600">R{earningsData.summary.weekTotal}</td>
                                <td colSpan={2}></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Commission Rate Card</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">9kg Cylinder</p>
                          <p className="text-lg font-bold">R80</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">19kg Cylinder</p>
                          <p className="text-lg font-bold">R200</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">48kg Cylinder</p>
                          <p className="text-lg font-bold">R500</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Per delivery per cylinder. Rates may change.</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Failed to load earnings data
                  </CardContent>
                </Card>
              )}
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

            <TabsContent value="launch-special" className="space-y-4">
              {launchSpecialLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : launchSpecialData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Rocket className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-founding-count">{launchSpecialData.totalFoundingDrivers}</p>
                            <p className="text-xs text-muted-foreground">Founding Drivers</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          of {launchSpecialData.foundingDriverLimit} spots
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Gift className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-referred-count">{launchSpecialData.totalReferredDrivers}</p>
                            <p className="text-xs text-muted-foreground">Referred Drivers</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <UserCheck className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-exempt-count">{launchSpecialData.totalExemptDrivers}</p>
                            <p className="text-xs text-muted-foreground">Fee-Exempt Drivers</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-500/10">
                            <Users className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold" data-testid="text-total-driver-count">{launchSpecialData.totalDrivers}</p>
                            <p className="text-xs text-muted-foreground">Total Drivers</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Launch Special Settings</CardTitle>
                      <CardDescription>
                        Control the driver referral program and subscription fee settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Rocket className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Launch Special</p>
                            <p className="text-sm text-muted-foreground">
                              First {launchSpecialData.foundingDriverLimit} drivers skip subscription fee and can refer others
                            </p>
                          </div>
                        </div>
                        <Button
                          variant={launchSpecialData.launchSpecialActive ? "default" : "outline"}
                          size="sm"
                          data-testid="button-toggle-launch-special"
                          disabled={toggleLaunchSpecialMutation.isPending}
                          onClick={() => {
                            toggleLaunchSpecialMutation.mutate({
                              launchSpecialActive: !launchSpecialData.launchSpecialActive,
                            });
                          }}
                        >
                          {launchSpecialData.launchSpecialActive ? (
                            <>
                              <ToggleRight className="h-4 w-4 mr-2" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-2" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <Banknote className="h-5 w-5 text-amber-500" />
                          <div>
                            <p className="font-medium">Subscription Fee (R39/month)</p>
                            <p className="text-sm text-muted-foreground">
                              Charge non-exempt drivers the monthly platform fee
                            </p>
                          </div>
                        </div>
                        <Button
                          variant={launchSpecialData.subscriptionFeeActive ? "default" : "outline"}
                          size="sm"
                          data-testid="button-toggle-subscription-fee"
                          disabled={toggleLaunchSpecialMutation.isPending}
                          onClick={() => {
                            toggleLaunchSpecialMutation.mutate({
                              subscriptionFeeActive: !launchSpecialData.subscriptionFeeActive,
                            });
                          }}
                        >
                          {launchSpecialData.subscriptionFeeActive ? (
                            <>
                              <ToggleRight className="h-4 w-4 mr-2" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-2" />
                              Inactive
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <p className="text-sm font-medium">How the Referral Program Works</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>The first {launchSpecialData.foundingDriverLimit} approved drivers become "Founding Drivers" with no subscription fee</li>
                          <li>Each founding driver gets a referral code (GL-XXXXXX) and can refer up to {launchSpecialData.referralLimitPerDriver} drivers</li>
                          <li>Referred drivers also skip the subscription fee</li>
                          <li>New drivers enter a referral code during sign-up (optional)</li>
                          <li>Turning off the launch special stops new founding driver sign-ups but existing benefits remain</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Failed to load launch special data</p>
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
