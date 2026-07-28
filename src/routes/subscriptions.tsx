import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  useSubscriptions,
  useSettings,
  monthlyEquivalent,
  formatMoney,
  type BillingCycle,
  type Subscription,
} from "../lib/finance-store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions — Ledger" },
      { name: "description", content: "Track subscriptions with monthly-normalized costs." },
      { property: "og:title", content: "Subscriptions — Ledger" },
      { property: "og:description", content: "Track subscriptions with monthly-normalized costs." },
    ],
  }),
  component: SubscriptionsPage,
});

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Semi-annual",
  yearly: "Yearly",
};

function SubscriptionsPage() {
  const { subs, add, update, remove, hydrated } = useSubscriptions();
  const { settings } = useSettings();
  const [adding, setAdding] = useState(false);

  const total = useMemo(
    () => subs.reduce((sum, s) => sum + monthlyEquivalent(s), 0),
    [subs],
  );

  if (!hydrated) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/85 px-5 pt-8 pb-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Subscriptions
          </span>
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
        {(() => {
          const showWeekly = settings.showWeeklyTotal !== false;
          const showYearly = settings.showYearlyTotal !== false;
          return (
            <div className="flex items-end justify-between gap-3">
              {showWeekly && (
                <div className="text-left">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Weekly
                  </span>
                  <span className="num text-lg font-semibold">
                    {formatMoney((total * 12) / 52, settings.currency)}
                  </span>
                </div>
              )}
              <div className={showWeekly || showYearly ? "text-center" : "text-left"}>
                <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Monthly
                </span>
                <span className="num text-xl font-semibold">
                  {formatMoney(total, settings.currency)}
                </span>
              </div>
              {showYearly && (
                <div className="text-right">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Yearly
                  </span>
                  <span className="num text-lg font-semibold">
                    {formatMoney(total * 12, settings.currency)}
                  </span>
                </div>
              )}
            </div>
          );
        })()}
      </header>

      <main className="px-5 pb-8">
        <ul className="divide-y divide-border/60">
          {subs.map((s) => (
            <SubRow
              key={s.id}
              sub={s}
              currency={settings.currency}
              onUpdate={(patch) => update(s.id, patch)}
              onRemove={() => remove(s.id)}
            />
          ))}
          {adding && (
            <NewSubRow
              currency={settings.currency}
              onSave={(sub) => {
                add(sub);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </ul>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="mt-4 w-full rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            + Add Subscription
          </button>
        )}
      </main>
    </div>
  );
}

function SubRow({
  sub,
  currency,
  onUpdate,
  onRemove,
}: {
  sub: Subscription;
  currency: string;
  onUpdate: (patch: Partial<Subscription>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const [price, setPrice] = useState(String(sub.price));
  const [cycle, setCycle] = useState<BillingCycle>(sub.cycle);

  const monthly = monthlyEquivalent(sub);

  if (editing) {
    return (
      <li className="space-y-2 py-3">
        <div className="flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 flex-1" />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              const p = parseFloat(price);
              if (name.trim() && !Number.isNaN(p)) {
                onUpdate({ name: name.trim(), price: p, cycle });
                setEditing(false);
              }
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="h-8 w-24 text-right"
          />
          <Select value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
            <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CYCLE_LABEL) as BillingCycle[]).map((c) => (
                <SelectItem key={c} value={c}>{CYCLE_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between py-4">
      <button onClick={() => setEditing(true)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-base font-medium">{sub.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(sub.price, currency)} · {CYCLE_LABEL[sub.cycle]}
        </p>
      </button>
      <div className="flex items-center gap-2 pl-3">
        <div className="text-right">
          <span className="num text-base font-semibold">
            {formatMoney(monthly, currency)}
          </span>
          <span className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            /mo
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function NewSubRow({
  currency,
  onSave,
  onCancel,
}: {
  currency: string;
  onSave: (s: Omit<Subscription, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  return (
    <li className="space-y-2 py-3">
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Service name"
          className="h-8 flex-1"
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={`${currency}0.00`}
          inputMode="decimal"
          className="h-8 w-24 text-right"
        />
        <Select value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
          <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(CYCLE_LABEL) as BillingCycle[]).map((c) => (
              <SelectItem key={c} value={c}>{CYCLE_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const p = parseFloat(price);
            if (name.trim() && !Number.isNaN(p)) {
              onSave({ name: name.trim(), price: p, cycle });
            }
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}