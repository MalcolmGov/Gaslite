import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");

    if (!orderId) {
      setError("No order found");
      setVerifying(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await apiRequest("POST", `/api/payments/verify/${orderId}`);
        const data = await res.json();
        if (data.status === "paid") {
          setVerified(true);
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        } else if (data.status === "pending") {
          setTimeout(verifyPayment, 2000);
          return;
        } else {
          setError("Payment could not be confirmed. Please contact support.");
        }
      } catch {
        setError("Failed to verify payment. Your order may still be processing.");
      }
      setVerifying(false);
    };

    verifyPayment();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          {verifying ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold" data-testid="text-verifying">Verifying payment...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we confirm your payment with Yoco.
              </p>
            </>
          ) : verified ? (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold" data-testid="text-payment-success">Payment Successful</h2>
              <p className="text-sm text-muted-foreground">
                Your order has been confirmed and a driver will be assigned shortly.
                You'll receive a confirmation email with your order details.
              </p>
              <Button
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-go-to-orders"
              >
                <Package className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
            </>
          ) : (
            <>
              <div className="h-12 w-12 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 text-xl font-bold">!</span>
              </div>
              <h2 className="text-xl font-semibold" data-testid="text-payment-issue">Payment Issue</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="button-return-home"
              >
                Return Home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
