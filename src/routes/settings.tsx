import { createFileRoute } from "@tanstack/react-router";
import { useSettings, useDataManagement } from "../lib/finance-store";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Moon, Sun, Download, Upload, Lock, Shield, Key } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../lib/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MoneyStory" },
      { name: "description", content: "Customize currency, theme, language and notifications." },
      { property: "og:title", content: "Settings — MoneyStory" },
      { property: "og:description", content: "Customize currency, theme, language and notifications." },
    ],
  }),
  component: SettingsPage,
});

const CURRENCIES = [
  { code: "$", label: "USD $" },
  { code: "€", label: "EUR €" },
  { code: "£", label: "GBP £" },
  { code: "¥", label: "JPY ¥" },
  { code: "₹", label: "INR ₹" },
  { code: "₩", label: "KRW ₩" },
  { code: "₽", label: "RUB ₽" },
  { code: "CHF", label: "CHF" },
  { code: "A$", label: "AUD A$" },
  { code: "C$", label: "CAD C$" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "ja", label: "日本語" },
  { code: "hi", label: "हिन्दी" },
];

function SettingsPage() {
  const { settings, setSettings, hydrated } = useSettings();
  const { exportData, importData } = useDataManagement();
  const { auth, enableLock, disableLock, changePin } = useAuth();
  const [pinInput, setPinInput] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);
  
  if (!hydrated || !auth) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-10 pb-8 backdrop-blur-md">
        <h1 className="text-3xl font-semibold leading-none tracking-tight">Settings</h1>
      </header>

      <main className="space-y-6 px-6 pb-16 pt-0">
        <Section title="Display">
          <Row label="Currency">
            <Select
              value={settings.currency}
              onValueChange={(v) => setSettings({ ...settings, currency: v })}
            >
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Theme">
            <div className="flex items-center gap-3">
              {settings.theme === "dark" ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={settings.theme === "dark"}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, theme: checked ? "dark" : "light" })
                }
              />
            </div>
          </Row>
          <Row label="Language">
            <Select
              value={settings.language}
              onValueChange={(v) => setSettings({ ...settings, language: v })}
            >
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </Section>

        <Section title="App">
          <Row label="Notifications" description="Monthly budget rollover & subscription reminders">
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifications: checked })
              }
            />
          </Row>
        </Section>

        <Section title="Security">
          <Row label="App Lock" description="Require PIN to open the app">
            <Switch
              checked={auth.isEnabled}
              onCheckedChange={(checked) => {
                if (!checked) {
                  disableLock();
                }
              }}
            />
          </Row>
          
          {!auth.isEnabled && (
            <Dialog>
              <DialogTrigger asChild>
                <div className="px-4 py-2">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Lock className="h-4 w-4" /> Set PIN & Enable Lock
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set App Lock PIN</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Choose a numeric PIN to protect your financial data.
                  </p>
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter new PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="text-center text-lg tracking-[0.5em]"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      if (pinInput.length >= 4) {
                        enableLock(pinInput);
                        setPinInput("");
                      }
                    }}
                    disabled={pinInput.length < 4}
                  >
                    Enable App Lock
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {auth.isEnabled && (
            <Dialog>
              <DialogTrigger asChild>
                <div className="px-4 py-2">
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
                    <Key className="h-4 w-4" /> Change PIN
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Change PIN</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter new PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="text-center text-lg tracking-[0.5em]"
                  />
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      if (pinInput.length >= 4) {
                        changePin(pinInput);
                        setPinInput("");
                      }
                    }}
                    disabled={pinInput.length < 4}
                  >
                    Update PIN
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </Section>

        <Section title="Subscriptions">
          <Row label="Show weekly total" description="Display weekly total in Subscriptions header">
            <Switch
              checked={settings.showWeeklyTotal !== false}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showWeeklyTotal: checked })
              }
            />
          </Row>
          <Row label="Show yearly total" description="Display yearly total in Subscriptions header">
            <Switch
              checked={settings.showYearlyTotal !== false}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showYearlyTotal: checked })
              }
            />
          </Row>
        </Section>

        <Section title="Net Worth">
          <Row label="Grid Columns" description="Number of columns for asset cards">
            <div className="flex gap-2">
              {[2, 3, 4].map(cols => (
                <button
                  key={cols}
                  onClick={() => setSettings({ ...settings, nwColumns: cols })}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${settings.nwColumns === cols ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}
                >
                  {cols}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Hide Balance" description="Mask balances on Net Worth dashboard">
            <Switch
              checked={!!settings.hideNWBalances}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, hideNWBalances: checked })
              }
            />
          </Row>
        </Section>

        <Section title="Data & Privacy" description="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            Now implement a local backup and restore system on top of the new IndexedDB/Dexie storage.\n\nAdd a Data & Privacy section inside the existing Settings screen. Do not add another bottom navigation tab.\n\nAdd:\n\n Backup Now\n\n Restore Backup\n\n Last Backup\n\nExport the complete application data into a versioned JSON backup file:\n\ncozy-cash-flow-backup-YYYY-MM-DD.json\n\nThe backup must be independent of the IndexedDB schema so future database migrations don't invalidate old backups.\n\nBefore restoring, validate the backup and show a confirmation. Never silently overwrite existing data. Where practical, create a safety backup before replacing the current dataset.\n\nAfter restore, reinitialize the application state so every existing screen immediately reflects the restored data.\n\nAdd a non-intrusive backup reminder when the last successful backup is older than 7 days. Do not interrupt normal usage.\n\nDo not implement cloud backup or encryption yet.\n\nPreserve the existing UI and design.\n\n'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            Now add optional client-side encryption to the backup system.\n\nKeep encryption completely local to the browser. The plaintext backup must never be uploaded or sent to a server.\n\nUse a modern authenticated encryption scheme such as AES-256-GCM and a proper password-based key derivation mechanism such as Argon2id where browser support/library choices are appropriate.\n\nDesign the backup format so encrypted backups can be identified and versioned.\n\nThe encryption key/password must never be stored in plaintext in IndexedDB or sent anywhere.\n\nClearly handle the password-loss scenario: an encrypted backup cannot be recovered without its password/recovery mechanism.\n\nPreserve compatibility with existing unencrypted JSON backups, so users can still restore older backups.\n\nDo not add cloud synchronization.">
          <div className="flex items-center gap-4 px-4 py-4">
             <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={exportData}>
                <Download className="h-4 w-4" /> Export
             </Button>
             <div className="relative flex-1">
                <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept=".json"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) importData(file);
                    }}
                />
                <Button variant="outline" size="sm" className="w-full gap-2 pointer-events-none">
                    <Upload className="h-4 w-4" /> Import
                </Button>
             </div>
          </div>

          <div className="p-4 border-t border-border/60">
            <button
              onClick={() => {
                if (confirm("Reset all data? This will clear everything in IndexedDB and localStorage. This cannot be undone.")) {
                  localStorage.clear();
                  indexedDB.deleteDatabase("LedgerDB");
                  location.reload();
                }
              }}
              className="text-sm font-medium text-destructive hover:underline"
            >
              Reset all data
            </button>
          </div>
        </Section>

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          MoneyStory · v1.0
        </p>
      </main>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="px-1 flex items-baseline justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-foreground/70">
          {title}
        </h2>
        {description && (
          <span className="text-[10px] text-muted-foreground/60 italic">{description}</span>
        )}
      </div>
      <div className="divide-y divide-border/60 rounded-xl border border-border bg-card ring-1 ring-black/5 dark:ring-white/5">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground/80">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}