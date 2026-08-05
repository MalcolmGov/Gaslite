import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, ShoppingBag, Truck, Check, Mail, Phone, Zap, MapPin, Shield, Clock, DollarSign, Users, Flame } from "lucide-react";
import { GasliteLogo } from "@/components/gaslite-logo";

type RoleOption = "customer" | "driver";
type IdentifierType = "email" | "phone";

function RoleCard({
  role,
  selected,
  onSelect,
}: {
  role: RoleOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const config = {
    customer: {
      icon: ShoppingBag,
      accentFrom: "from-blue-500",
      accentTo: "to-cyan-400",
      title: "Customer",
      subtitle: "Order gas delivery",
      description: "Get LPG gas cylinders delivered straight to your door, fast and hassle-free.",
      perks: [
        { icon: Flame, text: "Browse 9kg, 19kg & 48kg cylinders" },
        { icon: MapPin, text: "Track your delivery in real time" },
        { icon: Shield, text: "Safe & reliable service" },
      ],
    },
    driver: {
      icon: Truck,
      accentFrom: "from-emerald-500",
      accentTo: "to-teal-400",
      title: "Licensed Operator",
      subtitle: "Grow your LPG business",
      description: "Expand your existing LPG delivery operations with new digital customers through our verified network.",
      perks: [
        { icon: Shield, text: "Licensed operators & compliant vehicles only" },
        { icon: DollarSign, text: "Earn commission per delivery within 10km" },
        { icon: Zap, text: "Structured onboarding with document verification" },
      ],
    },
  };

  const c = config[role];
  const Icon = c.icon;

  return (
    <button
      type="button"
      className={`w-full text-left rounded-md transition-all duration-300 group relative overflow-visible ${
        selected
          ? "ring-2 ring-primary shadow-lg scale-[1.02]"
          : "hover-elevate"
      }`}
      onClick={onSelect}
      data-testid={`card-role-${role}`}
    >
      <Card className="overflow-visible border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className={`absolute inset-0 rounded-md bg-gradient-to-br ${c.accentFrom} ${c.accentTo} opacity-[0.06] ${selected ? "opacity-[0.12]" : "group-hover:opacity-[0.1]"} transition-opacity`} />
          <div className="relative p-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${c.accentFrom} ${c.accentTo} text-white shadow-md transition-transform duration-300 ${
                  selected ? "scale-110" : "group-hover:scale-105"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-base">{c.title}</h3>
                    <p className="text-xs text-muted-foreground">{c.subtitle}</p>
                  </div>
                  {selected && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{c.description}</p>
                <div className="mt-3 space-y-2">
                  {c.perks.map((perk) => (
                    <div key={perk.text} className="flex items-center gap-2.5 text-sm">
                      <perk.icon className={`h-3.5 w-3.5 flex-shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-muted-foreground">{perk.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const { register, isRegistering } = useAuth();

  // Agent referral: keep the ?ref= code until onboarding completes
  const refCode = new URLSearchParams(window.location.search).get("ref");
  if (refCode) {
    localStorage.setItem("gaslite_agent_ref", refCode);
  }

  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [identifierType, setIdentifierType] = useState<IdentifierType>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSelectRole = (role: RoleOption) => {
    setSelectedRole(role);
    localStorage.setItem("gaslite_intent", role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === "driver" && !agreedToTerms) {
      toast({ title: "Terms & Conditions required", description: "Please agree to the Operator Terms & Conditions to continue.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    const payload: { email?: string; phone?: string; password: string } = { password };
    if (identifierType === "email") {
      payload.email = email;
    } else {
      payload.phone = phone;
    }

    try {
      await register(payload);
      navigate("/");
    } catch (err: any) {
      const msg = err?.message || "Registration failed";
      let errorText = "Could not create account";
      try {
        const parsed = JSON.parse(msg.replace(/^\d+:\s*/, ""));
        if (parsed.error) errorText = parsed.error;
      } catch {}
      toast({ title: "Sign up failed", description: errorText, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (selectedRole) {
                  setSelectedRole(null);
                } else {
                  navigate("/");
                }
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-1">
              <GasliteLogo size="sm" animate={false} />
            </div>
            {!selectedRole ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                  Get started with Gaslite
                </h1>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Choose how you'd like to use the platform
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                  {selectedRole === "driver" ? "Create your driver account" : "Create your account"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedRole === "driver"
                    ? "Sign up to start delivering with Gaslite"
                    : "Sign up to order gas delivery to your door"}
                </p>
              </>
            )}
          </div>

          {!selectedRole ? (
            <div className="space-y-4">
              <RoleCard role="customer" selected={false} onSelect={() => handleSelectRole("customer")} />
              <RoleCard role="driver" selected={false} onSelect={() => handleSelectRole("driver")} />

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/auth/signin")}
                    className="text-primary font-semibold hover:underline underline-offset-2"
                    data-testid="link-signin"
                  >
                    Sign in
                  </button>
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>10,000+ users</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>SABS certified</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Fast delivery</span>
                </div>
              </div>
            </div>
          ) : (
            <Card className="shadow-xl shadow-primary/5 border-border/50">
              <CardContent className="pt-6">
                <div className="mb-5">
                  <RoleCard role={selectedRole} selected={true} onSelect={() => {}} />
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">enter your details</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sign up with</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={identifierType === "phone" ? "default" : "outline"}
                        className="flex-1 gap-2"
                        onClick={() => setIdentifierType("phone")}
                        data-testid="button-method-phone"
                      >
                        <Phone className="h-4 w-4" />
                        Mobile
                      </Button>
                      <Button
                        type="button"
                        variant={identifierType === "email" ? "default" : "outline"}
                        className="flex-1 gap-2"
                        onClick={() => setIdentifierType("email")}
                        data-testid="button-method-email"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    </div>
                  </div>

                  {identifierType === "email" ? (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          data-testid="input-email"
                        />
                      </div>
                    </div>
                  ) : (
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
                      <p className="text-xs text-muted-foreground">South African mobile number</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-confirm-password"
                    />
                  </div>

                  {selectedRole === "driver" && (
                    <div className="flex items-start gap-3 py-2">
                      <input
                        type="checkbox"
                        id="driverTerms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-border accent-blue-500 cursor-pointer"
                        data-testid="checkbox-driver-terms"
                      />
                      <label htmlFor="driverTerms" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                        I have read and agree to the{" "}
                        <a
                          href="/driver/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-semibold hover:underline underline-offset-2"
                          data-testid="link-driver-terms"
                        >
                          Operator Terms & Conditions
                        </a>
                      </label>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                    size="lg"
                    disabled={isRegistering || (selectedRole === "driver" && !agreedToTerms)}
                    data-testid="button-signup"
                  >
                    {isRegistering ? "Creating account..." : "Create Account"}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </form>

                <div className="flex items-center gap-3 mt-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("/auth/signin")}
                    className="text-primary font-semibold hover:underline underline-offset-2"
                    data-testid="link-signin"
                  >
                    Sign in
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
