import { useEffect, useState } from "react";
import { useDataManagement } from "../lib/finance-store";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./ui/button";

export function BackupReminder() {
  const { lastBackup, hydrated } = useDataManagement();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hydrated || dismissed) return;

    const checkReminder = () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const last = lastBackup ? new Date(lastBackup).getTime() : 0;

      if (now - last > sevenDaysMs) {
        setShow(true);
      }
    };

    checkReminder();
  }, [hydrated, lastBackup, dismissed]);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-lg dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Backup Recommended</span>
            <span className="text-xs opacity-90">Last backup was over 7 days ago.</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDismissed(true);
              setShow(false);
            }}
            className="rounded-full p-1 hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
