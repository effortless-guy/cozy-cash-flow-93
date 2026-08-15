import { useState, useEffect } from "react";
import { Wifi, Check } from "lucide-react";

export function OfflineReadyIndicator() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if it was already marked as offline ready in this session
    const alreadyReady = sessionStorage.getItem('pwa-offline-ready');
    if (alreadyReady) return;

    const handleOfflineReady = () => {
      setShow(true);
      sessionStorage.setItem('pwa-offline-ready', 'true');
      // Automatically hide after a few seconds
      setTimeout(() => setShow(false), 5000);
    };

    window.addEventListener('sw-offline-ready', handleOfflineReady);
    return () => window.removeEventListener('sw-offline-ready', handleOfflineReady);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-white shadow-lg backdrop-blur-sm border border-white/10">
        <Wifi className="h-3.5 w-3.5" />
        <span className="text-[11px] font-medium tracking-wide uppercase">Offline ready</span>
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 ml-0.5">
          <Check className="h-2.5 w-2.5" />
        </div>
      </div>
    </div>
  );
}
