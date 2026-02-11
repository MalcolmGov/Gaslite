import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Flame, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const [, navigate] = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ identifier, password });
      navigate("/");
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      let errorText = "Invalid credentials";
      try {
        const parsed = JSON.parse(msg.replace(/^\d+:\s*/, ""));
        if (parsed.error) errorText = parsed.error;
      } catch {}
      toast({ title: "Sign in failed", description: errorText, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
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
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Mobile Number</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@example.com or 071 234 5678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  data-testid="input-identifier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
                data-testid="button-signin"
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/auth/signup")}
                className="text-blue-500 font-medium hover:underline"
                data-testid="link-signup"
              >
                Sign up
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
