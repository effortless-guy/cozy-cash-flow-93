import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "../lib/finance-store";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Ledger" },
      { name: "description", content: "Customize currency, theme, language and notifications." },
      { property: "og:title", content: "Settings — Ledger" },
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
  if (!hydrated) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-10 pb-8 backdrop-blur-md">
        <h1 className="text-3xl font-semibold leading-none tracking-tight">Settings</h1>
      </header>

      <main className="space-y-12 px-6 pb-16 pt-4">
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
          <Row label="Notifications" description="Monthly rollover & subscription reminders">
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifications: checked })
              }
            />
          </Row>
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
              {[2, 3].map(cols => (
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


        <Section title="Data">
          <div className="p-4">
            <button
              onClick={() => {
                if (confirm("Reset all data? This cannot be undone.")) {
                  localStorage.clear();
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
          Ledger · v1.0
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-foreground/70">
        {title}
      </h2>
      <div className="divide-y divide-border/60 rounded-xl border border-border bg-card">
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