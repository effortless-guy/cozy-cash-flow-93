import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Check, Trash2, User } from "lucide-react";
import {
  useKhatabook,
  useSettings,
  formatMoney,
  personBalance,
  type Person,
  type LedgerEntry,
} from "../lib/finance-store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Fab } from "../components/Fab";

export const Route = createFileRoute("/khatabook")({
  head: () => ({
    meta: [
      { title: "Khatabook — Ledger" },
      {
        name: "description",
        content: "Track money you lent and borrowed, person by person.",
      },
      { property: "og:title", content: "Khatabook — Ledger" },
      {
        property: "og:description",
        content: "Track money you lent and borrowed, person by person.",
      },
    ],
  }),
  component: KhatabookPage,
});

function KhatabookPage() {
  const k = useKhatabook();
  const { settings } = useSettings();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { receive, owe } = useMemo(() => {
    let receive = 0;
    let owe = 0;
    for (const p of k.people) {
      const b = personBalance(p);
      if (b > 0) receive += b;
      else owe += -b;
    }
    return { receive, owe };
  }, [k.people]);

  if (!k.hydrated)
    return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-8 pb-6 backdrop-blur-md">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">
          Khatabook
        </h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              You will receive
            </p>
            <p className="num mt-1 text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatMoney(receive, settings.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              You owe
            </p>
            <p className="num mt-1 text-xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
              {formatMoney(owe, settings.currency)}
            </p>
          </div>
        </div>
      </header>

      <main className="space-y-3 px-6 pb-16 pt-4">
        {k.people.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground/70">
            No people yet. Add someone to start tracking.
          </p>
        )}
        {k.people.map((p) => (
          <PersonBlock
            key={p.id}
            person={p}
            currency={settings.currency}
            api={k}
          />
        ))}
      </main>

      <Fab label="Add person" onClick={() => setAddOpen(true)} />

      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          if (!v) setNewName("");
          setAddOpen(v);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add person</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Name
            </Label>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Alex Morgan"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newName.trim()) {
                  k.addPerson(newName.trim());
                  setNewName("");
                  setAddOpen(false);
                }
              }}
            >
              Add person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PersonBlock({
  person,
  currency,
  api,
}: {
  person: Person;
  currency: string;
  api: ReturnType<typeof useKhatabook>;
}) {
  const balance = personBalance(person);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.name);
  const [entryOpen, setEntryOpen] = useState(false);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<LedgerEntry["type"]>("lent");

  return (
    <section className="space-y-3 rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => !editing && api.togglePerson(person.id)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/55 bg-card text-foreground">
            <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <ChevronDown
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-background text-muted-foreground transition-transform duration-300 ease-out ${
                person.collapsed ? "-rotate-90" : "rotate-0"
              }`}
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
                    if (name.trim()) api.renamePerson(person.id, name.trim());
                    setEditing(false);
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <h2 className="truncate text-lg font-semibold tracking-tight">
                  {person.name}
                </h2>
                <p className="text-xs text-muted-foreground/70">
                  {balance === 0
                    ? "Settled up"
                    : balance > 0
                      ? "Will receive"
                      : "You owe"}
                </p>
              </>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <span
            className={`num text-base font-semibold ${
              balance > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : balance < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : ""
            }`}
          >
            {formatMoney(Math.abs(balance), currency)}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 transition-colors duration-200 hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1">
              <button
                onClick={() => setEditing(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>
              <button
                onClick={() => setEntryOpen(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Check className="h-3.5 w-3.5" /> Add entry
              </button>
              <button
                onClick={() => api.deletePerson(person.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          person.collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-1">
            {person.entries.map((e) => (
              <li key={e.id}>
                <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                      {e.note || (e.type === "lent" ? "Lent" : "Borrowed")}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60">{e.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`num text-sm font-semibold ${
                        e.type === "lent"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {e.type === "lent" ? "+" : "-"}
                      {formatMoney(e.amount, currency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => api.deleteEntry(person.id, e.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            className="mt-1 h-11 w-full justify-start px-2 text-sm text-muted-foreground"
            onClick={() => setEntryOpen(true)}
          >
            Add entry
          </Button>
        </div>
      </div>

      <Dialog
        open={entryOpen}
        onOpenChange={(v) => {
          if (!v) {
            setNote("");
            setAmount("");
            setType("lent");
          }
          setEntryOpen(v);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New entry — {person.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as LedgerEntry["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lent">You gave (they owe you)</SelectItem>
                  <SelectItem value="borrowed">You got (you owe)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Note
              </Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Dinner split"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Amount
              </Label>
              <Input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEntryOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const v = parseFloat(amount);
                if (Number.isNaN(v)) return;
                api.addEntry(person.id, {
                  note: note.trim(),
                  amount: v,
                  type,
                  date: new Date().toISOString().slice(0, 10),
                });
                setNote("");
                setAmount("");
                setEntryOpen(false);
              }}
            >
              Add entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}