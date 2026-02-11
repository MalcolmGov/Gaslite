import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapPin, Phone, User, ArrowRight, Sparkles } from "lucide-react";
import type { User as AuthUser } from "@shared/models/auth";

const customerOnboardingSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(10, "Enter a valid SA phone number (e.g. 082 123 4567)"),
  address: z.string().min(5, "Delivery address is required"),
});

type CustomerOnboardingData = z.infer<typeof customerOnboardingSchema>;

export default function CustomerOnboarding({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomerOnboardingData>({
    resolver: zodResolver(customerOnboardingSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: "",
      address: "",
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async (data: CustomerOnboardingData) => {
      const res = await apiRequest("POST", "/api/onboarding/customer", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Welcome to Gaslite!", description: "Your account is all set up." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <GasliteLogo size="sm" />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-onboarding-title">Welcome to Gaslite</h1>
          <p className="text-muted-foreground">
            Let's set up your account so we can deliver gas straight to your door.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Details</CardTitle>
            <CardDescription>We need a few details to get you started.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((data) => onboardMutation.mutate(data))} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Sipho"
                      className="pl-9"
                      {...form.register("firstName")}
                      data-testid="input-onboard-firstname"
                    />
                  </div>
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Ndlovu"
                    {...form.register("lastName")}
                    data-testid="input-onboard-lastname"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="082 123 4567"
                    className="pl-9"
                    {...form.register("phone")}
                    data-testid="input-onboard-phone"
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Default Delivery Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="42 Long Street, Cape Town, 8001"
                    className="pl-9"
                    {...form.register("address")}
                    data-testid="input-onboard-address"
                  />
                </div>
                <p className="text-xs text-muted-foreground">You can change this for each order.</p>
                {form.formState.errors.address && (
                  <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={onboardMutation.isPending}
                data-testid="button-complete-onboarding"
              >
                {onboardMutation.isPending ? "Setting up..." : "Get Started"}
                {!onboardMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
