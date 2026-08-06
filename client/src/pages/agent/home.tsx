import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, Share2, HandCoins, LogOut, ChevronRight, Copy, Smartphone, Download } from "lucide-react";
import { GasliteLogo } from "@/components/gaslite-logo";
import type { Agent } from "@shared/schema";

// Prominent install card so agents run Gaslite as an app, not a browser tab
function InstallAppCard() {
  const { isInstalled, canPromptNatively, isIOS, promptInstall } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (canPromptNatively) {
      await promptInstall();
    } else {
      setShowHelp(!showHelp);
    }
  };

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Put Gaslite on your home screen</p>
            <p className="text-xs text-muted-foreground">Open the app with one tap — no web address needed</p>
          </div>
          <Button size="sm" onClick={handleInstall} data-testid="button-install-app">
            <Download className="h-4 w-4 mr-1" /> Install
          </Button>
        </div>
        {showHelp && (
          <div className="text-xs text-muted-foreground mt-3 bg-background/60 rounded-md p-3 space-y-1">
            {isIOS ? (
              <>
                <p className="font-medium text-foreground">On iPhone (Safari):</p>
                <p>1. Tap the Share button (square with arrow)</p>
                <p>2. Tap "Add to Home Screen", then "Add"</p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">On Android (Chrome):</p>
                <p>1. Tap the menu (⋮) at the top right</p>
                <p>2. Tap "Add to Home screen" or "Install app"</p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type AgentMe = {
  agent: Agent;
  stats: {
    onboards: { total: number; pending: number; approved: number; rejected: number };
    referredCustomers: number;
    earnings: { pending: number; paid: number };
  };
};

type OnboardRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

const statusLabel: Record<OnboardRow["status"], { text: string; className: string }> = {
  pending: { text: "Being reviewed", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  approved: { text: "Approved", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  rejected: { text: "Not approved", className: "bg-red-500/15 text-red-600 dark:text-red-400" },
};

export default function AgentHome() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: me } = useQuery<AgentMe>({ queryKey: ["/api/agent/me"] });
  const { data: onboards } = useQuery<OnboardRow[]>({ queryKey: ["/api/agent/onboards"] });

  const referralLink = me ? `${window.location.origin}/auth/signup?ref=${me.agent.referralCode}` : "";
  const shareMessage = me
    ? `Order LPG gas delivered to your door with Gaslite! Sign up here: ${referralLink}`
    : "";

  const handleShare = async () => {
    if (!me) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Gaslite", text: shareMessage });
        return;
      } catch {
        // fall through to WhatsApp
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copied!", description: "Share it with anyone who wants gas delivered." });
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <GasliteLogo size="sm" animate={false} />
          <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 space-y-5 pt-5">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-greeting">
            Hi {user?.firstName || "Agent"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">Gaslite Community Agent</p>
        </div>

        <InstallAppCard />

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
          <CardContent className="pt-5 pb-5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/80">Waiting to be paid</p>
                <p className="text-3xl font-bold" data-testid="text-pending-earnings">
                  R {(me?.stats.earnings.pending ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/80">Already paid</p>
                <p className="text-lg font-semibold" data-testid="text-paid-earnings">
                  R {(me?.stats.earnings.paid ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
            {me && (
              <p className="text-xs text-white/80 mt-3">
                Your agent code: <span className="font-mono font-bold text-white">{me.agent.referralCode}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <button
            className="w-full flex items-center gap-4 rounded-md border bg-card p-4 text-left hover-elevate"
            onClick={() => navigate("/agent/onboard")}
            data-testid="button-onboard-driver"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white flex items-center justify-center flex-shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Sign up a Driver</p>
              <p className="text-xs text-muted-foreground">Earn commission for every driver Gaslite approves</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            className="w-full flex items-center gap-4 rounded-md border bg-card p-4 text-left hover-elevate"
            onClick={handleShare}
            data-testid="button-share"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center flex-shrink-0">
              <Share2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Share Gaslite</p>
              <p className="text-xs text-muted-foreground">Send your link on WhatsApp — earn when they order</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            className="w-full flex items-center gap-4 rounded-md border bg-card p-4 text-left hover-elevate"
            onClick={() => navigate("/agent/earnings")}
            data-testid="button-earnings"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white flex items-center justify-center flex-shrink-0">
              <HandCoins className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">My Earnings</p>
              <p className="text-xs text-muted-foreground">See your money and add bank details</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {me && (
          <button
            className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium py-1"
            onClick={handleCopy}
            data-testid="button-copy-link"
          >
            <Copy className="h-3.5 w-3.5" /> Copy my customer link
          </button>
        )}

        <div className="space-y-2">
          <h2 className="font-semibold text-sm">My drivers ({onboards?.length ?? 0})</h2>
          {(!onboards || onboards.length === 0) && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No drivers yet. Tap <span className="font-semibold text-foreground">Sign up a Driver</span> to add your first one!
              </CardContent>
            </Card>
          )}
          {onboards?.map((o) => (
            <Card key={o.id} data-testid={`card-onboard-${o.id}`}>
              <CardContent className="py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{o.firstName} {o.lastName}</p>
                  <p className="text-xs text-muted-foreground">{o.phone}</p>
                </div>
                <Badge variant="secondary" className={statusLabel[o.status].className}>
                  {statusLabel[o.status].text}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
