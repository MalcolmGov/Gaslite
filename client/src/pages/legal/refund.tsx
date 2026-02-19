import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4 gap-2">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button size="icon" variant="ghost" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <GasliteLogo size="sm" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: 14 February 2026</p>

        <Card className="overflow-visible">
          <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
              <p className="text-muted-foreground">Gaslite is committed to ensuring customer satisfaction. This Refund Policy outlines the circumstances under which refunds are available, in compliance with the Consumer Protection Act 68 of 2008 (CPA) of South Africa.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Order Cancellation Refunds</h2>
              <p className="text-muted-foreground mb-2">You may cancel your order and receive a full refund under the following conditions:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Pending Orders:</strong> Orders that have not yet been assigned to a driver can be cancelled for a full refund.</li>
                <li><strong>Confirmed Orders:</strong> Orders that have been confirmed but not yet picked up by the driver can be cancelled for a full refund.</li>
                <li><strong>Assigned Orders:</strong> Orders assigned to a driver but not yet picked up can be cancelled for a full refund.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Non-Refundable Orders</h2>
              <p className="text-muted-foreground mb-2">Refunds are generally not available for:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Picked Up Orders:</strong> Once the driver has collected the gas cylinder, the order cannot be cancelled.</li>
                <li><strong>In Transit Orders:</strong> Orders currently being delivered cannot be cancelled.</li>
                <li><strong>Delivered Orders:</strong> Completed deliveries are not eligible for cancellation refunds.</li>
              </ul>
              <p className="text-muted-foreground mt-2">In exceptional circumstances (e.g., defective product, wrong item delivered), please contact our support team.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Refund Processing</h2>
              <p className="text-muted-foreground">Approved refunds are processed within 5-10 business days. Refunds are returned to the original payment method (card) used for the transaction. The service fee and card processing fee may be included in the refund for cancelled orders. Bank processing times may vary — please allow additional time for the refund to reflect in your account.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Defective or Incorrect Products</h2>
              <p className="text-muted-foreground">In accordance with Section 56 of the Consumer Protection Act, if you receive a defective gas cylinder or an incorrect product, you are entitled to a full refund, replacement, or repair. Please contact us within 48 hours of delivery with photographic evidence and your order number. We will arrange for a replacement or full refund at no additional cost.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Failed Deliveries</h2>
              <p className="text-muted-foreground">If a delivery fails due to circumstances within Gaslite's or the driver's control (e.g., driver unavailable, system error), a full refund will be issued automatically. If a delivery fails because you were unavailable at the delivery address or provided an incorrect address, a re-delivery service fee may apply.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. How to Request a Refund</h2>
              <p className="text-muted-foreground mb-2">To request a refund:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Cancel your order through the app before the driver picks it up (automatic refund)</li>
                <li>For other refund requests, email <a href="mailto:support@gaslite.co.za" className="text-primary underline" data-testid="link-email-support">support@gaslite.co.za</a> with your order number and reason</li>
                <li>Include any relevant photos or documentation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Disputes</h2>
              <p className="text-muted-foreground">If you are unsatisfied with the outcome of a refund request, you may escalate the matter to the National Consumer Commission or seek resolution through the relevant consumer protection bodies in South Africa.</p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/legal/terms" className="underline hover:text-foreground" data-testid="link-terms">Terms of Service</Link>
          <Link href="/legal/privacy" className="underline hover:text-foreground" data-testid="link-privacy">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
