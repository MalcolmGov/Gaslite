import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            <GasliteLogo size="sm" showFlame />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: 14 February 2026</p>

        <Card className="overflow-visible">
          <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">By accessing or using the Gaslite platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all the terms and conditions, you may not access or use the Service. Gaslite is operated by Gaslite (Pty) Ltd, a company registered in the Republic of South Africa.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
              <p className="text-muted-foreground">Gaslite provides an on-demand LPG gas cylinder delivery platform that connects customers with independent delivery drivers. We facilitate the ordering, payment, and delivery of LPG gas cylinders (9kg, 19kg, and 48kg) within supported areas in South Africa. Gaslite acts as an intermediary platform and does not manufacture, store, or directly sell LPG gas.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground">You must register an account to use our Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate and complete information during registration. Gaslite reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Orders and Payment</h2>
              <p className="text-muted-foreground">All orders are subject to availability and confirmation. Prices are displayed in South African Rand (ZAR) and include VAT where applicable. A service fee of R29.00 is included in all product prices. Card payments incur a processing fee of 2.6% plus 15% VAT on the processing fee. Payment is processed at the time of order placement. Gaslite accepts card payments only — no cash on delivery.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Order Cancellation</h2>
              <p className="text-muted-foreground">Customers may cancel orders before the driver has picked up the gas cylinder. Orders that have already been picked up or are in transit cannot be cancelled. Refunds for cancelled orders will be processed according to our Refund Policy. Gaslite reserves the right to cancel orders due to safety concerns, unavailability, or suspected fraudulent activity.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Delivery</h2>
              <p className="text-muted-foreground">Delivery times are estimates and may vary based on driver availability, traffic, and other factors. Drivers operate as independent contractors and are matched to orders based on proximity (within a 10km radius). You must provide an accurate delivery address and be available to receive the delivery. Gaslite is not liable for delays caused by factors beyond our control.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Operator Terms</h2>
              <p className="text-muted-foreground">Operators using the Gaslite platform are independent contractors, not employees of Gaslite. Operators must hold valid dangerous goods licences, maintain compliant LPG transport vehicles, and comply with all applicable South African road, transport, and dangerous goods regulations. Operators are subject to a monthly platform subscription fee of R39.00. Operators must handle LPG cylinders in accordance with safety regulations set out by the South African Bureau of Standards (SABS) and relevant legislation.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Safety and Liability</h2>
              <p className="text-muted-foreground">LPG gas is a hazardous substance. Users accept all risks associated with the handling, storage, and use of LPG gas cylinders. Gaslite provides safety guidelines but is not liable for accidents, injuries, or damages arising from the improper handling or use of LPG gas. Users must comply with all applicable safety regulations and local by-laws regarding LPG gas storage and use.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
              <p className="text-muted-foreground">All content, trademarks, logos, and intellectual property on the Gaslite platform are owned by Gaslite (Pty) Ltd. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p className="text-muted-foreground">These Terms are governed by and construed in accordance with the laws of the Republic of South Africa, including the Consumer Protection Act 68 of 2008 and the Electronic Communications and Transactions Act 25 of 2002. Any disputes shall be subject to the jurisdiction of the courts of South Africa.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
              <p className="text-muted-foreground">For questions about these Terms, contact us at <a href="mailto:support@gaslite.co.za" className="text-primary underline" data-testid="link-email-support">support@gaslite.co.za</a>.</p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/legal/privacy" className="underline hover:text-foreground" data-testid="link-privacy">Privacy Policy</Link>
          <Link href="/legal/refund" className="underline hover:text-foreground" data-testid="link-refund">Refund Policy</Link>
        </div>
      </main>
    </div>
  );
}
