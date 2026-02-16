import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { GasliteLogo } from "@/components/gaslite-logo";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Flame, 
  MapPin, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Truck, 
  LogOut,
  Clock,
  Package,
  ChevronRight,
  CheckCircle,
  Phone,
  User,
  Car,
  CreditCard,
  Shield,
  Lock,
  XCircle,
  MessageCircle,
  History,
  Star,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { ChatPanel } from "@/components/chat-panel";
import type { Product, Order, UserProfile } from "@shared/schema";

const driverIcon = L.divIcon({
  className: "driver-marker",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const deliveryIcon = L.divIcon({
  className: "delivery-marker",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface CartItem {
  product: Product;
  quantity: number;
}

interface TrackingData {
  orderId: string;
  status: string;
  estimatedDeliveryTime: number | null;
  pickedUpAt: string | null;
  driverLocation: { latitude: number; longitude: number } | null;
  driverInfo: { firstName: string; lastName: string; phone: string; vehicleRegistration: string } | null;
  deliveryLocation: { latitude: number; longitude: number } | null;
}

interface FrequentProduct {
  productId: string;
  productName: string;
  productSize: string;
  count: number;
}

export default function CustomerHome() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod] = useState<"card">("card");
  const [chatOpen, setChatOpen] = useState(false);

  const { permission: pushPermission, requestPermission } = usePushNotifications(!!user);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  useEffect(() => {
    if (profile?.address && !deliveryAddress) {
      setDeliveryAddress(profile.address);
    }
  }, [profile?.address]);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 10000,
  });

  const { data: frequentProducts, isLoading: frequentLoading } = useQuery<FrequentProduct[]>({
    queryKey: ["/api/orders/frequent-products"],
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentOrders = orders?.filter(o => new Date(o.createdAt!) >= oneWeekAgo) || [];
  const olderOrders = orders?.filter(o => new Date(o.createdAt!) < oneWeekAgo) || [];

  const activeOrder = orders?.find(
    (o) => o.status === "assigned" || o.status === "picked_up" || o.status === "in_transit"
  );

  const { data: trackingData } = useQuery<TrackingData>({
    queryKey: ["/api/orders", activeOrder?.id, "tracking"],
    enabled: !!activeOrder,
    refetchInterval: 5000,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { items: { productId: string; quantity: number }[]; deliveryAddress: string; deliveryLatitude?: number; deliveryLongitude?: number; deliveryNotes?: string; paymentMethod: string }) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.redirectUrl) {
        if (data.id) {
          localStorage.setItem("gaslite_pending_order_id", data.id);
        }
        setCart([]);
        setShowCheckout(false);
        window.location.href = data.redirectUrl;
      } else {
        toast({ title: "Order placed!", description: "Your order has been submitted successfully." });
        setCart([]);
        setShowCheckout(false);
        setDeliveryAddress(profile?.address || "");
        setDeliveryNotes("");
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      toast({ title: "Order cancelled", description: "Your order has been cancelled successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to cancel order.", variant: "destructive" });
    },
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    const qty = Math.max(0, Math.floor(quantity));
    if (qty === 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const isTestOrder = cart.some(item => item.product.size === "Test");
  const serviceFee = cartTotal > 0 ? (isTestOrder ? 1 : 29) : 0;
  const beforeCardFee = cartTotal + serviceFee;
  const cardProcessingFee = Math.round(beforeCardFee * 0.026 * 1.15 * 100) / 100;
  const total = beforeCardFee + cardProcessingFee;

  const handlePlaceOrder = () => {
    if (!deliveryAddress.trim()) {
      toast({ title: "Error", description: "Please enter a delivery address", variant: "destructive" });
      return;
    }
    if (!deliveryCoordinates) {
      toast({ title: "Select an address", description: "Please select an address from the dropdown suggestions so we can locate your delivery", variant: "destructive" });
      return;
    }
    createOrderMutation.mutate({
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      deliveryAddress,
      deliveryLatitude: deliveryCoordinates?.latitude,
      deliveryLongitude: deliveryCoordinates?.longitude,
      deliveryNotes: deliveryNotes || undefined,
      paymentMethod,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600";
      case "confirmed": return "bg-blue-500/10 text-blue-600";
      case "assigned": return "bg-purple-500/10 text-purple-600";
      case "picked_up": return "bg-orange-500/10 text-orange-600";
      case "in_transit": return "bg-orange-500/10 text-orange-600";
      case "delivered": return "bg-green-500/10 text-green-600";
      case "cancelled": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Waiting for driver";
      case "confirmed": return "Order confirmed";
      case "assigned": return "Driver assigned";
      case "picked_up": return "Gas picked up";
      case "in_transit": return "On the way";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "pending": return 1;
      case "assigned": return 2;
      case "picked_up": return 3;
      case "in_transit": return 4;
      case "delivered": return 5;
      default: return 0;
    }
  };

  const stepLabels = ["Order Placed", "Driver Assigned", "Gas Picked Up", "On the Way", "Delivered"];

  const mapCenter: [number, number] = trackingData?.driverLocation
    ? [trackingData.driverLocation.latitude, trackingData.driverLocation.longitude]
    : trackingData?.deliveryLocation
      ? [trackingData.deliveryLocation.latitude, trackingData.deliveryLocation.longitude]
      : [-26.2041, 28.0473];

  const hasMapData = trackingData && (trackingData.driverLocation || trackingData.deliveryLocation);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <GasliteLogo size="sm" />
            <div className="flex items-center gap-4 flex-wrap">
              <RoleSwitcher currentRole="customer" />
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
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Hello, {profile?.firstName || "there"}!
              </h1>
              <p className="text-muted-foreground">
                What gas cylinder would you like delivered today?
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Available Products
              </h2>
              {productsLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-20 w-20 rounded-xl mb-4" />
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {products?.map((product) => {
                    const cartItem = cart.find((item) => item.product.id === product.id);
                    return (
                      <Card key={product.id} className="hover-elevate overflow-visible">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Flame className="h-8 w-8 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">{product.size}</p>
                                <p className="text-lg font-bold text-primary mt-1">
                                  R{Number(product.price).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {cartItem ? (
                                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeFromCart(product.id)}
                                    data-testid={`button-remove-${product.id}`}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium" data-testid={`text-qty-${product.id}`}>
                                    {cartItem.quantity}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => addToCart(product)}
                                    data-testid={`button-add-${product.id}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(product)}
                                  data-testid={`button-add-${product.id}`}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            {activeOrder && (
              <section data-testid="section-live-tracking">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Live Tracking - #{activeOrder.orderNumber}
                </h2>

                <div className="space-y-4">
                  {hasMapData && (
                    <Card className="overflow-visible">
                      <CardContent className="p-0">
                        <div className="rounded-md overflow-hidden" style={{ height: "300px" }} data-testid="map-tracking">
                          <MapContainer
                            center={mapCenter}
                            zoom={14}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={false}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {trackingData.driverLocation && (
                              <Marker
                                position={[trackingData.driverLocation.latitude, trackingData.driverLocation.longitude]}
                                icon={driverIcon}
                              >
                                <Popup>
                                  <span data-testid="popup-driver-location">Driver Location</span>
                                </Popup>
                              </Marker>
                            )}
                            {trackingData.deliveryLocation && (
                              <Marker
                                position={[trackingData.deliveryLocation.latitude, trackingData.deliveryLocation.longitude]}
                                icon={deliveryIcon}
                              >
                                <Popup>
                                  <span data-testid="popup-delivery-location">Delivery Location</span>
                                </Popup>
                              </Marker>
                            )}
                          </MapContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="overflow-visible">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1">
                        {stepLabels.map((label, i) => {
                          const stepNum = i + 1;
                          const currentStep = getStatusStep(activeOrder.status);
                          const isCompleted = currentStep > stepNum;
                          const isCurrent = currentStep === stepNum;
                          return (
                            <div key={label} className="flex items-center flex-1" data-testid={`step-${stepNum}`}>
                              <div className="flex flex-col items-center flex-1">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                  isCompleted ? "bg-green-500 text-white" :
                                  isCurrent ? "bg-primary text-white" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {isCompleted ? <CheckCircle className="h-3 w-3" /> : stepNum}
                                </div>
                                <span className={`text-[10px] mt-1 text-center leading-tight ${
                                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                                }`}>
                                  {label}
                                </span>
                              </div>
                              {i < 4 && (
                                <div className={`h-0.5 flex-1 mx-1 ${
                                  currentStep > stepNum ? "bg-green-500" : "bg-muted"
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {trackingData?.estimatedDeliveryTime && (
                        <p className="text-xs text-muted-foreground mt-2 text-center" data-testid="text-estimated-time">
                          Estimated delivery: ~{trackingData.estimatedDeliveryTime} minutes
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {trackingData?.driverInfo && (
                    <Card className="overflow-visible" data-testid="card-driver-info">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium" data-testid="text-driver-name">
                                {trackingData.driverInfo.firstName} {trackingData.driverInfo.lastName}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1" data-testid="text-driver-phone">
                                  <Phone className="h-3 w-3" />
                                  {trackingData.driverInfo.phone}
                                </span>
                                <span className="flex items-center gap-1" data-testid="text-driver-vehicle">
                                  <Car className="h-3 w-3" />
                                  {trackingData.driverInfo.vehicleRegistration}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              size="default"
                              variant="outline"
                              className="gap-1"
                              data-testid="button-open-chat"
                              onClick={() => setChatOpen(true)}
                            >
                              <MessageCircle className="h-4 w-4" />
                              Chat
                            </Button>
                            <a href={`tel:${trackingData.driverInfo.phone}`} data-testid="link-call-driver">
                              <Button size="default" variant="outline" className="gap-1">
                                <Phone className="h-4 w-4" />
                                Call
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            )}

            {pushPermission === "default" && orders && orders.length > 0 && (
              <Card className="overflow-visible border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Enable Delivery Updates</p>
                        <p className="text-xs text-muted-foreground">Get notified when your driver picks up and delivers your order</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={requestPermission} data-testid="button-enable-notifications">
                      Enable
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {frequentProducts && frequentProducts.length > 0 && products && (
              <section className="mb-6" data-testid="section-frequent-products">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Frequently Purchased
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {frequentProducts.slice(0, 4).map((fp) => {
                    const product = products.find(p => p.id === fp.productId);
                    if (!product || !product.isAvailable) return null;
                    return (
                      <Card key={fp.productId} className="overflow-visible">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
                                <Flame className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate" data-testid={`text-freq-name-${fp.productId}`}>{fp.productName}</p>
                                <p className="text-xs text-muted-foreground">R{Number(product.price).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Ordered {fp.count} time{fp.count !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              data-testid={`button-quick-add-${fp.productId}`}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            <section data-testid="section-recent-orders">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Orders
                <span className="text-sm font-normal text-muted-foreground ml-1">(Past Week)</span>
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
              ) : recentOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{orders?.length === 0 ? "No orders yet. Place your first order!" : "No orders this week."}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const step = getStatusStep(order.status);
                    const isActive = order.status !== "delivered" && order.status !== "cancelled";
                    return (
                      <Card key={order.id} className={`overflow-visible ${isActive ? "border-primary/30" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium" data-testid={`text-order-${order.id}`}>#{order.orderNumber}</span>
                                <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                                  {getStatusLabel(order.status)}
                                </Badge>
                                <Badge variant="outline" className="text-xs" data-testid={`badge-payment-${order.id}`}>
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Card Payment
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.deliveryAddress}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="font-semibold" data-testid={`text-total-${order.id}`}>R{Number(order.total).toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt!).toLocaleDateString()}
                                </p>
                              </div>
                              {["pending", "confirmed", "assigned"].includes(order.status) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-destructive"
                                      data-testid={`button-cancel-order-${order.id}`}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel order #{order.orderNumber}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-testid="button-cancel-dismiss">Keep Order</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => cancelOrderMutation.mutate(order.id)}
                                        className="bg-destructive text-destructive-foreground"
                                        data-testid="button-cancel-confirm"
                                      >
                                        Yes, Cancel Order
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                          {isActive && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center gap-1">
                                {stepLabels.map((label, i) => {
                                  const stepNum = i + 1;
                                  const isCompleted = step > stepNum;
                                  const isCurrent = step === stepNum;
                                  return (
                                    <div key={label} className="flex items-center flex-1">
                                      <div className="flex flex-col items-center flex-1">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                          isCompleted ? "bg-green-500 text-white" :
                                          isCurrent ? "bg-primary text-white" :
                                          "bg-muted text-muted-foreground"
                                        }`}>
                                          {isCompleted ? <CheckCircle className="h-3 w-3" /> : stepNum}
                                        </div>
                                        <span className={`text-[10px] mt-1 text-center leading-tight ${
                                          isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                                        }`}>
                                          {label}
                                        </span>
                                      </div>
                                      {i < 4 && (
                                        <div className={`h-0.5 flex-1 mx-1 ${
                                          step > stepNum ? "bg-green-500" : "bg-muted"
                                        }`} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {order.estimatedDeliveryTime && order.status !== "delivered" && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  Estimated delivery: ~{order.estimatedDeliveryTime} minutes
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-6" data-testid="section-order-history">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Order History
              </h2>
              {olderOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Orders older than a week will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {olderOrders.slice(0, 10).map((order) => (
                    <Card key={order.id} className="overflow-visible">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium" data-testid={`text-history-order-${order.id}`}>#{order.orderNumber}</span>
                              <Badge className={getStatusColor(order.status)} data-testid={`badge-history-status-${order.id}`}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.deliveryAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold" data-testid={`text-history-total-${order.id}`}>R{Number(order.total).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Cart
                  </CardTitle>
                  <CardDescription>
                    {cart.length === 0
                      ? "Your cart is empty"
                      : `${cart.reduce((sum, item) => sum + item.quantity, 0)} items`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Add products to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.product.id} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                  <Flame className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" data-testid={`text-cart-item-name-${item.product.id}`}>{item.product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    R{Number(item.product.price).toFixed(2)} each
                                  </p>
                                </div>
                              </div>
                              <p className="font-medium shrink-0" data-testid={`text-cart-item-total-${item.product.id}`}>
                                R{(Number(item.product.price) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-13">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeFromCart(item.product.id)}
                                data-testid={`button-cart-decrease-${item.product.id}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) updateCartQuantity(item.product.id, val);
                                }}
                                className="w-16 h-8 text-center text-sm"
                                data-testid={`input-cart-quantity-${item.product.id}`}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => addToCart(item.product)}
                                data-testid={`button-cart-increase-${item.product.id}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span data-testid="text-subtotal">R{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery Fee</span>
                          <span data-testid="text-delivery-fee">R{serviceFee.toFixed(2)}</span>
                        </div>
                        {cardProcessingFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Card Processing Fee</span>
                            <span data-testid="text-card-fee">R{cardProcessingFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary" data-testid="text-total">R{total.toFixed(2)}</span>
                        </div>
                      </div>
                      {!showCheckout ? (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => setShowCheckout(true)}
                          data-testid="button-checkout"
                        >
                          Proceed to Checkout
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="address">Delivery Address</Label>
                            <GooglePlacesAutocomplete
                              value={deliveryAddress}
                              onChange={(val) => {
                                setDeliveryAddress(val);
                                setDeliveryCoordinates(null);
                              }}
                              onSelect={(_address, _placeId, coordinates) => {
                                if (coordinates) {
                                  setDeliveryCoordinates(coordinates);
                                }
                              }}
                              placeholder="Start typing your delivery address..."
                              data-testid="input-address"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Any special instructions..."
                              value={deliveryNotes}
                              onChange={(e) => setDeliveryNotes(e.target.value)}
                              data-testid="input-notes"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <div className="flex items-center gap-2 p-2 border border-border rounded-md bg-muted/30">
                              <CreditCard className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Card Payment via Yoco</span>
                            </div>
                            <p className="text-xs text-muted-foreground" data-testid="text-card-fee-info">
                              Card processing fee: 2.6% + 15% VAT applies
                            </p>
                          </div>
                          <div className="space-y-3 p-3 border border-border rounded-md bg-muted/30">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Shield className="h-4 w-4 text-primary" />
                              <span>Secure Payment</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              You'll be redirected to Yoco's secure payment page to complete your card payment.
                              Visa, Mastercard, and American Express accepted.
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              <span>PCI DSS compliant with 3D Secure protection</span>
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handlePlaceOrder}
                            disabled={createOrderMutation.isPending}
                            data-testid="button-place-order"
                          >
                            {createOrderMutation.isPending
                              ? "Redirecting to payment..."
                              : `Pay R${total.toFixed(2)} by Card`}
                          </Button>
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setShowCheckout(false)}
                            data-testid="button-cancel-checkout"
                          >
                            Back
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {activeOrder && user && chatOpen && (
        <ChatPanel
          threadType="order"
          threadId={activeOrder.id}
          currentUserId={user.id}
          title={`Chat - #${activeOrder.orderNumber}`}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
