import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { User, Truck, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Driver } from "@shared/schema";

const allRoles = [
  { key: "customer", label: "Customer", icon: User },
  { key: "driver", label: "Driver", icon: Truck },
  { key: "admin", label: "Admin", icon: Shield },
] as const;

export function RoleSwitcher({ currentRole }: { currentRole: string }) {
  const queryClient = useQueryClient();

  const { data: driverData } = useQuery<Driver>({
    queryKey: ["/api/driver/me"],
    retry: false,
  });

  const switchRole = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest("POST", "/api/user/switch-role", { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver"] });
    },
  });

  const availableRoles = allRoles.filter(({ key }) => {
    if (key === "customer") return true;
    if (key === "driver") return !!driverData;
    if (key === "admin") return currentRole === "admin";
    return false;
  });

  if (availableRoles.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5" data-testid="role-switcher">
      {availableRoles.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          size="sm"
          variant={currentRole === key ? "default" : "ghost"}
          className="toggle-elevate"
          onClick={() => switchRole.mutate(key)}
          disabled={switchRole.isPending}
          data-testid={`button-switch-role-${key}`}
        >
          <Icon className="h-3.5 w-3.5 mr-1" />
          {label}
        </Button>
      ))}
    </div>
  );
}
