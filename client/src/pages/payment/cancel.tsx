import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId") || localStorage.getItem("gaslite_pending_order_id");
    localStorage.removeItem("gaslite_pending_order_id");
    if (orderId) {
      apiRequest("POST", `/api/payments/verify/${orderId}`).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <XCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold" data-testid="text-payment-cancelled">Payment Cancelled</h2>
          <p className="text-sm text-muted-foreground">
            You cancelled the payment. Your order has not been placed and no charges were made.
            You can try again anytime.
          </p>
          <Button
            className="w-full"
            onClick={() => setLocation("/")}
            data-testid="button-back-to-shop"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
