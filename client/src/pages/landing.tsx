import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Flame, Truck, Clock, Shield, MapPin, CreditCard } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">GasGo</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/apply">
                <Button variant="ghost" data-testid="link-become-driver">
                  Become a Driver
                </Button>
              </a>
              <a href="/api/login">
                <Button data-testid="button-login">
                  Sign In
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="text-primary">Gas Delivery</span>
                    <br />
                    <span className="font-serif italic">to Your Doorstep</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-muted-foreground max-w-lg">
                    Order gas cylinders from the comfort of your home. Fast, reliable delivery within 10km of your location.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="/api/login">
                    <Button size="lg" className="w-full sm:w-auto" data-testid="button-get-started">
                      Order Now
                    </Button>
                  </a>
                  <a href="/apply">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-driver-signup">
                      Join as Driver
                    </Button>
                  </a>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>30-60 min delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Licensed drivers</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/30 rounded-3xl transform rotate-6" />
                  <div className="absolute inset-0 bg-gradient-to-tl from-primary/30 to-transparent rounded-3xl transform -rotate-3" />
                  <div className="relative bg-card rounded-3xl p-8 shadow-xl border border-border h-full flex flex-col items-center justify-center">
                    <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                      <Flame className="h-16 w-16 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Quick & Safe</h3>
                    <p className="text-muted-foreground text-center">
                      Certified gas delivery right to your door
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get gas delivered in three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="hover-elevate">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Flame className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">1. Choose Your Gas</h3>
                  <p className="text-muted-foreground">
                    Select from 9kg, 19kg, or 48kg gas cylinders based on your needs
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">2. Set Delivery Location</h3>
                  <p className="text-muted-foreground">
                    We detect your location and match you with nearby drivers
                  </p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Truck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">3. Track & Receive</h3>
                  <p className="text-muted-foreground">
                    Track your delivery in real-time and pay on delivery
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Why Choose <span className="text-primary">GasGo</span>?
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Fast Delivery</h3>
                      <p className="text-muted-foreground">
                        Get your gas delivered within 30-60 minutes from order
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Verified Drivers</h3>
                      <p className="text-muted-foreground">
                        All drivers are licensed and verified for your safety
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Secure Payment</h3>
                      <p className="text-muted-foreground">
                        Pay safely via card or cash on delivery
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10km</div>
                  <p className="text-sm text-muted-foreground">Delivery Radius</p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">30min</div>
                  <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Available</p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Order?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust GasGo for their gas delivery needs
            </p>
            <a href="/api/login">
              <Button size="lg" variant="secondary" data-testid="button-cta-order">
                Get Started Now
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-muted/50 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Flame className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">GasGo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} GasGo. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="/apply" className="text-sm text-muted-foreground hover:text-foreground">
                Become a Driver
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
