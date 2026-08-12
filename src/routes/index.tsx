import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2, Pencil, Check, X, FolderPlus, Copy } from "lucide-react";
import {
  useSalary,
  useSettings,
  formatMoney,
  MONTH_NAMES,
  type Category,
} from "../lib/finance-store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Fab } from "../components/Fab";
import { getCategoryIcon } from "../lib/category-icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Salary — Ledger" },
      { name: "description", content: "Track monthly income and expenses by category." },
      { property: "og:title", content: "Salary — Ledger" },
      { property: "og:description", content: "Track monthly income and expenses by category." },
    ],
  }),
  component: SalaryPage,
});

function SalaryPage() {
  const s = useSalary();
  const { settings } = useSettings();
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [salaryInput, setSalaryInput] = useState("");
  const income = s.currentMonth.income;

  const monthTotal = useMemo(
    () =>
      s.currentMonth.categories.reduce(
        (sum, c) => sum + c.transactions.reduce((a, t) => a + (t.completed ? t.amount : 0), 0),
        0,
      ),
    [s.currentMonth],
  );

  if (!s.hydrated) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-6 pt-8 pb-6">
        <header className="rounded-2xl border border-border/40 bg-card px-5 py-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <PeriodPicker
              year={s.year}
              month={s.month}
              years={s.years}
              months={s.months}
              onMonthChange={(m) => {
                s.ensureYearMonth(s.year, m);
                s.setMonth(m);
              }}
              onYearChange={s.setYear}
              onAddYear={s.addYear}
            />
            <div className="flex flex-col items-end gap-2 shrink-0">
              <ImportTemplate onImport={s.importMonthTemplate} data={s.data} currentY={s.year} />
              <button
                type="button"
                onClick={() => setSalaryOpen(true)}
                className="flex items-center gap-1.5 text-right"
              >
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {income === undefined ? "Set Salary" : formatMoney(income, settings.currency)}
                </span>
                <Pencil className="h-3 w-3 text-muted-foreground/50" />
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 rounded-xl border border-border/50 bg-background/30 p-2">
            <div className="flex-1 px-3 py-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                Spend
              </p>
              <p className="num text-lg font-bold tracking-tight text-blue-600/90">
                {formatMoney(monthTotal, settings.currency)}
              </p>
            </div>
            <div className="h-8 w-px bg-border/40" />
            <div className="flex-1 px-3 py-1 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/80">
                Remaining
              </p>
              <p className={`num text-lg font-bold tracking-tight ${
                income === undefined ? "text-muted-foreground/50" : "text-emerald-600/90"
              }`}>
                {income === undefined
                  ? "--"
                  : formatMoney(income - monthTotal, settings.currency)}
              </p>
            </div>
          </div>
        </header>
      </div>

      <main className="space-y-3 px-6 pb-16 pt-4">
        {s.currentMonth.categories.map((c) => (
          <CategoryBlock key={c.id} category={c} currency={settings.currency} api={s} />
        ))}
      </main>

      <Fab label="Add category" onClick={() => setAddCatOpen(true)} />

      <Dialog
        open={salaryOpen}
        onOpenChange={(v) => {
          if (v) setSalaryInput(income === undefined ? "" : String(income));
          setSalaryOpen(v);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Monthly salary</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Amount
            </Label>
            <Input
              autoFocus
              inputMode="decimal"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                s.setIncome(undefined);
                setSalaryOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                const v = parseFloat(salaryInput);
                s.setIncome(Number.isNaN(v) ? undefined : v);
                setSalaryOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addCatOpen}
        onOpenChange={(v) => {
          if (!v) setNewCatName("");
          setAddCatOpen(v);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Groceries"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddCatOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (newCatName.trim()) {
                  s.addCategory(newCatName.trim());
                  setNewCatName("");
                  setAddCatOpen(false);
                }
              }}
            >
              Add category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryBlock({
  category,
  currency,
  api,
}: {
  category: Category;
  currency: string;
  api: ReturnType<typeof useSalary>;
}) {
  const total = category.transactions.reduce((a, t) => a + (t.completed ? t.amount : 0), 0);
  const Icon = getCategoryIcon(category.name);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [addOpen, setAddOpen] = useState(false);
  const [txName, setTxName] = useState("");
  const [txAmount, setTxAmount] = useState("");

  return (
    <section className="space-y-0 rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 border-b border-border/20 bg-transparent">
        <button
          type="button"
          onClick={() => !editing && api.toggleCategory(category.id)}
          className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/20 bg-white text-foreground shadow-sm">
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1 flex items-baseline gap-2">
            {editing ? (
              <div className="flex items-center gap-1">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-7 w-40"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (name.trim()) api.renameCategory(category.id, name.trim());
                    setEditing(false);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <h2 className={`truncate text-base font-semibold tracking-tight transition-colors ${total === 0 ? 'text-muted-foreground' : 'text-foreground/90'}`}>
                  {category.name}
                </h2>
                <span className="num text-sm font-semibold text-foreground/90 ml-auto">
                  {formatMoney(total, currency)}
                </span>
              </>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 transition-colors duration-200 hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              <button
                onClick={() => setEditing(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>
              <button
                onClick={() => api.deleteCategory(category.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          category.collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="overflow-hidden px-4 pb-3 pt-1">
          <div className="space-y-0.5">
          {category.transactions.map((t) => (
            <TransactionRow
              key={t.id}
              currency={currency}
              name={t.name}
              amount={t.amount}
              completed={t.completed}
              onSave={(name, amount) => api.updateTransaction(category.id, t.id, { name, amount })}
              onToggle={() => api.updateTransaction(category.id, t.id, { completed: !t.completed })}
              onDelete={() => api.deleteTransaction(category.id, t.id)}
            />
          ))}

          {addOpen ? (
            <div className="flex min-h-11 items-center gap-2">
              <Input
                placeholder="Name"
                value={txName}
                onChange={(e) => setTxName(e.target.value)}
                className="h-8 flex-1"
                autoFocus
              />
              <Input
                placeholder="0.00"
                inputMode="decimal"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="h-8 w-24 text-right"
              />
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const a = parseFloat(txAmount);
                  if (txName.trim() && !Number.isNaN(a)) {
                    api.addTransaction(category.id, txName.trim(), a);
                    setTxName("");
                    setTxAmount("");
                    setAddOpen(false);
                  }
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAddOpen(true)}
              className="flex min-h-11 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3" /> Add transaction
            </button>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TransactionRow({
  name,
  amount,
  currency,
  completed,
  onSave,
  onToggle,
  onDelete,
}: {
  name: string;
  amount: number;
  currency: string;
  completed?: boolean;
  onSave: (name: string, amount: number) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [n, setN] = useState(name);
  const [a, setA] = useState(String(amount));

  if (editing) {
    return (
      <div className="flex min-h-11 items-center gap-2">
        <Input value={n} onChange={(e) => setN(e.target.value)} className="h-8 flex-1" />
        <Input
          value={a}
          onChange={(e) => setA(e.target.value)}
          className="h-8 w-24 text-right"
          inputMode="decimal"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => {
            const num = parseFloat(a);
            if (n.trim() && !Number.isNaN(num)) {
              onSave(n.trim(), num);
              setEditing(false);
            }
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
          completed 
            ? "bg-emerald-500 border-emerald-500 text-white" 
            : "border-border/60 hover:border-border"
        }`}
      >
        {completed && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <button
        onClick={() => setEditing(true)}
        className="flex min-h-10 flex-1 items-center justify-between gap-4 rounded-lg py-1 text-left transition-colors hover:bg-accent/40"
      >
        <span className={`min-w-0 flex-1 truncate text-sm transition-colors ${
          completed ? "text-emerald-600/70 line-through" : "text-muted-foreground"
        }`}>
          {name}
        </span>
        <span className={`num shrink-0 text-sm tabular-nums transition-colors ${
          completed ? "text-emerald-600 font-medium" : "text-foreground/70"
        }`}>
          {formatMoney(amount, currency)}
        </span>
      </button>
    </div>
  );
}

function PeriodPicker({
  year,
  month,
  years,
  months,
  onMonthChange,
  onYearChange,
  onAddYear,
}: {
  year: string;
  month: string;
  years: string[];
  months: string[];
  onMonthChange: (m: string) => void;
  onYearChange: (y: string) => void;
  onAddYear: (y: string) => void;
}) {
  const [newYear, setNewYear] = useState("");
  const idx = parseInt(month, 10) - 1;
  const monthLabel = MONTH_NAMES[idx] ?? month;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="group flex items-center gap-2 text-left">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            {monthLabel}{" "}
            <span className="text-muted-foreground/70">{year}</span>
          </h1>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="mb-2 flex items-center gap-1 overflow-x-auto">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => onYearChange(y)}
              className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold tracking-wide transition-colors ${
                y === year
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="mb-3 grid grid-cols-3 gap-1">
          {MONTH_NAMES.map((name, i) => {
            const mkey = String(i + 1).padStart(2, "0");
            const has = months.includes(mkey);
            return (
              <button
                key={mkey}
                onClick={() => onMonthChange(mkey)}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  mkey === month
                    ? "bg-primary text-primary-foreground"
                    : has
                      ? "hover:bg-accent"
                      : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 border-t border-border pt-2">
          <Input
            placeholder="Add year"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            className="h-8"
          />
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (/^\d{4}$/.test(newYear)) {
                onAddYear(newYear);
                setNewYear("");
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ImportTemplate({
  onImport,
  data,
  currentY,
}: {
  onImport: (y: string, m: string) => void;
  data: ReturnType<typeof useSalary>["data"];
  currentY: string;
}) {
  const [open, setOpen] = useState(false);
  const [y, setY] = useState(currentY);
  const [m, setM] = useState("");
  const years = Object.keys(data.years).sort();
  const months = data.years[y] ? Object.keys(data.years[y].months).sort() : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <Copy className="h-3.5 w-3.5" />
          Import
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Import month template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">From year</Label>
            <Select value={y} onValueChange={setY}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((yy) => (
                  <SelectItem key={yy} value={yy}>{yy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">From month</Label>
            <Select value={m} onValueChange={setM}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {months.map((mm) => (
                  <SelectItem key={mm} value={mm}>{MONTH_NAMES[parseInt(mm, 10) - 1]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Copies category structure & transactions into the currently selected month.
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (y && m) {
                onImport(y, m);
                setOpen(false);
              }
            }}
            disabled={!y || !m}
          >
            <FolderPlus className="mr-1.5 h-4 w-4" /> Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
