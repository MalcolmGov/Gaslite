import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Flame, ArrowLeft, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err: any) {
      let errorText = "Something went wrong. Please try again.";
      try {
        const parsed = JSON.parse(err?.message?.replace(/^\d+:\s*/, "") || "");
        if (parsed.error) errorText = parsed.error;
      } catch {}
      toast({ title: "Error", description: errorText, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/auth/signin")}
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
          <h1 className="text-xl font-semibold" data-testid="text-page-title">
            {submitted ? "Check your email" : "Forgot password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {submitted
              ? "We've sent a password reset link to your email"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            {submitted ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-blue-500/10 p-4">
                    <Mail className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-success-message">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, you'll receive an email with instructions to reset your password. Check your spam folder if you don't see it.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/auth/signin")}
                  data-testid="button-back-to-signin"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}

            {!submitted && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <button
                  onClick={() => navigate("/auth/signin")}
                  className="text-blue-500 font-medium hover:underline"
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
  );
}
