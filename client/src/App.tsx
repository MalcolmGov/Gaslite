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
import CustomerHome from "@/pages/customer/home";
import DriverDashboard from "@/pages/driver/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import { useQuery } from "@tanstack/react-query";
import type { UserProfile } from "@shared/schema";

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

function AuthenticatedRouter() {
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  if (authLoading || (user && profileLoading)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/apply" component={ApplyPage} />
        <Route component={LandingPage} />
      </Switch>
    );
  }

  const role = profile?.role || "customer";

  if (role === "admin") {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/apply" component={ApplyPage} />
        <Route component={AdminDashboard} />
      </Switch>
    );
  }

  if (role === "driver") {
    return (
      <Switch>
        <Route path="/" component={DriverDashboard} />
        <Route path="/apply" component={ApplyPage} />
        <Route component={DriverDashboard} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={CustomerHome} />
      <Route path="/apply" component={ApplyPage} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
