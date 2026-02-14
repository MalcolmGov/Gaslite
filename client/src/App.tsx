import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import ApplyPage from "@/pages/apply";
import SignInPage from "@/pages/auth/signin";
import SignUpPage from "@/pages/auth/signup";
import CustomerHome from "@/pages/customer/home";
import DriverDashboard from "@/pages/driver/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import CustomerOnboarding from "@/pages/onboarding/customer";
import DriverOnboarding from "@/pages/onboarding/driver";
import DriverTerms from "@/pages/driver/terms";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "./lib/queryClient";
import type { UserProfile } from "@shared/schema";
import { PWAInstallBanner } from "@/components/pwa-install";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-64">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    </div>
  );
}

function getIntent(): "customer" | "driver" | null {
  const params = new URLSearchParams(window.location.search);
  const intent = params.get("intent");
  if (intent === "driver") return "driver";
  const stored = localStorage.getItem("gaslite_intent");
  if (stored === "driver") return "driver";
  if (stored === "customer") return "customer";
  return null;
}

function clearIntent() {
  localStorage.removeItem("gaslite_intent");
  const url = new URL(window.location.href);
  url.searchParams.delete("intent");
  window.history.replaceState({}, "", url.pathname);
}

function AuthenticatedRouter() {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/user/profile"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
    retry: 1,
  });

  if (authLoading || (user && profileLoading)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/apply" component={ApplyPage} />
        <Route path="/auth/signin" component={SignInPage} />
        <Route path="/auth/signup" component={SignUpPage} />
        <Route path="/driver/terms" component={DriverTerms} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  const intent = getIntent();

  if (!profile?.onboardingCompleted) {
    if (intent === "driver" || profile?.role === "driver") {
      return <DriverOnboarding />;
    }
    return <CustomerOnboarding />;
  }

  clearIntent();

  const role = profile?.role || "customer";

  if (role === "admin") {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/apply" component={ApplyPage} />
        <Route path="/driver/terms" component={DriverTerms} />
        <Route component={AdminDashboard} />
      </Switch>
    );
  }

  if (role === "driver") {
    return (
      <Switch>
        <Route path="/" component={DriverDashboard} />
        <Route path="/apply" component={ApplyPage} />
        <Route path="/driver/terms" component={DriverTerms} />
        <Route component={DriverDashboard} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={CustomerHome} />
      <Route path="/apply" component={ApplyPage} />
      <Route path="/driver/terms" component={DriverTerms} />
      <Route component={CustomerHome} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthenticatedRouter />
        <PWAInstallBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
