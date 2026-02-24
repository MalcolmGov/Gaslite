import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-2">POPIA Compliant</p>
        <p className="text-sm text-muted-foreground mb-8">Last updated: 14 February 2026</p>

        <Card className="overflow-visible">
          <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">Gaslite (Pty) Ltd ("Gaslite", "we", "us", "our") is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA) and applicable South African legislation. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">We collect the following categories of personal information:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Identity Information:</strong> Full name, email address, mobile phone number</li>
                <li><strong>Location Information:</strong> Delivery address, GPS coordinates (for drivers during active deliveries)</li>
                <li><strong>Payment Information:</strong> Payment card details are processed securely through our payment provider and are not stored on our servers</li>
                <li><strong>Driver Information:</strong> Driver's licence details, vehicle registration, ID document (for driver applications)</li>
                <li><strong>Usage Data:</strong> Order history, app interactions, device information</li>
                <li><strong>Push Notification Tokens:</strong> Device tokens for delivery status notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Purpose of Processing</h2>
              <p className="text-muted-foreground mb-2">We process your personal information for the following purposes, as permitted under POPIA Section 11:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>To create and manage your account</li>
                <li>To process and fulfil delivery orders</li>
                <li>To facilitate payment transactions</li>
                <li>To match customers with nearby drivers</li>
                <li>To send order confirmations, delivery updates, and service notifications</li>
                <li>To verify driver applications and ensure compliance with regulations</li>
                <li>To improve our services and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Lawful Basis for Processing</h2>
              <p className="text-muted-foreground">Under POPIA, we process your information based on: (a) your consent, (b) the necessity to perform a contract with you (processing orders), (c) compliance with legal obligations, and (d) our legitimate interests in operating and improving the platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
              <p className="text-muted-foreground mb-2">We share personal information only as follows:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Between Customers and Drivers:</strong> Limited information (name, phone number, delivery address) is shared to facilitate deliveries</li>
                <li><strong>Payment Processors:</strong> Card details are shared with our payment processor for transaction processing</li>
                <li><strong>Service Providers:</strong> We use third-party services for email notifications (Gmail API), mapping (Google Maps), and cloud storage (Google Cloud)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our legal rights</li>
              </ul>
              <p className="text-muted-foreground mt-2">We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
              <p className="text-muted-foreground">We implement appropriate technical and organisational measures to protect your personal information, including encryption of data in transit (HTTPS/TLS), secure password hashing (bcrypt), encrypted session management, and access controls. However, no method of electronic transmission or storage is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground">We retain your personal information for as long as your account is active and as needed to provide our services. Order records are retained for tax and legal compliance purposes. You may request deletion of your account and associated data, subject to legal retention requirements.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Your Rights Under POPIA</h2>
              <p className="text-muted-foreground mb-2">As a data subject under POPIA, you have the right to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Access your personal information held by us</li>
                <li>Request correction of inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to the processing of your personal information</li>
                <li>Withdraw consent for processing</li>
                <li>Lodge a complaint with the Information Regulator</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking</h2>
              <p className="text-muted-foreground">We use session cookies to maintain your login state and provide a seamless experience. We do not use third-party tracking cookies or advertising trackers. Our service worker may cache content locally on your device for offline functionality.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
              <p className="text-muted-foreground">Our Service is not intended for children under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal information, we will take steps to delete such information.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Information Officer</h2>
              <p className="text-muted-foreground">In accordance with POPIA, our Information Officer can be contacted at <a href="mailto:privacy@gaslite.co.za" className="text-primary underline" data-testid="link-email-privacy">privacy@gaslite.co.za</a>. You may also contact the Information Regulator at <a href="https://inforegulator.org.za" className="text-primary underline" target="_blank" rel="noopener noreferrer" data-testid="link-info-regulator">inforegulator.org.za</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
              <p className="text-muted-foreground">We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the platform. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
            </section>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link href="/legal/terms" className="underline hover:text-foreground" data-testid="link-terms">Terms of Service</Link>
          <Link href="/legal/refund" className="underline hover:text-foreground" data-testid="link-refund">Refund Policy</Link>
        </div>
      </main>
    </div>
  );
}
