import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

function dismissedRecently(): boolean {
  const storedDismissal = localStorage.getItem("gaslite_pwa_dismissed");
  if (!storedDismissal) return false;
  const dismissedAt = parseInt(storedDismissal, 10);
  return Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
}

// Site-wide install banner, rendered once for every signed-in role
// (customer, driver, agent, admin). Always offers a way to install:
// the native one-tap prompt where the browser supports it, otherwise
// step-by-step manual instructions — never silently does nothing.
export function PWAInstallBanner() {
  const { isInstalled, canPromptNatively, isIOS, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(dismissedRecently);
  const [showHelp, setShowHelp] = useState(false);

  const handleInstall = async () => {
    if (canPromptNatively) {
      await promptInstall();
    } else {
      setShowHelp(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("gaslite_pwa_dismissed", Date.now().toString());
  };

  if (isInstalled || dismissed) return null;

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
            {showHelp && (
              <div className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-md p-2.5 space-y-1">
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
  const { isInstalled, canPromptNatively, promptInstall } = usePwaInstall();

  if (isInstalled || !canPromptNatively) return null;

  return (
    <Button
      onClick={() => promptInstall()}
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
