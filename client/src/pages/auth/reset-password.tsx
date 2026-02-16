import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Flame, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = new URLSearchParams(search).get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, password });
      setSuccess(true);
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

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Flame className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold">Gaslite</span>
            </div>
            <h1 className="text-xl font-semibold" data-testid="text-page-title">Invalid reset link</h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or incomplete. Please request a new one.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Button
                className="w-full"
                onClick={() => navigate("/auth/forgot-password")}
                data-testid="button-request-new"
              >
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            {success ? "Password reset" : "Create new password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {success
              ? "Your password has been updated successfully"
              : "Enter your new password below"}
          </p>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-500/10 p-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-success-message">
                  Your password has been changed. You can now sign in with your new password.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/auth/signin")}
                  data-testid="button-go-to-signin"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
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
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
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
                  disabled={isSubmitting}
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
