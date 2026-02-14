import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export function usePushNotifications(isAuthenticated: boolean) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    checkSubscription();
  }, [isAuthenticated]);

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      if (Notification.permission === "granted" && !subscription) {
        await subscribe();
      }
    } catch {
    }
  }

  async function subscribe() {
    try {
      const res = await fetch("/api/push/vapid-key");
      if (!res.ok) return;
      const { publicKey } = await res.json();

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiRequest("POST", "/api/push/subscribe", {
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
      setPermission("granted");
    } catch {
    }
  }

  async function requestPermission() {
    if (typeof Notification === "undefined") return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      await subscribe();
    }
  }

  async function unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await apiRequest("POST", "/api/push/unsubscribe", {
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
    }
  }

  return { permission, isSubscribed, requestPermission, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
