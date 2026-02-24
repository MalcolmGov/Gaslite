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
            <GasliteLogo size="sm" showFlame />
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
            <p className="text-sm font-semibold text-primary mb-1">GASLITE (PTY) LTD</p>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-terms-title">Driver Terms &amp; Conditions</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: February 2026</p>

            <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Definitions</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">For purposes of this Agreement:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong className="text-foreground">"Gaslite"</strong> means Gaslite (Pty) Ltd, a company registered in the Republic of South Africa.</li>
                  <li><strong className="text-foreground">"Platform"</strong> means the Gaslite mobile application, website, and related technology systems.</li>
                  <li><strong className="text-foreground">"Driver"</strong> means an independent contractor registered to perform LPG cylinder delivery services via the Platform.</li>
                  <li><strong className="text-foreground">"Customer"</strong> means a person or entity requesting LPG delivery services through the Platform.</li>
                  <li><strong className="text-foreground">"Delivery Services"</strong> means the collection and transport of LPG gas cylinders from an authorised supplier to a Customer.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Nature of the Relationship</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  2.1 The Driver is engaged as an independent contractor. Nothing in this Agreement constitutes an employment relationship, partnership, joint venture, or agency between the Driver and Gaslite.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-2">2.2 The Driver:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Is not entitled to employee benefits, leave, UIF, PAYE deductions, or any statutory employment protections.</li>
                  <li>Is responsible for their own tax obligations, including income tax and VAT (if applicable).</li>
                  <li>Controls their own working hours and availability.</li>
                  <li>Is not guaranteed any minimum number of delivery assignments.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  2.3 The Driver may perform services for other entities, provided such services do not conflict with this Agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Eligibility &amp; Registration</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">To qualify as a Driver, you must:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Be at least 21 years of age.</li>
                  <li>Hold a valid South African driver's licence.</li>
                  <li>Hold a valid Professional Driving Permit (PDP) where required.</li>
                  <li>Maintain valid vehicle registration documentation.</li>
                  <li>Provide accurate personal and banking information.</li>
                  <li>Pass any identity verification or background checks required by Gaslite.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Gaslite reserves the right to reject or revoke registration at its sole discretion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Platform Subscription Fee</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  4.1 A monthly platform subscription fee of <strong className="text-foreground">R39.00</strong> is payable by all active Drivers.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-2">4.2 The subscription fee provides access to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Order allocation technology</li>
                  <li>GPS tracking systems</li>
                  <li>Customer matching</li>
                  <li>Settlement processing</li>
                  <li>Driver support services</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  4.3 The subscription fee shall be deducted from the Driver's first settlement in each calendar month.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  4.4 Failure to maintain the subscription fee may result in account suspension.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Compensation &amp; Settlement</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  5.1 Drivers receive a commission per completed delivery based on the cylinder size delivered:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li><strong className="text-foreground">9kg cylinder</strong> — R80.00 per delivery</li>
                  <li><strong className="text-foreground">19kg cylinder</strong> — R200.00 per delivery</li>
                  <li><strong className="text-foreground">48kg cylinder</strong> — R500.00 per delivery</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  5.2 Commission rates are subject to change at the sole discretion of Gaslite. Drivers will be notified in advance of any changes to commission rates.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-2">5.3 Compensation is confirmed only once:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>The delivery is completed and marked successful.</li>
                  <li>Customer payment has cleared.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-2">5.4 Settlement Terms:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Weekly (Fridays), or</li>
                  <li>Monthly (last business day)</li>
                  <li>Minimum payout threshold: R100.00</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-2">5.5 Gaslite may deduct:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Platform subscription fees</li>
                  <li>Refunds or chargebacks</li>
                  <li>Penalties for fraud or misconduct</li>
                  <li>Regulatory fines caused by Driver negligence</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  5.6 Gaslite reserves the right to adjust commission rates. Updated rates will be communicated to Drivers and reflected on the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Delivery Standards &amp; Performance</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">Drivers agree to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Accept and complete assigned deliveries promptly.</li>
                  <li>Deliver within a 10km radius unless otherwise agreed.</li>
                  <li>Maintain professional conduct at all times.</li>
                  <li>Keep GPS location active while online.</li>
                  <li>Follow customer instructions where reasonable and lawful.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Gaslite may use performance metrics, ratings, and service-level standards to determine order allocation.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Repeated failure to meet performance standards may result in suspension.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. LPG Transport Compliance &amp; Safety</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  7.1 LPG cylinders constitute dangerous goods under South African law.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-2">7.2 The Driver agrees to comply with:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>The National Road Traffic Act</li>
                  <li>The Hazardous Substances Act</li>
                  <li>SANS 10231 and applicable dangerous goods transport regulations</li>
                  <li>Any other applicable South African legislation</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-2">7.3 The Driver must ensure:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Vehicle suitability for LPG transport</li>
                  <li>Adequate ventilation</li>
                  <li>Secure cylinder storage</li>
                  <li>No smoking policy during transport</li>
                  <li>Fire extinguisher available in vehicle</li>
                  <li>Compliance with maximum allowable load limits</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Gaslite may inspect vehicles and documentation at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Vehicle &amp; Insurance Requirements</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">8.1 The Driver must maintain:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Roadworthy vehicle</li>
                  <li>Valid licence disc</li>
                  <li>Commercial vehicle insurance covering delivery use</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mb-2">8.2 Gaslite shall not be liable for:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Vehicle damage</li>
                  <li>Accidents</li>
                  <li>Injury</li>
                  <li>Theft</li>
                  <li>Mechanical failure</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Indemnity</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  The Driver indemnifies and holds Gaslite, its directors, officers, and affiliates harmless from and against any claims, damages, losses, fines, penalties, legal costs, or liabilities arising from:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>The Driver's negligence or misconduct</li>
                  <li>Breach of this Agreement</li>
                  <li>Violation of safety regulations</li>
                  <li>Injury or property damage during delivery</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">To the maximum extent permitted by law:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Gaslite's total liability arising from the use of the Platform shall not exceed the total subscription fees paid by the Driver in the preceding three (3) months.</li>
                  <li>Gaslite shall not be liable for indirect, incidental, or consequential damages.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Non-Circumvention &amp; Platform Protection</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">Drivers may not:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Solicit Customers outside the Platform</li>
                  <li>Accept direct cash payments from Customers introduced via Gaslite</li>
                  <li>Share customer contact information for off-platform arrangements</li>
                  <li>Copy or reverse engineer Platform technology</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Violation may result in immediate termination and legal action.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Data Protection &amp; POPIA Compliance</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  12.1 By using the Platform, the Driver consents to the collection and processing of personal data, including GPS location data, for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Order matching</li>
                  <li>Performance monitoring</li>
                  <li>Platform improvement</li>
                  <li>Regulatory compliance</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  12.2 Data will be handled in accordance with the Protection of Personal Information Act (POPIA).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">13. Suspension &amp; Termination</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Gaslite may suspend or terminate a Driver account for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-2">
                  <li>Repeated late deliveries</li>
                  <li>Customer safety complaints</li>
                  <li>Fraudulent activity</li>
                  <li>Failure to maintain documentation</li>
                  <li>Regulatory non-compliance</li>
                  <li>Non-payment of subscription fees</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Drivers may terminate their registration at any time by written notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">14. Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  14.1 Any disputes shall first be addressed through Gaslite's internal complaint process.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  14.2 If unresolved, parties agree to attempt mediation prior to litigation.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  14.3 If mediation fails, disputes shall be subject to the jurisdiction of the courts of the Republic of South Africa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">15. Force Majeure</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Gaslite shall not be liable for delays or failure to perform due to events beyond its reasonable control, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Civil unrest</li>
                  <li>Load shedding</li>
                  <li>Fuel shortages</li>
                  <li>Supply chain disruptions</li>
                  <li>Platform outages</li>
                  <li>Acts of God</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">16. Modifications</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  Gaslite reserves the right to amend these Terms at any time. Material changes will be communicated via email or Platform notification.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Continued use of the Platform constitutes acceptance of revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">17. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This Agreement is governed by the laws of the Republic of South Africa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">18. Acceptance</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By registering and continuing to use the Gaslite Platform, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions.
                </p>
              </section>

              <section className="border-t border-border pt-6 mt-8">
                <p className="text-sm text-muted-foreground">
                  For support: <span className="text-primary">support@gaslite.co.za</span>
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
