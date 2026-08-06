import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Truck, CheckCircle2, Share2, Copy } from "lucide-react";

// A deliberately simple 3-step wizard: the agent fills everything in
// on the driver's behalf, standing next to them.
export default function AgentOnboardDriver() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    address: "",
    licenseNumber: "",
    vehicleRegistration: "",
    email: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const step1Valid = form.firstName && form.lastName && form.phone && form.password.length >= 6;
  const step2Valid = form.address && form.licenseNumber && form.vehicleRegistration;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/agent/onboard-driver", form);
      await queryClient.invalidateQueries({ queryKey: ["/api/agent/onboards"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/agent/me"] });
      setDone(true);
    } catch (err: any) {
      let errorText = "Something went wrong. Please try again.";
      try {
        const parsed = JSON.parse((err?.message || "").replace(/^\d+:\s*/, ""));
        if (parsed.error) errorText = parsed.error;
      } catch {}
      toast({ title: "Could not submit the driver", description: errorText, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const loginMessage =
      `Welcome to Gaslite, ${form.firstName}! 🚚\n\n` +
      `Your driver account is ready. Sign in here:\n` +
      `${window.location.origin}/auth/signin\n\n` +
      `Mobile number: ${form.phone}\n` +
      `Password: ${form.password}\n\n` +
      `Gaslite is reviewing your application — you'll be notified once you're approved. ` +
      `Please keep your password safe.\n\n` +
      `Tip: after signing in, tap "Install" (or your browser menu → Add to Home Screen) ` +
      `so Gaslite opens like an app — no need to type the address again.`;

    // wa.me needs the number in international format (27...) with no leading 0
    const waNumber = "27" + form.phone.replace(/[\s\-().]/g, "").replace(/^(\+27|27)/, "0").replace(/^0/, "");

    const shareLogin = () => {
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(loginMessage)}`, "_blank");
    };

    const copyLogin = async () => {
      await navigator.clipboard.writeText(loginMessage);
      toast({ title: "Details copied", description: "Paste them anywhere to share with the driver." });
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h1 className="text-xl font-bold">Driver submitted!</h1>
            <div className="text-sm text-muted-foreground space-y-2 text-left bg-muted/50 rounded-md p-4">
              <p>1. Send the driver their login details (button below).</p>
              <p>2. Gaslite will check the details and approve the driver.</p>
              <p>3. Once approved, your commission appears under <span className="font-semibold text-foreground">My Earnings</span>.</p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
              size="lg"
              onClick={shareLogin}
              data-testid="button-share-login"
            >
              <Share2 className="h-4 w-4 mr-2" /> Send login details on WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={copyLogin} data-testid="button-copy-login">
              <Copy className="h-4 w-4 mr-2" /> Copy login details
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate("/")} data-testid="button-back-home">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step > 1 ? setStep(step - 1) : navigate("/"))}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold leading-tight">Sign up a Driver</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>
        <div className="h-1 bg-muted">
          <div className="h-1 bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">Ask the driver for their details</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" value={form.firstName} onChange={set("firstName")} required data-testid="input-driver-first-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Surname</Label>
                  <Input id="lastName" value={form.lastName} onChange={set("lastName")} required data-testid="input-driver-last-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Driver's mobile number</Label>
                <Input id="phone" type="tel" placeholder="071 234 5678" value={form.phone} onChange={set("phone")} required data-testid="input-driver-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Create a password for the driver</Label>
                <Input id="password" type="text" placeholder="At least 6 characters" value={form.password} onChange={set("password")} required minLength={6} data-testid="input-driver-password" />
                <p className="text-xs text-muted-foreground">
                  The driver will sign in with their mobile number and this password. Tell them what it is!
                </p>
              </div>
              <Button className="w-full" size="lg" disabled={!step1Valid} onClick={() => setStep(2)} data-testid="button-step1-next">
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Home address</Label>
                <Input id="address" placeholder="Street, area, city" value={form.address} onChange={set("address")} required data-testid="input-driver-address" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Driver's licence number</Label>
                <Input id="licenseNumber" value={form.licenseNumber} onChange={set("licenseNumber")} required data-testid="input-driver-license" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleRegistration">Vehicle registration</Label>
                <Input id="vehicleRegistration" placeholder="e.g. AB 12 CD GP" value={form.vehicleRegistration} onChange={set("vehicleRegistration")} required data-testid="input-driver-vehicle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="email" type="email" placeholder="Leave blank if none" value={form.email} onChange={set("email")} data-testid="input-driver-email" />
              </div>
              <Button className="w-full" size="lg" disabled={!step2Valid} onClick={() => setStep(3)} data-testid="button-step2-next">
                Next
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="font-semibold">Check everything is correct</h2>
              <div className="text-sm space-y-2 bg-muted/50 rounded-md p-4">
                {[
                  ["Name", `${form.firstName} ${form.lastName}`],
                  ["Mobile", form.phone],
                  ["Password", form.password],
                  ["Address", form.address],
                  ["Licence", form.licenseNumber],
                  ["Vehicle", form.vehicleRegistration],
                  ["Email", form.email || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right break-all">{value}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                size="lg"
                disabled={submitting}
                onClick={handleSubmit}
                data-testid="button-submit-driver"
              >
                {submitting ? "Submitting..." : (<><Check className="h-4 w-4 mr-1" /> Submit Driver</>)}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
