import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  ChevronRight
} from "lucide-react";
import type { Product, Order } from "@shared/schema";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CustomerHome() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { items: { productId: string; quantity: number }[]; deliveryAddress: string; deliveryNotes?: string }) => {
      return apiRequest("POST", "/api/orders", data);
    },
    onSuccess: () => {
      toast({ title: "Order placed!", description: "Your order has been submitted successfully." });
      setCart([]);
      setShowCheckout(false);
      setDeliveryAddress("");
      setDeliveryNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
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

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const serviceFee = cartTotal > 0 ? 25 : 0;
  const total = cartTotal + serviceFee;

  const handlePlaceOrder = () => {
    if (!deliveryAddress.trim()) {
      toast({ title: "Error", description: "Please enter a delivery address", variant: "destructive" });
      return;
    }
    createOrderMutation.mutate({
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      deliveryAddress,
      deliveryNotes: deliveryNotes || undefined,
    });
  };

  const getStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">GasGo</span>
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
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Hello, {user?.firstName || "there"}!
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
                                    className="h-8 w-8"
                                    onClick={() => removeFromCart(product.id)}
                                    data-testid={`button-remove-${product.id}`}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {cartItem.quantity}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
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

            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Orders
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
              ) : orders?.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet. Place your first order!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders?.slice(0, 5).map((order) => (
                    <Card key={order.id} className="hover-elevate overflow-visible">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">#{order.orderNumber}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.deliveryAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">R{Number(order.total).toFixed(2)}</p>
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
                          <div key={item.product.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Flame className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity} x R{Number(item.product.price).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <p className="font-medium">
                              R{(Number(item.product.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>R{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service Fee</span>
                          <span>R{serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">R{total.toFixed(2)}</span>
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
                            <Input
                              id="address"
                              placeholder="Enter your full address"
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
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
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handlePlaceOrder}
                            disabled={createOrderMutation.isPending}
                            data-testid="button-place-order"
                          >
                            {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
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
    </div>
  );
}
