import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, ChevronRight, TrendingUp, TrendingDown, Landmark, PieChart, Coins, Briefcase, Home, Wallet as WalletIcon, HelpCircle, Pencil, Archive, History, Check, X, Edit2, ChevronDown, List } from "lucide-react";
import { useNetWorth, formatMoney, useSettings, type AssetType, useNetWorthRecurring, type NetWorthAsset, type AssetEntry } from "../lib/finance-store";
import { Fab } from "../components/Fab";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";

export const Route = createFileRoute("/networth")({
  head: () => ({
    meta: [
      { title: "Net Worth — Ledger" },
      { name: "description", content: "Track your total assets and financial growth." },
    ],
  }),
  component: NetWorthPage,
});

const ASSET_TYPES: AssetType[] = [
  "PPF", "EPF", "EPS", "NPS", "Mutual Funds", "Stocks", "Foreign Stocks", 
  "Gold", "FD", "RD", "Savings", "Cash", "Crypto", "Property", "Other"
];

const TYPE_ICONS: Record<string, any> = {
  "PPF": Landmark,
  "EPF": Briefcase,
  "Mutual Funds": PieChart,
  "Stocks": TrendingUp,
  "Gold": Coins,
  "Property": Home,
  "Savings": WalletIcon,
  "Other": HelpCircle,
};

function NetWorthPage() {
  const nw = useNetWorth();
  useNetWorthRecurring(nw);

  const { settings } = useSettings();
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState<NetWorthAsset | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "Savings" as AssetType,
    currentValue: "",
    recurringAmount: "",
    recurringDay: "1"
  });

  const visibleAssets = nw.assets.filter(a => !a.archived).sort((a, b) => a.name.localeCompare(b.name));
  const total = visibleAssets.reduce((sum, a) => sum + a.currentValue, 0);

  const pendingEntries = useMemo(() => {
    const list: { asset: NetWorthAsset; entry: AssetEntry }[] = [];
    nw.assets.forEach(asset => {
      asset.entries.forEach(entry => {
        if (entry.isPending) list.push({ asset, entry });
      });
    });
    return list;
  }, [nw.assets]);

  if (!nw.hydrated) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-10 pb-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">Net Worth</h1>
          {pendingEntries.length > 0 && (
            <Button variant="outline" size="sm" className="h-8 rounded-full border-primary/30 text-xs font-semibold" onClick={() => setUpdateOpen(true)}>
              Update Month
            </Button>
          )}
        </div>
        <div className="mt-4 rounded-2xl border border-border/40 bg-card px-4 py-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Net Worth</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {settings.hideNWBalances ? "••••••" : formatMoney(total, settings.currency)}
            </p>
          </div>
        </div>
      </header>
      
      <main className="px-6 space-y-8 pt-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Assets</h2>
          </div>
          <div className={`grid gap-3 ${settings.nwColumns === 4 ? 'grid-cols-4' : settings.nwColumns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {visibleAssets.map(a => {
              const Icon = TYPE_ICONS[a.type] || TYPE_ICONS["Other"];
              const hasPending = a.entries.some(e => e.isPending);
              return (
                <div key={a.id} onClick={() => setManageOpen(a)} className="group relative flex flex-col justify-between rounded-2xl border border-border/40 bg-card p-4 transition-all active:scale-[0.98] active:bg-accent/50 cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-background border border-border/20 shadow-sm relative">
                      <Icon className="h-4 w-4 opacity-70" strokeWidth={2} />
                      {hasPending && <div className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />}
                    </div>
                  </div>
                  <div>
                    <p className="truncate text-[11px] font-semibold text-muted-foreground/90 leading-tight">{a.name}</p>
                    <p className="mt-0.5 text-[14px] font-bold tabular-nums tracking-tight">
                        {settings.hideNWBalances ? "•••" : formatMoney(a.currentValue, settings.currency)}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {visibleAssets.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-muted-foreground/60">No active assets tracked.</p>
                <Button variant="link" onClick={() => setAddOpen(true)} className="mt-1 text-xs">Add your first asset</Button>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-4">Activity</h2>
          <div className="space-y-3">
            {nw.activity.length > 0 ? (
                nw.activity.slice(0, 5).map(act => (
                    <div key={act.id} className="flex items-center justify-between text-xs px-1">
                        <span className="text-foreground/80">{act.action}</span>
                        <span className="text-muted-foreground/50 tabular-nums">
                            {new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                ))
            ) : (
                <p className="text-xs text-muted-foreground/50 px-1">No recent activity.</p>
            )}
          </div>
        </section>
      </main>
      
      <Fab label="Add asset" onClick={() => setAddOpen(true)} />

      {/* Monthly Update Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Monthly Update</DialogTitle>
            <DialogDescription>Review and confirm recurring contributions for {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {pendingEntries.map(({ asset, entry }) => (
                <div key={entry.id} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{asset.name}</span>
                        <span className="text-[10px] text-muted-foreground/60">{entry.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                            <Input 
                                className="h-9 pl-6 text-sm tabular-nums" 
                                defaultValue={entry.amount}
                                onChange={(e) => {
                                    // Local state handling could be better but for confirmation we'll just read from ref or use confirmRecurring
                                }}
                                id={`pending-${entry.id}`}
                            />
                        </div>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => nw.skipRecurring(asset.id, entry.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600" onClick={() => {
                            const val = parseFloat((document.getElementById(`pending-${entry.id}`) as HTMLInputElement).value);
                            if (!isNaN(val)) nw.confirmRecurring(asset.id, entry.id, val);
                        }}>
                            <Check className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setUpdateOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Asset Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
              <Input 
                placeholder="e.g. HDFC Savings" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
                    <Select 
                        value={formData.type} 
                        onValueChange={(v: AssetType) => setFormData({ ...formData, type: v })}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Value</Label>
                    <Input 
                        inputMode="decimal" 
                        placeholder="0.00" 
                        value={formData.currentValue}
                        onChange={e => setFormData({ ...formData, currentValue: e.target.value })}
                    />
                </div>
            </div>
            <div className="pt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">Recurring Contribution</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
                        <Input 
                            placeholder="Optional" 
                            value={formData.recurringAmount}
                            onChange={e => setFormData({ ...formData, recurringAmount: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Day of Month</Label>
                        <Input 
                            type="number" 
                            min="1" max="31"
                            value={formData.recurringDay}
                            onChange={e => setFormData({ ...formData, recurringDay: e.target.value })}
                        />
                    </div>
                </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const val = parseFloat(formData.currentValue);
              if (formData.name && !isNaN(val)) {
                nw.addAsset({
                  name: formData.name,
                  type: formData.type,
                  currentValue: val,
                  recurringAmount: formData.recurringAmount ? parseFloat(formData.recurringAmount) : undefined,
                  recurringDay: formData.recurringDay ? parseInt(formData.recurringDay) : undefined,
                });
                setAddOpen(false);
                setFormData({ name: "", type: "Savings", currentValue: "", recurringAmount: "", recurringDay: "1" });
              }
            }}>Save Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Asset Dialog */}
      <Dialog open={!!manageOpen} onOpenChange={(open) => !open && setManageOpen(null)}>
        {manageOpen && (
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-muted/30 border border-border/20">
                            {(() => {
                                const Icon = TYPE_ICONS[manageOpen.type] || TYPE_ICONS["Other"];
                                return <Icon className="h-5 w-5 opacity-70" />;
                            })()}
                        </div>
                        <div>
                            <DialogTitle>{manageOpen.name}</DialogTitle>
                            <DialogDescription>{manageOpen.type}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Value</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                className="h-12 text-xl font-bold tabular-nums" 
                                value={manageOpen.currentValue}
                                readOnly
                            />
                            <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl" onClick={() => {
                                const newVal = prompt("Enter new current value:", manageOpen.currentValue.toString());
                                if (newVal !== null) {
                                    const val = parseFloat(newVal);
                                    if (!isNaN(val)) {
                                        nw.updateAsset(manageOpen.id, { currentValue: val });
                                        nw.addActivity(`${manageOpen.name} value updated`);
                                        setManageOpen(prev => prev ? { ...prev, currentValue: val } : null);
                                    }
                                }
                            }}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-3.5 text-left transition-all active:bg-muted/50" onClick={() => {
                            const newName = prompt("Rename asset:", manageOpen.name);
                            if (newName) nw.updateAsset(manageOpen.id, { name: newName });
                        }}>
                            <div className="flex items-center gap-3">
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Rename</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                        </button>
                        
                        <button className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-3.5 text-left transition-all active:bg-muted/50" onClick={() => {
                            const amt = prompt("Recurring amount (₹):", manageOpen.recurringAmount?.toString() || "");
                            if (amt !== null) {
                                nw.updateAsset(manageOpen.id, { 
                                    recurringAmount: amt === "" ? undefined : parseFloat(amt),
                                    recurringDay: manageOpen.recurringDay || 1
                                });
                            }
                        }}>
                            <div className="flex items-center gap-3">
                                <History className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Recurring Contribution</span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                {manageOpen.recurringAmount ? formatMoney(manageOpen.recurringAmount, settings.currency) : "None"}
                            </span>
                        </button>

                        <button className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-card p-3.5 text-left transition-all active:bg-muted/50 text-destructive" onClick={() => {
                            if (confirm(`Archive ${manageOpen.name}? Historical data will be preserved.`)) {
                                nw.archiveAsset(manageOpen.id);
                                setManageOpen(null);
                            }
                        }}>
                            <div className="flex items-center gap-3">
                                <Archive className="h-4 w-4" />
                                <span className="text-sm font-medium">Archive Asset</span>
                            </div>
                        </button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" className="w-full" onClick={() => setManageOpen(null)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
