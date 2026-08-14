import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Fab } from "../components/Fab";

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
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-8 pb-6 backdrop-blur-md">
        <h1 className="mb-5 text-2xl font-semibold leading-none tracking-tight">
          Subscriptions
        </h1>
        {(() => {
          const showWeekly = settings.showWeeklyTotal !== false;
          const showYearly = settings.showYearlyTotal !== false;
          return (
            <div className="grid grid-cols-3 items-end gap-3">
              <div className="text-left">
                {showWeekly && (
                  <>
                    <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-widest text-muted-foreground/70">
                      Weekly
                    </span>
                    <span className="num text-sm font-medium text-muted-foreground">
                      {formatMoney((total * 12) / 52, settings.currency)}
                    </span>
                  </>
                )}
              </div>
              <div className="text-center">
                <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Monthly
                </span>
                <span className="num text-2xl font-semibold tracking-tight">
                  {formatMoney(total, settings.currency)}
                </span>
              </div>
              <div className="text-right">
                {showYearly && (
                  <>
                    <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-widest text-muted-foreground/70">
                      Yearly
                    </span>
                    <span className="num text-sm font-medium text-muted-foreground">
                      {formatMoney(total * 12, settings.currency)}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </header>

      <main className="px-6 pb-16 pt-4">
        <ul className="space-y-2">
          {subs.map((s) => (
            <SubRow
              key={s.id}
              sub={s}
              currency={settings.currency}
              onUpdate={(patch) => update(s.id, patch)}
              onRemove={() => remove(s.id)}
            />
          ))}
        </ul>
      </main>

      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40">
        <Fab label="Add subscription" onClick={() => setAdding(true)} />
      </div>

      <NewSubDialog
        open={adding}
        onOpenChange={setAdding}
        currency={settings.currency}
        onSave={(sub) => {
          add(sub);
          setAdding(false);
        }}
      />
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
  const [startDate, setStartDate] = useState(sub.startDate || new Date().toISOString().split("T")[0]);

  const monthly = monthlyEquivalent(sub);

  const nextRenewal = useMemo(() => {
    const start = sub.startDate ? new Date(sub.startDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let next = new Date(start);
    while (next < today) {
      if (sub.cycle === "monthly") next.setMonth(next.getMonth() + 1);
      else if (sub.cycle === "quarterly") next.setMonth(next.getMonth() + 3);
      else if (sub.cycle === "semiannual") next.setMonth(next.getMonth() + 6);
      else if (sub.cycle === "yearly") next.setFullYear(next.getFullYear() + 1);
    }
    
    return next.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }, [sub.startDate, sub.cycle]);

  if (editing) {
    return (
      <li className="space-y-2 rounded-2xl border border-border/50 bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 flex-1" />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              const p = parseFloat(price);
              if (name.trim() && !Number.isNaN(p)) {
                onUpdate({ name: name.trim(), price: p, cycle, startDate });
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
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 w-auto flex-1 text-xs"
          />
        </div>
      </li>
    );
  }


  return (
    <li className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
      <button onClick={() => setEditing(true)} className="min-h-11 min-w-0 flex-1 text-left">
        <p className="truncate text-[17px] font-semibold leading-tight tracking-tight">{sub.name}</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          {formatMoney(sub.price, currency)} · {CYCLE_LABEL[sub.cycle]}
        </p>
      </button>
      <div className="flex items-center gap-2 pl-3">
        <div className="text-right">
          <div className="flex items-baseline justify-end">
            <span className="num text-base font-semibold">
              {formatMoney(monthly, currency)}
            </span>
            <span className="ml-0.5 text-[9px] font-medium uppercase tracking-widest text-muted-foreground/50">
              /mo
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground/80">
            Renews {nextRenewal}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 transition-colors duration-200 hover:text-foreground" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function NewSubDialog({
  open,
  onOpenChange,
  currency,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currency: string;
  onSave: (s: Omit<Subscription, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const reset = () => {
    setName("");
    setPrice("");
    setCycle("monthly");
    setStartDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Service name"
            />
          </div>
          <div className="flex gap-3">
            <div className="w-28 space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Price</Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={`${currency}0.00`}
                inputMode="decimal"
                className="text-right"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Cycle</Label>
              <Select value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CYCLE_LABEL) as BillingCycle[]).map((c) => (
                    <SelectItem key={c} value={c}>{CYCLE_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Start Date / Last Billing</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const p = parseFloat(price);
              if (name.trim() && !Number.isNaN(p)) {
                onSave({ name: name.trim(), price: p, cycle, startDate });
                reset();
              }
            }}
          >
            Add subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}