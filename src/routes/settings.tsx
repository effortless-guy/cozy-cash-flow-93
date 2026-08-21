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
import { Moon, Sun, Download, Upload, Lock, Shield, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../lib/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MoneyStory" },
      { name: "description", content: "'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" },
      { property: "og:title", content: "Settings — MoneyStory" },
      { property: "og:description", content: "'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" },
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
  const { exportData, importData, lastBackup } = useDataManagement();
  const { auth, enableLock, disableLock, changePin } = useAuth();
  const [pinInput, setPinInput] = useState("");
  const [backupPassword, setBackupPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  
  if (!hydrated || !auth) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-10 pb-8 backdrop-blur-md">
        <h1 className="text-3xl font-semibold leading-none tracking-tight">'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that</h1>
      </header>

      <main className="space-y-6 px-6 pb-16 pt-0">
        <Section title="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
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
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
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
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
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

        <Section title="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Monthly budget rollover & subscription reminders">
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifications: checked })
              }
            />
          </Row>
        </Section>

        <Section title="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Require PIN to open the app">
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

        <Section title="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Display weekly total in Subscriptions header">
            <Switch
              checked={settings.showWeeklyTotal !== false}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showWeeklyTotal: checked })
              }
            />
          </Row>
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Display yearly total in Subscriptions header">
            <Switch
              checked={settings.showYearlyTotal !== false}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showYearlyTotal: checked })
              }
            />
          </Row>
        </Section>

        <Section title="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Number of columns for asset cards">
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
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Mask balances on Net Worth dashboard">
            <Switch
              checked={!!settings.hideNWBalances}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, hideNWBalances: checked })
              }
            />
          </Row>
        </Section>

        <Section title="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Local-first storage: all data stays on your device.">
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Export complete data to a versioned JSON file">
            <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-32 gap-2">
                  <Download className="h-4 w-4" /> Backup
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Backup Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    Optional: Protect your backup with a password. If set, this backup will be encrypted using AES-256 (XSalsa20-Poly1305) locally in your browser.
                    <p className="mt-2 font-semibold text-destructive">
                      Warning: If you lose this password, the backup cannot be recovered.
                    </p>
                  </div>
                  <div className="relative">
                    <Input
                      type={showBackupPassword ? "text" : "password"}
                      placeholder="Optional password"
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowBackupPassword(!showBackupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showBackupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={async () => {
                      await exportData(backupPassword || undefined);
                      setBackupPassword("");
                      setIsBackupDialogOpen(false);
                    }}
                  >
                    Download Backup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Row>
          
          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that" description="Upload a previously exported backup file">
             <div className="relative w-32">
                <input 
                    type="file" 
                    className="absolute inset-0 cursor-pointer opacity-0" 
                    accept=".json"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const result = await importData(file);
                        if (result?.needsPassword) {
                          setPendingRestoreFile(file);
                          setIsRestoreDialogOpen(true);
                        }
                    }}
                />
                <Button variant="outline" size="sm" className="w-full gap-2 pointer-events-none">
                    <Upload className="h-4 w-4" /> Restore
                </Button>
             </div>
          </Row>

          <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Encrypted Backup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  This backup is encrypted. Please enter the password used to create it.
                </p>
                <div className="relative">
                  <Input
                    type={showRestorePassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={restorePassword}
                    onChange={(e) => setRestorePassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRestorePassword(!showRestorePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showRestorePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={async () => {
                    if (pendingRestoreFile) {
                      const result = await importData(pendingRestoreFile, restorePassword);
                      if (result?.success) {
                        setIsRestoreDialogOpen(false);
                        setRestorePassword("");
                        setPendingRestoreFile(null);
                      }
                    }
                  }}
                >
                  Decrypt & Restore
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Row label="'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            I think in setting there is no point of notifications as we cannpt show them , show remive that">
            <span className="text-xs text-muted-foreground">
              {lastBackup ? new Date(lastBackup).toLocaleDateString() : "Never"}
            </span>
          </Row>

          <div className="border-t border-border/60 p-4">
            <button
              onClick={() => {
                if (confirm("Reset all data? This will clear everything in IndexedDB and localStorage. This cannot be undone.")) {
                  localStorage.clear();
                  import('dexie').then(Dexie => {
                    Dexie.default.delete("MoneyStoryDB").then(() => {
                      location.reload();
                    });
                  });
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