import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Phone, User, ArrowRight, Flame, Truck, Shield, Clock } from "lucide-react";
import { insertUserProfileSchema } from "@shared/schema";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";

const customerOnboardingSchema = insertUserProfileSchema
  .pick({ firstName: true, lastName: true, phone: true, address: true })
  .extend({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    phone: z.string().min(10, "Enter a valid SA phone number (e.g. 082 123 4567)").max(15),
    address: z.string().min(5, "Please enter your full delivery address"),
  });

type CustomerOnboardingData = z.infer<typeof customerOnboardingSchema>;

const benefits = [
  { icon: Truck, title: "Fast Delivery", desc: "Straight to your door" },
  { icon: Shield, title: "Safe & Certified", desc: "SABS approved cylinders" },
  { icon: Clock, title: "Track Live", desc: "Real-time order tracking" },
];

export default function CustomerOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

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
      const payload = {
        ...data,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      };
      const res = await apiRequest("POST", "/api/onboarding/customer", payload);
      return res.json();
    },
    onSuccess: () => {
      localStorage.removeItem("gaslite_intent");
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
          <div className="flex items-center justify-between gap-4 h-16">
            <GasliteLogo size="sm" />
            <div className="flex items-center gap-3 flex-wrap">
              <ThemeToggle />
              <Button variant="ghost" size="sm" data-testid="button-logout" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flame className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-onboarding-title">Welcome to Gaslite</h1>
          <p className="text-muted-foreground">
            Let's set up your account so we can deliver gas straight to your door.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-3 rounded-md bg-muted/50" data-testid={`benefit-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-xs font-medium">{title}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Details</CardTitle>
            <CardDescription>We need a few details to get you started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => onboardMutation.mutate(data))} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Sipho" className="pl-9" {...field} data-testid="input-onboard-firstname" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Ndlovu" {...field} data-testid="input-onboard-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="082 123 4567" className="pl-9" {...field} data-testid="input-onboard-phone" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Delivery Address</FormLabel>
                      <FormControl>
                        <GooglePlacesAutocomplete
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            setCoordinates(null);
                          }}
                          onSelect={(address, _placeId, coords) => {
                            field.onChange(address);
                            if (coords) setCoordinates(coords);
                          }}
                          placeholder="42 Long Street, Cape Town, 8001"
                          data-testid="input-onboard-address"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">You can change this for each order.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={onboardMutation.isPending}
                  data-testid="button-complete-onboarding"
                >
                  {onboardMutation.isPending ? "Setting up your account..." : "Get Started"}
                  {!onboardMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to Gaslite's Terms of Service and Privacy Policy.
        </p>
      </main>
    </div>
  );
}
