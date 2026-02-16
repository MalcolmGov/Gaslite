import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";

import { GasliteLogo } from "@/components/gaslite-logo";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  MapPin, 
  Package, 
  Truck, 
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  Navigation2,
  Flame,
  AlertCircle,
  Power,
  LocateFixed,
  CreditCard,
  Map,
  ExternalLink,
  ArrowRight,
  Bell,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { ChatPanel } from "@/components/chat-panel";
import type { Order, Driver } from "@shared/schema";

const driverIcon = L.divIcon({
  className: "driver-nav-marker",
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5)"><div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:6px solid #3b82f6"></div></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const customerIcon = L.divIcon({
  className: "customer-nav-marker",
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.5)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapBoundsUpdater({ driverPos, customerPos }: { driverPos: [number, number] | null; customerPos: [number, number] }) {
  const map = useMap();
  const lastFitRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastFitRef.current < 10000) return;

    const points: [number, number][] = [customerPos];
    if (driverPos) points.push(driverPos);

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      if (!map.getBounds().contains(bounds)) {
        map.fitBounds(bounds, { padding: [40, 40], animate: true });
        lastFitRef.current = now;
      }
    } else if (lastFitRef.current === 0) {
      map.setView(customerPos, 14);
      lastFitRef.current = now;
    }
  }, [map, driverPos, customerPos]);

  return null;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function DeliveryNavigationMap({ order, driverLocation }: { order: Order; driverLocation: { lat: number; lng: number } | null }) {
  const customerPos: [number, number] | null = order.deliveryLatitude && order.deliveryLongitude
    ? [Number(order.deliveryLatitude), Number(order.deliveryLongitude)]
    : null;

  const driverPos: [number, number] | null = driverLocation
    ? [driverLocation.lat, driverLocation.lng]
    : null;

  const distance = useMemo(() => {
    if (!driverPos || !customerPos) return null;
    return haversineDistance(driverPos[0], driverPos[1], customerPos[0], customerPos[1]);
  }, [driverPos, customerPos]);

  const etaMinutes = useMemo(() => {
    if (!distance) return null;
    return Math.max(1, Math.round(distance / 0.5));
  }, [distance]);

  if (!customerPos) {
    return (
      <div className="bg-muted/50 rounded-md p-4 text-center text-sm text-muted-foreground" data-testid="text-no-gps-coords">
        <Map className="h-5 w-5 mx-auto mb-2" />
        No GPS coordinates available for this delivery address
      </div>
    );
  }

  const routeLine = driverPos ? [driverPos, customerPos] : null;

  const getGoogleMapsUrl = () => {
    if (driverPos) {
      return `https://www.google.com/maps/dir/${driverPos[0]},${driverPos[1]}/${customerPos[0]},${customerPos[1]}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${customerPos[0]},${customerPos[1]}`;
  };

  const getWazeUrl = () => {
    return `https://waze.com/ul?ll=${customerPos[0]},${customerPos[1]}&navigate=yes`;
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md overflow-hidden border border-border" style={{ height: "220px" }} data-testid="map-navigation">
        <MapContainer
          center={customerPos}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBoundsUpdater driverPos={driverPos} customerPos={customerPos} />

          {driverPos && (
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          <Marker position={customerPos} icon={customerIcon}>
            <Popup>{order.deliveryAddress}</Popup>
          </Marker>

          {routeLine && (
            <Polyline
              positions={routeLine}
              pathOptions={{ color: "#3b82f6", weight: 3, dashArray: "8, 8", opacity: 0.8 }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-sm">
          {distance !== null ? (
            <>
              <span className="flex items-center gap-1 text-muted-foreground" data-testid="text-nav-distance">
                <Navigation2 className="h-3.5 w-3.5" />
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </span>
              {etaMinutes !== null && (
                <span className="flex items-center gap-1 text-muted-foreground" data-testid="text-nav-eta">
                  <Clock className="h-3.5 w-3.5" />
                  ~{etaMinutes} min
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground text-xs" data-testid="text-awaiting-gps">
              <LocateFixed className="h-3.5 w-3.5 animate-pulse" />
              Awaiting GPS...
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
            data-testid="button-navigate-google"
          >
            <Navigation className="h-4 w-4 mr-1.5" />
            Google Maps
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(getWazeUrl(), "_blank")}
            data-testid="button-navigate-waze"
          >
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Waze
          </Button>
        </div>
      </div>
    </div>
  );
}

type OrderWithDistance = Order & { distance?: number | null };

function useOrderNotifications(
  orders: OrderWithDistance[] | undefined,
  isOnline: boolean,
  showToast: (opts: { title: string; description: string }) => void,
) {
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  const warmUpAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (AC) audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch {
      // audio not available
    }
  }, []);

  const playAlert = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== "running") return;

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(880, now, 0.2);
      playTone(1100, now + 0.25, 0.2);
      playTone(1320, now + 0.5, 0.3);
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
          const desc = [order.deliveryAddress, distance, `R${Number(order.total).toFixed(2)}`].filter(Boolean).join(" · ");

          showToast({ title: "New Order Available!", description: desc });

          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("New Gaslite Order!", {
                body: `${order.deliveryAddress}${distance ? ` (${distance})` : ""}\nR${Number(order.total).toFixed(2)}`,
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

  return { warmUpAudio };
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
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { permission: pushPermission, requestPermission } = usePushNotifications(!!user);

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

  const sendLocationToServer = useCallback(async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastSentRef.current < 8000) return;
    lastSentRef.current = now;
    try {
      await fetch("/api/driver/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
    } catch {
    }
  }, []);

  const sendLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        await sendLocationToServer(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, [sendLocationToServer]);

  const startLocationSharing = useCallback(() => {
    if (!navigator.geolocation) return;

    sendLocation();

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        await sendLocationToServer(latitude, longitude);
      },
      () => {
        sendLocation();
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );

    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    locationIntervalRef.current = setInterval(sendLocation, 10000);
  }, [sendLocation, sendLocationToServer]);

  const stopLocationSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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

  const { warmUpAudio } = useOrderNotifications(availableOrders, isOnline, toast);

  const handleGoOnline = useCallback(async () => {
    warmUpAudio();
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
  }, [updateStatusMutation, toast, warmUpAudio]);

  const handleGoOffline = useCallback(() => {
    updateStatusMutation.mutate({ status: "offline" });
    stopLocationSharing();
    toast({ title: "You're offline" });
  }, [updateStatusMutation, stopLocationSharing, toast]);

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


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 py-2">
            <div className="flex items-center gap-2">
              <GasliteLogo size="sm" />
              <Badge variant="outline">Driver</Badge>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-driver-title">Driver Dashboard</h1>
              <p className="text-muted-foreground">Manage your deliveries</p>
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

          <div className="grid sm:grid-cols-2 gap-4">
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
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Platform Subscription</p>
                    <p className="text-2xl font-bold" data-testid="text-subscription-fee">R39.00<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                  </div>
                </div>
                <Badge variant="outline" data-testid="badge-subscription-status">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                See <a href="/driver/terms" className="underline text-primary">Terms &amp; Conditions</a> for details.
              </p>
            </CardContent>
          </Card>

          {pushPermission === "default" && (
            <Card className="overflow-visible border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Enable Notifications</p>
                      <p className="text-xs text-muted-foreground">Get notified instantly when new delivery requests come in</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={requestPermission} data-testid="button-enable-notifications">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                            <CreditCard className="h-3 w-3" />
                            Card
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
                        {order.estimatedDeliveryTime && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{order.estimatedDeliveryTime} min
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Placed {new Date(order.createdAt!).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} at {new Date(order.createdAt!).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {(() => {
                          const mins = Math.floor((Date.now() - new Date(order.createdAt!).getTime()) / 60000);
                          if (mins < 1) return "just now";
                          if (mins < 60) return `${mins} min ago`;
                          const hrs = Math.floor(mins / 60);
                          return `${hrs}h ${mins % 60}m ago`;
                        })()}
                      </p>

                      <DeliveryNavigationMap order={order} driverLocation={currentLocation} />

                      <div className="flex gap-2 flex-wrap pt-2">
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
                            <Badge variant="outline" className="gap-1">
                              <CreditCard className="h-3 w-3" />
                              Card
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-order-time-${order.id}`}>
                            <Clock className="h-3 w-3" />
                            Placed {new Date(order.createdAt!).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} at {new Date(order.createdAt!).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                            {" · "}
                            {(() => {
                              const mins = Math.floor((Date.now() - new Date(order.createdAt!).getTime()) / 60000);
                              if (mins < 1) return "just now";
                              if (mins < 60) return `${mins} min ago`;
                              const hrs = Math.floor(mins / 60);
                              return `${hrs}h ${mins % 60}m ago`;
                            })()}
                          </p>
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
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.deliveredAt || order.createdAt!).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
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

      {activeOrders.length > 0 && user && (
        <ChatPanel
          threadType="order"
          threadId={activeOrders[0].id}
          currentUserId={user.id}
          title={`Chat - #${activeOrders[0].orderNumber}`}
          collapsed
        />
      )}

      {driver && user && activeOrders.length === 0 && (
        <ChatPanel
          threadType="admin_driver"
          threadId={driver.id}
          currentUserId={user.id}
          title="Admin Support"
          collapsed
        />
      )}
    </div>
  );
}
