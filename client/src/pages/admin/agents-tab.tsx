import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Landmark, Phone } from "lucide-react";
import type { Agent, Commission, DriverApplication } from "@shared/schema";

type AgentRow = Agent & {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  stats: {
    onboards: { total: number; pending: number; approved: number; rejected: number };
    referredCustomers: number;
    earnings: { pending: number; paid: number };
  };
};

type AgentDetail = {
  agent: Agent;
  onboards: DriverApplication[];
  commissions: Commission[];
};

function AgentDetailPanel({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<AgentDetail>({
    queryKey: [`/api/admin/agents/${agentId}`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const markPaid = useMutation({
    mutationFn: async (commissionIds: string[]) => {
      const res = await apiRequest("POST", "/api/admin/commissions/mark-paid", { commissionIds });
      return res.json();
    },
    onSuccess: (result) => {
      toast({ title: "Marked as paid", description: `${result.updatedCount} commission(s) recorded as paid.` });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/agents/${agentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
    },
    onError: () => {
      toast({ title: "Failed to mark as paid", description: "Please try again.", variant: "destructive" });
    },
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground py-3">Loading...</p>;
  }

  const pendingCommissions = data.commissions.filter((c) => c.status === "pending");
  const pendingTotal = pendingCommissions.reduce((total, c) => total + parseFloat(c.amount), 0);
  const agent = data.agent;

  return (
    <div className="space-y-4 pt-3 border-t mt-3">
      <div className="flex items-center gap-2 text-sm">
        <Landmark className="h-4 w-4 text-muted-foreground" />
        {agent.accountNumber ? (
          <span>
            {agent.bankName} · {agent.accountNumber} · branch {agent.branchCode || "—"} · {agent.accountType || "—"}
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">No bank details yet — agent must add them in the app</span>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Onboarded drivers ({data.onboards.length})</h4>
        {data.onboards.length === 0 && <p className="text-sm text-muted-foreground">None yet</p>}
        <div className="space-y-1">
          {data.onboards.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-sm py-1">
              <span>{o.firstName} {o.lastName} <span className="text-muted-foreground">· {o.phone}</span></span>
              <Badge variant="secondary" className={
                o.status === "approved" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : o.status === "rejected" ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }>
                {o.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Commissions ({data.commissions.length})</h4>
        {data.commissions.length === 0 && <p className="text-sm text-muted-foreground">None yet</p>}
        <div className="space-y-1">
          {data.commissions.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm py-1 gap-2">
              <span className="min-w-0 truncate">{c.description || c.type}</span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="font-medium">R {parseFloat(c.amount).toFixed(2)}</span>
                <Badge variant="secondary" className={c.status === "paid" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}>
                  {c.status}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      </div>

      {pendingCommissions.length > 0 && (
        <Button
          size="sm"
          disabled={markPaid.isPending}
          onClick={() => markPaid.mutate(pendingCommissions.map((c) => c.id))}
          data-testid={`button-mark-paid-${agentId}`}
        >
          {markPaid.isPending ? "Saving..." : `Mark R ${pendingTotal.toFixed(2)} as paid (${pendingCommissions.length})`}
        </Button>
      )}
    </div>
  );
}

export function AdminAgentsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: agents, isLoading } = useQuery<AgentRow[]>({ queryKey: ["/api/admin/agents"] });

  const toggleActive = useMutation({
    mutationFn: async ({ agentId, active }: { agentId: string; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/agents/${agentId}`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
    },
    onError: () => {
      toast({ title: "Failed to update agent", variant: "destructive" });
    },
  });

  const totalPending = (agents || []).reduce((total, a) => total + a.stats.earnings.pending, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Agents</CardTitle>
        <CardDescription>
          {agents?.length ?? 0} agent(s) · R {totalPending.toFixed(2)} in commissions waiting to be paid
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && (!agents || agents.length === 0) && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No agents yet. Share the agent signup link: <span className="font-mono text-foreground">{window.location.origin}/agent</span>
          </p>
        )}
        {agents?.map((agent) => (
          <div key={agent.id} className="rounded-md border p-4" data-testid={`card-agent-${agent.id}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{agent.firstName} {agent.lastName}</p>
                  <Badge variant="secondary" className="font-mono text-[10px]">{agent.referralCode}</Badge>
                  {!agent.active && (
                    <Badge variant="secondary" className="bg-red-500/15 text-red-600 dark:text-red-400">Deactivated</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {agent.phone || agent.email || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive.mutate({ agentId: agent.id, active: !agent.active })}
                  data-testid={`button-toggle-active-${agent.id}`}
                >
                  {agent.active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  data-testid={`button-expand-${agent.id}`}
                >
                  {expandedId === agent.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
              <div className="rounded bg-muted/50 py-2">
                <p className="text-lg font-bold">{agent.stats.onboards.approved}<span className="text-muted-foreground text-sm font-normal">/{agent.stats.onboards.total}</span></p>
                <p className="text-[11px] text-muted-foreground">Drivers approved</p>
              </div>
              <div className="rounded bg-muted/50 py-2">
                <p className="text-lg font-bold">{agent.stats.referredCustomers}</p>
                <p className="text-[11px] text-muted-foreground">Customers referred</p>
              </div>
              <div className="rounded bg-muted/50 py-2">
                <p className="text-lg font-bold">R {agent.stats.earnings.pending.toFixed(0)}</p>
                <p className="text-[11px] text-muted-foreground">Owed</p>
              </div>
              <div className="rounded bg-muted/50 py-2">
                <p className="text-lg font-bold">R {agent.stats.earnings.paid.toFixed(0)}</p>
                <p className="text-[11px] text-muted-foreground">Paid</p>
              </div>
            </div>

            {expandedId === agent.id && <AgentDetailPanel agentId={agent.id} />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
