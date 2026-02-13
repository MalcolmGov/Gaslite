import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DriverTerms() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <GasliteLogo size="sm" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-from-terms">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="overflow-visible">
          <CardContent className="pt-8 pb-10 px-6 sm:px-10">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-terms-title">Driver Terms &amp; Conditions</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Agreement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By registering as a driver on the Gaslite platform, you agree to be bound by these Terms and Conditions. Gaslite (Pty) Ltd operates a technology platform that connects customers requiring LPG gas cylinder delivery with independent delivery drivers. You acknowledge that you are an independent contractor and not an employee of Gaslite.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Platform Subscription Fee</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A monthly platform subscription fee of <strong className="text-foreground">R39.00</strong> is charged to all active drivers. This fee covers access to the Gaslite driver platform, order matching technology, GPS tracking services, and customer support. The subscription fee is deducted from your earnings during the weekly or monthly settlement cycle.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Earnings &amp; Settlement</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Drivers earn a portion of each completed delivery. Earnings are calculated per order and are visible in your driver dashboard. Gaslite will net-settle your earnings on a weekly or monthly basis, less the platform subscription fee and any applicable deductions. Settlement payments are made to the bank account you provide during registration.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Settlement periods: Weekly (Friday) or Monthly (last business day)</li>
                  <li>Minimum payout threshold: R100.00</li>
                  <li>The R39.00 monthly subscription is deducted from your first settlement of each calendar month</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Delivery Standards</h2>
                <p className="text-muted-foreground leading-relaxed">
                  As a Gaslite driver, you agree to maintain high delivery standards:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Accept and complete deliveries within 30-60 minutes of assignment</li>
                  <li>Handle LPG gas cylinders safely, following all applicable SABS regulations</li>
                  <li>Maintain a valid driver's licence and roadworthy vehicle at all times</li>
                  <li>Keep your GPS location active while online to enable accurate order matching</li>
                  <li>Treat all customers with respect and professionalism</li>
                  <li>Deliver within a 10km radius of assigned orders</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Vehicle &amp; Safety Requirements</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You must ensure your vehicle is suitable for transporting LPG gas cylinders safely. This includes proper ventilation, secure cylinder storage, and compliance with South African National Standards (SANS) for the transport of dangerous goods. Gaslite reserves the right to inspect your vehicle and documentation at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Insurance &amp; Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for maintaining appropriate vehicle insurance that covers commercial delivery activities. Gaslite is not liable for any accidents, injuries, or damages that occur during deliveries. You accept full responsibility for the safe handling and transport of LPG gas cylinders from the collection point to the customer's delivery address.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Account Suspension &amp; Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Gaslite reserves the right to suspend or terminate your driver account for reasons including but not limited to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                  <li>Repeated late deliveries or failure to meet SLA requirements</li>
                  <li>Customer complaints regarding safety or conduct</li>
                  <li>Fraudulent activity or misuse of the platform</li>
                  <li>Failure to maintain valid documentation (licence, vehicle registration)</li>
                  <li>Non-payment of the platform subscription fee</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Data &amp; Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By using the Gaslite platform, you consent to the collection and use of your personal data, including GPS location data while online, for the purposes of order matching, delivery tracking, and platform improvement. Your data will be handled in accordance with the Protection of Personal Information Act (POPIA) of South Africa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Modifications</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Gaslite reserves the right to modify these Terms and Conditions at any time. Drivers will be notified of material changes via the platform or email. Continued use of the platform after changes constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms and Conditions are governed by the laws of the Republic of South Africa. Any disputes arising from the use of the Gaslite platform shall be subject to the jurisdiction of the courts of South Africa.
                </p>
              </section>

              <section className="border-t border-border pt-6 mt-8">
                <p className="text-sm text-muted-foreground">
                  By continuing to use the Gaslite driver platform, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  For questions or concerns, contact us at <span className="text-primary">support@gaslite.co.za</span>
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
