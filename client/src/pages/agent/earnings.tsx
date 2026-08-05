import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Landmark, Truck, Users } from "lucide-react";
import type { Agent, Commission } from "@shared/schema";

type AgentMe = { agent: Agent; stats: { earnings: { pending: number; paid: number } } };
type EarningsData = { commissions: Commission[]; earnings: { pending: number; paid: number } };

export default function AgentEarnings() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: me } = useQuery<AgentMe>({ queryKey: ["/api/agent/me"] });
  const { data } = useQuery<EarningsData>({ queryKey: ["/api/agent/commissions"] });

  const [showBankForm, setShowBankForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bank, setBank] = useState({ bankName: "", branchCode: "", accountNumber: "", accountType: "" });

  const openBankForm = () => {
    setBank({
      bankName: me?.agent.bankName || "",
      branchCode: me?.agent.branchCode || "",
      accountNumber: me?.agent.accountNumber || "",
      accountType: me?.agent.accountType || "",
    });
    setShowBankForm(true);
  };

  const saveBank = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/agent/bank", bank);
      await queryClient.invalidateQueries({ queryKey: ["/api/agent/me"] });
      setShowBankForm(false);
      toast({ title: "Bank details saved", description: "Gaslite will use these to pay you." });
    } catch {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const hasBank = !!me?.agent.accountNumber;

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">My Earnings</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Waiting to be paid</p>
              <p className="text-2xl font-bold" data-testid="text-pending-total">
                R {(data?.earnings.pending ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Already paid</p>
              <p className="text-2xl font-bold" data-testid="text-paid-total">
                R {(data?.earnings.paid ?? 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {!showBankForm ? (
          <Card className={hasBank ? "" : "border-amber-500/50"}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Landmark className={`h-5 w-5 flex-shrink-0 ${hasBank ? "text-muted-foreground" : "text-amber-500"}`} />
              <div className="flex-1 text-sm">
                {hasBank ? (
                  <p className="text-muted-foreground">
                    Paid into <span className="font-medium text-foreground">{me?.agent.bankName}</span> account ending{" "}
                    <span className="font-mono">{me?.agent.accountNumber?.slice(-4)}</span>
                  </p>
                ) : (
                  <p className="font-medium">Add your bank details so Gaslite can pay you</p>
                )}
              </div>
              <Button size="sm" variant={hasBank ? "outline" : "default"} onClick={openBankForm} data-testid="button-bank-details">
                {hasBank ? "Change" : "Add"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-5 space-y-3">
              <h2 className="font-semibold text-sm">Your bank details</h2>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank</Label>
                <Input id="bankName" placeholder="e.g. Capitec" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} data-testid="input-bank-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account number</Label>
                <Input id="accountNumber" inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} data-testid="input-account-number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="branchCode">Branch code</Label>
                  <Input id="branchCode" inputMode="numeric" value={bank.branchCode} onChange={(e) => setBank({ ...bank, branchCode: e.target.value })} data-testid="input-branch-code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account type</Label>
                  <Input id="accountType" placeholder="e.g. Savings" value={bank.accountType} onChange={(e) => setBank({ ...bank, accountType: e.target.value })} data-testid="input-account-type" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowBankForm(false)} data-testid="button-bank-cancel">Cancel</Button>
                <Button className="flex-1" disabled={saving || !bank.bankName || !bank.accountNumber} onClick={saveBank} data-testid="button-bank-save">
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <h2 className="font-semibold text-sm">History</h2>
          {(!data || data.commissions.length === 0) && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Nothing yet. Sign up drivers and share your customer link to start earning!
              </CardContent>
            </Card>
          )}
          {data?.commissions.map((c) => (
            <Card key={c.id} data-testid={`card-commission-${c.id}`}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {c.type === "driver_onboard" ? <Truck className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.description || (c.type === "driver_onboard" ? "Driver onboarded" : "Customer referral")}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R {parseFloat(c.amount).toFixed(2)}</p>
                  <Badge variant="secondary" className={c.status === "paid" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}>
                    {c.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
