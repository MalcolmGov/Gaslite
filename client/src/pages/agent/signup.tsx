import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Phone, HandCoins, Truck, Users } from "lucide-react";
import { GasliteLogo } from "@/components/gaslite-logo";

// One page handles both cases:
// - brand-new visitor: creates the account AND the agent profile in one tap
// - signed-in user who hasn't finished setup: completes the agent profile only
export default function AgentSignupPage() {
  const [, navigate] = useLocation();
  const { user, register, isRegistering } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const needsAccount = !user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isRegistering) return;

    if (needsAccount && password.length < 6) {
      toast({ title: "Password too short", description: "Your password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      localStorage.setItem("gaslite_intent", "agent");
      if (needsAccount) {
        await register({ phone, password, firstName, lastName });
      }
      await apiRequest("POST", "/api/onboarding/agent", { firstName, lastName, phone });
      await queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      localStorage.removeItem("gaslite_intent");
      toast({ title: "Welcome to the team!", description: "Your agent account is ready." });
      navigate("/");
    } catch (err: any) {
      const msg = err?.message || "";
      let errorText = "Something went wrong. Please try again.";
      try {
        const parsed = JSON.parse(msg.replace(/^\d+:\s*/, ""));
        if (parsed.error) errorText = parsed.error;
      } catch {}
      toast({ title: "Could not sign you up", description: errorText, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || isRegistering;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-1">
              <GasliteLogo size="sm" animate={false} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
              Become a Gaslite Agent
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Earn money in your community by signing up drivers and customers for Gaslite
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-card border p-3 space-y-1">
              <Truck className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground leading-tight">Sign up drivers</p>
            </div>
            <div className="rounded-md bg-card border p-3 space-y-1">
              <Users className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground leading-tight">Refer customers</p>
            </div>
            <div className="rounded-md bg-card border p-3 space-y-1">
              <HandCoins className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground leading-tight">Get paid</p>
            </div>
          </div>

          <Card className="shadow-xl shadow-primary/5 border-border/50">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Thabo"
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Surname</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Nkosi"
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="071 234 5678"
                      className="pl-9"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                {needsAccount && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Choose a password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        data-testid="input-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">You'll use your mobile number and this password to sign in.</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                  size="lg"
                  disabled={busy}
                  data-testid="button-agent-signup"
                >
                  {busy ? "Setting up..." : needsAccount ? "Start Earning" : "Finish Setup"}
                </Button>
              </form>

              {needsAccount && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      localStorage.setItem("gaslite_intent", "agent");
                      navigate("/auth/signin");
                    }}
                    className="text-primary font-semibold hover:underline underline-offset-2"
                    data-testid="link-signin"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
