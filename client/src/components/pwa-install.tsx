import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const storedDismissal = localStorage.getItem("gaslite_pwa_dismissed");
    if (storedDismissal) {
      const dismissedAt = parseInt(storedDismissal, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt as BeforeInstallPromptEvent);
      window.__pwaInstallPrompt = undefined;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      window.__pwaInstallPrompt = undefined;
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("gaslite_pwa_dismissed", Date.now().toString());
  };

  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <div
      data-testid="pwa-install-banner"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
    >
      <div className="bg-card border rounded-md p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-md bg-blue-500 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Gaslite</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for quick access and a better experience
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                data-testid="button-pwa-install"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Install App
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                data-testid="button-pwa-dismiss"
              >
                Not now
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            data-testid="button-pwa-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PWAInstallButton({ className = "" }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !deferredPrompt) return null;

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className={className}
      data-testid="button-pwa-install-inline"
    >
      <Download className="w-4 h-4 mr-2" />
      Install App
    </Button>
  );
}
