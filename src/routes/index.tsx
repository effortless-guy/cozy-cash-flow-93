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
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const monthTotal = useMemo(
    () =>
      s.currentMonth.categories.reduce(
        (sum, c) => sum + c.transactions.reduce((a, t) => a + t.amount, 0),
        0,
      ),
    [s.currentMonth],
  );

  if (!s.hydrated) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur-md px-6 pt-10 pb-8">
        <div className="mb-8 flex items-center justify-between">
          <YearPicker
            year={s.year}
            years={s.years}
            onChange={s.setYear}
            onAddYear={s.addYear}
          />
          <ImportTemplate onImport={s.importMonthTemplate} data={s.data} currentY={s.year} />
        </div>

        <div className="flex items-end justify-between gap-4">
          <MonthPicker
            year={s.year}
            month={s.month}
            months={s.months}
            onChange={(m) => {
              s.ensureYearMonth(s.year, m);
              s.setMonth(m);
            }}
          />
          <div className="text-right">
            <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Monthly Spend
            </span>
            <span className="num text-xl font-semibold">
              {formatMoney(monthTotal, settings.currency)}
            </span>
          </div>
        </div>
      </header>

      <main className="space-y-10 px-6 pb-16 pt-2">
        {s.currentMonth.categories.map((c) => (
          <CategoryBlock key={c.id} category={c} currency={settings.currency} api={s} />
        ))}

        {addingCat ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name"
              className="h-9"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newCatName.trim()) s.addCategory(newCatName.trim());
                setNewCatName("");
                setAddingCat(false);
              }}
            >
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingCat(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCat(true)}
            className="w-full rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            + Add New Category
          </button>
        )}
      </main>
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
  const total = category.transactions.reduce((a, t) => a + t.amount, 0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [addOpen, setAddOpen] = useState(false);
  const [txName, setTxName] = useState("");
  const [txAmount, setTxAmount] = useState("");

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => !editing && api.toggleCategory(category.id)}
          className="group flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ease-out ${category.collapsed ? "-rotate-90" : "rotate-0"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
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
                <h2 className="truncate text-lg font-semibold tracking-tight">{category.name}</h2>
                <p className="text-xs text-muted-foreground/80">
                  {category.transactions.length}{" "}
                  {category.transactions.length === 1 ? "transaction" : "transactions"}
                </p>
              </>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <span className="num text-base font-semibold">{formatMoney(total, currency)}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
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
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border/50 pl-11 pt-4">
          {category.transactions.map((t) => (
            <TransactionRow
              key={t.id}
              currency={currency}
              name={t.name}
              amount={t.amount}
              onSave={(name, amount) => api.updateTransaction(category.id, t.id, { name, amount })}
              onDelete={() => api.deleteTransaction(category.id, t.id)}
            />
          ))}

          {addOpen ? (
            <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
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
  onSave,
  onDelete,
}: {
  name: string;
  amount: number;
  currency: string;
  onSave: (name: string, amount: number) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [n, setN] = useState(name);
  const [a, setA] = useState(String(amount));

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1">
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
    <button
      onClick={() => setEditing(true)}
      className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-4 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent/60"
    >
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{name}</span>
      <span className="num shrink-0 text-sm tabular-nums text-foreground/80">
        {formatMoney(amount, currency)}
      </span>
    </button>
  );
}

function MonthPicker({
  year,
  month,
  months,
  onChange,
}: {
  year: string;
  month: string;
  months: string[];
  onChange: (m: string) => void;
}) {
  const idx = parseInt(month, 10) - 1;
  const label = MONTH_NAMES[idx] ?? month;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 text-left">
          <div>
            <h1 className="text-3xl font-semibold leading-none tracking-tight">{label}</h1>
          </div>
          <ChevronDown className="mt-2 h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {year}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTH_NAMES.map((name, i) => {
            const mkey = String(i + 1).padStart(2, "0");
            const has = months.includes(mkey);
            return (
              <button
                key={mkey}
                onClick={() => onChange(mkey)}
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
      </PopoverContent>
    </Popover>
  );
}

function YearPicker({
  year,
  years,
  onChange,
  onAddYear,
}: {
  year: string;
  years: string[];
  onChange: (y: string) => void;
  onAddYear: (y: string) => void;
}) {
  const [newYear, setNewYear] = useState("");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium ring-1 ring-border">
          <span>{year}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="mb-2 flex flex-col gap-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => onChange(y)}
              className={`rounded-md px-2 py-1.5 text-left text-sm ${
                y === year ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 border-t border-border pt-2">
          <Input
            placeholder="e.g. 2026"
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
