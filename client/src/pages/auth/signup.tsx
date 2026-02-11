import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Flame, Eye, EyeOff, ArrowLeft, ShoppingBag, Truck, Check } from "lucide-react";

type RoleOption = "customer" | "driver";

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
      title: "Sign up as Customer",
      description: "Order LPG gas cylinders delivered straight to your door.",
      perks: ["Browse 9kg, 19kg & 48kg cylinders", "Track your delivery in real time", "Safe & reliable service"],
    },
    driver: {
      icon: Truck,
      title: "Sign up as Driver",
      description: "Earn money delivering gas cylinders in your area.",
      perks: ["Flexible hours, be your own boss", "Earn per delivery within 10km", "Quick & simple onboarding"],
    },
  };

  const c = config[role];
  const Icon = c.icon;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        selected
          ? "ring-2 ring-blue-500 border-blue-500"
          : "hover-elevate"
      }`}
      onClick={onSelect}
      data-testid={`card-role-${role}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-md flex items-center justify-center ${
              selected
                ? "bg-blue-500 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base">{c.title}</h3>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
            <ul className="mt-3 space-y-1.5">
              {c.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSelectRole = (role: RoleOption) => {
    setSelectedRole(role);
    localStorage.setItem("gaslite_intent", role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    try {
      await register({ email, password });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
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

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold">Gaslite</span>
          </div>
          {!selectedRole ? (
            <>
              <h1 className="text-xl font-semibold" data-testid="text-page-title">How would you like to use Gaslite?</h1>
              <p className="text-sm text-muted-foreground">Choose an option to get started</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold" data-testid="text-page-title">
                {selectedRole === "driver" ? "Create your driver account" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedRole === "driver"
                  ? "Sign up to start earning as a Gaslite driver"
                  : "Sign up to order gas delivery to your door"}
              </p>
            </>
          )}
        </div>

        {!selectedRole ? (
          <div className="space-y-3">
            <RoleCard role="customer" selected={false} onSelect={() => handleSelectRole("customer")} />
            <RoleCard role="driver" selected={false} onSelect={() => handleSelectRole("driver")} />

            <div className="pt-2 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/auth/signin")}
                className="text-blue-500 font-medium hover:underline"
                data-testid="link-signin"
              >
                Sign in
              </button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <RoleCard role={selectedRole} selected={true} onSelect={() => {}} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>

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
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRegistering}
                  data-testid="button-signup"
                >
                  {isRegistering ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/auth/signin")}
                  className="text-blue-500 font-medium hover:underline"
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
  );
}
