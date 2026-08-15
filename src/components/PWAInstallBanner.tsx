import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
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
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("pwa-banner-dismissed");
    if (isDismissed) return;

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || 
                        (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    let timer: number | null = null;
    if (ios) {
      timer = window.setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we just show a message since we can't trigger the prompt
      return;
    }

    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
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
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </div>
          
          <div className="flex flex-1 flex-col min-w-0">
            <span className="text-sm font-semibold truncate">MoneyStory</span>
            <span className="text-xs text-muted-foreground truncate">Install for offline access</span>
          </div>

          <div className="flex items-center gap-1">
            {!isIOS && (
              <Button 
                onClick={handleInstall}
                size="sm" 
                className="h-8 rounded-lg px-3 text-xs font-medium"
              >
                INSTALL
              </Button>
            )}
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

        {isIOS && (
          <div className="mt-1 flex items-center gap-2 border-t pt-2 text-[11px] text-muted-foreground leading-tight">
            <span>Tap</span>
            <Share className="h-3 w-3 inline" />
            <span>then "Add to Home Screen" to install on iOS.</span>
          </div>
        )}
      </div>
    </div>
  );
}

