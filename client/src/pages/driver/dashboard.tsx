import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { GasliteLogo } from "@/components/gaslite-logo";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  MapPin, 
  Package, 
  DollarSign, 
  Truck, 
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  Flame,
  AlertCircle,
  Power,
  LocateFixed,
  CreditCard,
  Banknote,
  ArrowRight,
  Volume2
} from "lucide-react";
import type { Order, Driver } from "@shared/schema";

type OrderWithDistance = Order & { distance?: number | null };

function useOrderNotifications(
  orders: OrderWithDistance[] | undefined,
  isOnline: boolean,
  showToast: (opts: { title: string; description: string }) => void,
) {
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const markInteracted = () => { hasInteractedRef.current = true; };
    window.addEventListener("click", markInteracted, { once: true });
    window.addEventListener("keydown", markInteracted, { once: true });
    return () => {
      window.removeEventListener("click", markInteracted);
      window.removeEventListener("keydown", markInteracted);
    };
  }, []);

  const playAlert = useCallback(() => {
    if (!hasInteractedRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    if (!isOnline || !orders) {
      previousOrderIdsRef.current = new Set(orders?.map(o => o.id) || []);
      return;
    }

    const currentIds = new Set(orders.map(o => o.id));
    const prevIds = previousOrderIdsRef.current;

    if (prevIds.size > 0) {
      const newOrders = orders.filter(o => !prevIds.has(o.id));

      if (newOrders.length > 0) {
        playAlert();

        newOrders.forEach(order => {
          const distance = order.distance != null ? `${order.distance.toFixed(1)} km away` : "";
          const earnings = `Earn R${(Number(order.total) * 0.15).toFixed(2)}`;
          const desc = [order.deliveryAddress, distance, `R${Number(order.total).toFixed(2)}`, earnings].filter(Boolean).join(" · ");

          showToast({ title: "New Order Available!", description: desc });

          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("New Gaslite Order!", {
                body: `${order.deliveryAddress}${distance ? ` (${distance})` : ""}\nR${Number(order.total).toFixed(2)} - ${earnings}`,
                icon: "/favicon.ico",
                tag: `order-${order.id}`,
              });
            }
          } catch {
            // browser notification not available
          }
        });
      }
    }

    previousOrderIdsRef.current = currentIds;
  }, [orders, isOnline, playAlert, showToast]);
}

const STATUS_STEPS = ["assigned", "picked_up", "in_transit", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
};

function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus as typeof STATUS_STEPS[number]);

  return (
    <div className="flex items-center gap-1 w-full" data-testid="status-stepper">
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`stepper-step-${step}`}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight ${
                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {index < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 mb-4 ${
                  isCompleted ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  const { data: driver, isLoading: driverLoading } = useQuery<Driver>({
    queryKey: ["/api/driver/profile"],
  });

  const { data: assignedOrders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/driver/orders"],
  });

  const isOnline = driver?.status === "available" || driver?.status === "busy";

  const { data: availableOrders, isLoading: availableLoading } = useQuery<OrderWithDistance[]>({
    queryKey: ["/api/driver/available-orders"],
    refetchInterval: isOnline ? 5000 : false,
    enabled: isOnline,
  });

  const sendLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await apiRequest("POST", "/api/driver/location", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch {
          // silently fail location updates
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const startLocationSharing = useCallback(() => {
    sendLocation();
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    locationIntervalRef.current = setInterval(sendLocation, 15000);
  }, [sendLocation]);

  const stopLocationSharing = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (driver?.status === "available" || driver?.status === "busy") {
      startLocationSharing();
    } else {
      stopLocationSharing();
    }
    return () => stopLocationSharing();
  }, [driver?.status, startLocationSharing, stopLocationSharing]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return apiRequest("PATCH", "/api/driver/status", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/available-orders"] });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      return apiRequest("POST", `/api/driver/accept-order/${orderId}`);
    },
    onSuccess: () => {
      toast({ title: "Order accepted!", description: "Navigate to pick up the gas." });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/available-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to accept order";
      toast({ title: "Could not accept order", description: message, variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest("PATCH", `/api/driver/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Order updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/available-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/profile"] });
    },
    onError: () => {
      toast({ title: "Failed to update order", variant: "destructive" });
    },
  });

  const handleGoOnline = useCallback(async () => {
    setIsTogglingOnline(true);
    try {
      const permission = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      await apiRequest("POST", "/api/driver/location", {
        latitude: permission.coords.latitude,
        longitude: permission.coords.longitude,
      });
      updateStatusMutation.mutate({ status: "available" });
      toast({ title: "You're online!", description: "GPS location sharing active. You'll be notified of new orders." });
    } catch {
      toast({
        title: "Location required",
        description: "Please enable location access to go online.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingOnline(false);
    }
  }, [updateStatusMutation, toast]);

  const handleGoOffline = useCallback(() => {
    updateStatusMutation.mutate({ status: "offline" });
    stopLocationSharing();
    toast({ title: "You're offline" });
  }, [updateStatusMutation, stopLocationSharing, toast]);

  useOrderNotifications(availableOrders, isOnline, toast);

  const activeOrders = assignedOrders?.filter(
    (order) =>
      order.status === "assigned" ||
      order.status === "picked_up" ||
      order.status === "in_transit"
  ) || [];

  const completedOrders = assignedOrders?.filter(
    (order) => order.status === "delivered"
  ) || [];

  const getActionButton = (order: Order) => {
    switch (order.status) {
      case "assigned":
        return (
          <Button
            onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "picked_up" })}
            disabled={updateOrderMutation.isPending}
            data-testid={`button-pickup-${order.id}`}
          >
            <Package className="h-4 w-4 mr-2" />
            {updateOrderMutation.isPending ? "Updating..." : "Pick Up Gas"}
          </Button>
        );
      case "picked_up":
        return (
          <Button
            onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "in_transit" })}
            disabled={updateOrderMutation.isPending}
            data-testid={`button-start-delivery-${order.id}`}
          >
            <Truck className="h-4 w-4 mr-2" />
            {updateOrderMutation.isPending ? "Updating..." : "Start Delivery"}
          </Button>
        );
      case "in_transit":
        return (
          <Button
            onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: "delivered" })}
            disabled={updateOrderMutation.isPending}
            data-testid={`button-complete-${order.id}`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {updateOrderMutation.isPending ? "Updating..." : "Mark Delivered"}
          </Button>
        );
      default:
        return null;
    }
  };

  const getNavigateUrl = (order: Order) => {
    if (order.deliveryLatitude && order.deliveryLongitude) {
      return `https://maps.google.com/?daddr=${order.deliveryLatitude},${order.deliveryLongitude}`;
    }
    return `https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-16">
            <div className="flex items-center gap-2">
              <GasliteLogo size="sm" />
              <Badge variant="outline">Driver</Badge>
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-driver-title">Driver Dashboard</h1>
              <p className="text-muted-foreground">Manage your deliveries and earnings</p>
            </div>
            {driverLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="flex items-center gap-3">
                {isOnline && (
                  <div className="flex items-center gap-1.5">
                    <LocateFixed className="h-4 w-4 text-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium" data-testid="text-gps-active">GPS Active</span>
                  </div>
                )}
                <Badge
                  className={
                    isOnline
                      ? "bg-green-500/10 text-green-600"
                      : "bg-muted text-muted-foreground"
                  }
                  data-testid="badge-driver-status"
                >
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="overflow-visible">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deliveries</p>
                    <p className="text-2xl font-bold" data-testid="text-total-deliveries">{driver?.totalDeliveries || 0}</p>
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
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold" data-testid="text-total-earnings">R{Number(driver?.totalEarnings || 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-visible">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold" data-testid="text-active-orders">{activeOrders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle>Go Online</CardTitle>
              <CardDescription>Toggle your availability to receive delivery requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                {isOnline ? (
                  <Button
                    variant="outline"
                    onClick={handleGoOffline}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-go-offline"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Go Offline
                  </Button>
                ) : (
                  <Button
                    onClick={handleGoOnline}
                    disabled={isTogglingOnline || updateStatusMutation.isPending}
                    data-testid="button-go-online"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {isTogglingOnline ? "Requesting Location..." : "Go Online"}
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {isOnline
                    ? "You are receiving delivery requests"
                    : "Go online to start receiving orders"}
                </span>
              </div>
            </CardContent>
          </Card>

          {activeOrders.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Active Delivery
              </h2>
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <Card key={order.id} className="overflow-visible border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg" data-testid={`text-active-order-${order.id}`}>
                            #{order.orderNumber}
                          </CardTitle>
                          <Badge
                            className={
                              order.status === "assigned"
                                ? "bg-purple-500/10 text-purple-600"
                                : order.status === "picked_up"
                                ? "bg-blue-500/10 text-blue-600"
                                : order.status === "in_transit"
                                ? "bg-orange-500/10 text-orange-600"
                                : "bg-muted text-muted-foreground"
                            }
                            data-testid={`badge-order-status-${order.id}`}
                          >
                            {STATUS_LABELS[order.status] || order.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="gap-1"
                            data-testid={`badge-payment-${order.id}`}
                          >
                            {order.paymentMethod === "card" ? (
                              <CreditCard className="h-3 w-3" />
                            ) : (
                              <Banknote className="h-3 w-3" />
                            )}
                            {order.paymentMethod === "card" ? "Card" : "Cash"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <StatusStepper currentStatus={order.status} />

                      <div className="space-y-2">
                        <p className="text-sm flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span data-testid={`text-delivery-address-${order.id}`}>{order.deliveryAddress}</span>
                        </p>
                        {order.deliveryNotes && (
                          <p className="text-sm text-muted-foreground italic pl-5.5">
                            Note: {order.deliveryNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="font-medium">
                          Total: R{Number(order.total).toFixed(2)}
                        </span>
                        <span className="text-green-600 font-medium" data-testid={`text-earnings-active-${order.id}`}>
                          You earn: R{Number(order.driverEarnings || 0).toFixed(2)}
                        </span>
                        {order.estimatedDeliveryTime && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{order.estimatedDeliveryTime} min
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap pt-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open(getNavigateUrl(order), "_blank")}
                          data-testid={`button-navigate-${order.id}`}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Navigate
                        </Button>
                        {getActionButton(order)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Available Orders
              {(availableOrders?.length || 0) > 0 && (
                <Badge variant="secondary">{availableOrders!.length} new</Badge>
              )}
            </h2>
            {!isOnline ? (
              <Card className="overflow-visible">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium">Go online to see and accept new orders</p>
                </CardContent>
              </Card>
            ) : availableLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-visible">
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !availableOrders?.length ? (
              <Card className="overflow-visible">
                <CardContent className="p-6 text-center">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No available orders right now. New orders will appear here automatically.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <Card key={order.id} className="overflow-visible border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium" data-testid={`text-order-number-${order.id}`}>#{order.orderNumber}</span>
                            <Badge className="bg-yellow-500/10 text-yellow-600">New Order</Badge>
                            {order.distance != null && (
                              <Badge variant="outline" className="gap-1" data-testid={`badge-distance-${order.id}`}>
                                <MapPin className="h-3 w-3" />
                                {order.distance.toFixed(1)} km away
                              </Badge>
                            )}
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
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <span className="font-medium text-primary">
                              Order Total: R{Number(order.total).toFixed(2)}
                            </span>
                            <span className="text-green-600 font-medium">
                              You earn: R{(Number(order.total) * 0.15).toFixed(2)}
                            </span>
                            <Badge variant="outline" className="gap-1">
                              {order.paymentMethod === "card" ? (
                                <CreditCard className="h-3 w-3" />
                              ) : (
                                <Banknote className="h-3 w-3" />
                              )}
                              {order.paymentMethod === "card" ? "Card" : "Cash"}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => acceptOrderMutation.mutate({ orderId: order.id })}
                          disabled={acceptOrderMutation.isPending}
                          data-testid={`button-accept-${order.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {acceptOrderMutation.isPending ? "Accepting..." : "Accept Order"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {activeOrders.length === 0 && ordersLoading && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                My Active Deliveries
              </h2>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-visible">
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completed Deliveries
            </h2>
            {completedOrders.length === 0 ? (
              <Card className="overflow-visible">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No completed deliveries yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {completedOrders.slice(0, 10).map((order) => (
                  <Card key={order.id} className="overflow-visible">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">#{order.orderNumber}</span>
                            <Badge className="bg-green-500/10 text-green-600">Delivered</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{order.deliveryAddress}</p>
                        </div>
                        <span className="font-medium text-green-600" data-testid={`text-earnings-${order.id}`}>
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
