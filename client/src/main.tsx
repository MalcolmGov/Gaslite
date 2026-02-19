import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

declare global {
  interface Window {
    __pwaInstallPrompt?: Event;
  }
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__pwaInstallPrompt = e;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                console.log("Gaslite SW activated");
              }
            });
          }
        });
      })
      .catch((err) => console.warn("SW registration failed:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
