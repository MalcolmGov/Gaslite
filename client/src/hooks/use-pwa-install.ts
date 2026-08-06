import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Centralizes beforeinstallprompt capture so every install UI (the global
// banner, the agent home card, any future entry point) shares one source of
// truth. Native prompt only fires on Chromium browsers, and only after the
// browser's own engagement heuristics are met — callers must not assume it
// fires and should offer manual "Add to Home Screen" instructions instead.
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(standalone);
    if (standalone) return;

    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt as BeforeInstallPromptEvent);
      window.__pwaInstallPrompt = undefined;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      window.__pwaInstallPrompt = undefined;
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    return outcome;
  };

  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  return { isInstalled, canPromptNatively: !!deferredPrompt, isIOS, promptInstall };
}
