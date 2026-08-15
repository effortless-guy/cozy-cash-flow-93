import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "./ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("pwa-banner-dismissed");
    if (isDismissed) return;

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        
        <div className="flex flex-1 flex-col min-w-0">
          <span className="text-sm font-semibold truncate">Ledger</span>
          <span className="text-xs text-muted-foreground truncate">Install for offline access</span>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            onClick={handleInstall}
            size="sm" 
            className="h-8 rounded-lg px-3 text-xs font-medium"
          >
            INSTALL
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
