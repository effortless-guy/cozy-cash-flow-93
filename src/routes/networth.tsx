import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, memo } from "react";
import { Plus, ChevronRight, TrendingUp, TrendingDown, Landmark, PieChart, Coins, Briefcase, Home, Wallet as WalletIcon, HelpCircle, Pencil, Archive, History, Check, X, Edit2, ChevronDown, List, LucideIcon, BarChart3 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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
      { title: "Net Worth — MoneyStory" },
      { name: "description", content: "Track your total assets and financial growth." },
    ],
  }),
  component: NetWorthPage,
});

const ASSET_TYPES: AssetType[] = [
  "PPF", "EPF", "EPS", "NPS", "Mutual Funds", "Stocks", "Foreign Stocks", 
  "Gold", "FD", "RD", "Emergency Fund", "Savings", "Cash", "Crypto", "Property", "Other"
];

const TYPE_ICONS: Record<string, any> = {
  "PPF": Landmark,
  "EPF": Briefcase,
  "NPS": Landmark,
  "Mutual Funds": PieChart,
  "Stocks": TrendingUp,
  "Foreign Stocks": TrendingUp,
  "Gold": Coins,
  "Property": Home,
  "Savings": WalletIcon,
  "Emergency Fund": WalletIcon,
  "Cash": WalletIcon,
  "Crypto": Coins,
  "FD": Landmark,
  "RD": Landmark,
  "Other": HelpCircle,
};

function NetWorthPage() {
  const { assets, activity, hydrated, addAsset, updateAsset, addEntry, confirmRecurring, skipRecurring, addActivity, updateEntry, archiveAsset, deleteEntry } = useNetWorth();
  const nwApi = useMemo(() => ({ assets, activity, hydrated, addAsset, updateAsset, addEntry, confirmRecurring, skipRecurring, addActivity, updateEntry, archiveAsset, deleteEntry }), [assets, activity, hydrated, addAsset, updateAsset, addEntry, confirmRecurring, skipRecurring, addActivity, updateEntry, archiveAsset, deleteEntry]);
  
  useNetWorthRecurring(nwApi);

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

  // Sync manageOpen with latest data from store
  useEffect(() => {
    if (manageOpen) {
      const updated = assets.find(a => a.id === manageOpen.id);
      if (updated) setManageOpen(updated);
      else setManageOpen(null);
    }
  }, [assets]);

  const visibleAssets = useMemo(() => 
    assets.filter(a => !a.archived).sort((a, b) => a.name.localeCompare(b.name)),
    [assets]
  );
  
  const total = useMemo(() => 
    visibleAssets.reduce((sum, a) => sum + a.currentValue, 0),
    [visibleAssets]
  );

  const pendingEntries = useMemo(() => {
    const list: { asset: NetWorthAsset; entry: AssetEntry }[] = [];
    assets.forEach(asset => {
      asset.entries.forEach(entry => {
        if (entry.isPending) list.push({ asset, entry });
      });
    });
    return list;
  }, [assets]);
  
  const chartData = useMemo(() => {
    // Collect all unique dates from all assets' entries
    const datePoints = new Set<string>();
    assets.forEach(asset => {
      asset.entries.forEach(e => {
        if (!e.isPending) datePoints.add(e.date);
      });
    });
    
    // Also include today's state
    const today = new Date().toISOString().slice(0, 10);
    datePoints.add(today);
    
    const sortedDates = Array.from(datePoints).sort();
    
    // For each date, calculate the total net worth at that point in time
    return sortedDates.map(date => {
      let totalOnDate = 0;
      assets.forEach(asset => {
        // Find the most recent entry for this asset that is on or before this date
        const entry = asset.entries
          .filter(e => !e.isPending && e.date <= date)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        
        if (entry) {
          totalOnDate += entry.amount;
        } else if (date === today) {
          // If no history but it's today, use current value
          totalOnDate += asset.currentValue;
        }
      });
      
      return {
        date,
        formattedDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: totalOnDate,
      };
    });
  }, [assets]);

  if (!hydrated) return <div className="p-6 text-muted-foreground">Loading...</div>;

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
        <div className="mt-4 rounded-2xl border border-border/40 bg-card px-4 py-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/5 dark:bg-card/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Net Worth</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {settings.hideNWBalances ? "••••••" : formatMoney(total, settings.currency)}
            </p>
          </div>
        </div>
      </header>
      
      <main className="px-6 space-y-8 pt-2">
        {chartData.length > 1 && (
          <section className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/5 dark:bg-card/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Trend</h2>
              <BarChart3 className="h-3.5 w-3.5 opacity-20" />
            </div>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis 
                    dataKey="formattedDate" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)', opacity: 0.5, fontWeight: 600 }}
                    minTickGap={30}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-border/40 bg-card p-2 shadow-xl backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                              {payload[0].payload.formattedDate}
                            </p>
                            <p className="text-sm font-bold text-foreground mt-0.5">
                              {formatMoney(payload[0].value as number, settings.currency)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Portfolio</h2>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="size-8 rounded-full opacity-40 hover:opacity-100">
                    <List className="h-3.5 w-3.5" />
                </Button>
            </div>
          </div>
          <div className={`grid gap-4 ${settings.nwColumns === 4 ? 'grid-cols-4' : settings.nwColumns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {visibleAssets.map(a => (
              <AssetCard 
                key={a.id} 
                asset={a} 
                currency={settings.currency} 
                hideBalance={settings.hideNWBalances} 
                onClick={() => setManageOpen(a)} 
              />
            ))}
            
            {visibleAssets.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-muted-foreground/60">No active assets tracked.</p>
                <Button variant="link" onClick={() => setAddOpen(true)} className="mt-1 text-xs">Add your first asset</Button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-muted/20 -mx-6 px-6 py-8 dark:bg-muted/5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {activity.length > 0 ? (
                activity.slice(0, 5).map(act => (
                    <div key={act.id} className="flex items-start justify-between gap-4 group">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground/80">{act.action}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 mt-1">
                                {new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="h-px flex-1 bg-border/20 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))
            ) : (
                <p className="text-sm italic text-muted-foreground/30 text-center py-4">No recent activity logged.</p>
            )}
          </div>
        </section>
      </main>
      
      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40">
        <Fab label="Add asset" onClick={() => setAddOpen(true)} />
      </div>

      {/* Monthly Update Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-3xl border-none">
          <div className="bg-primary/5 px-6 pt-8 pb-6 dark:bg-primary/10">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">Monthly Update</DialogTitle>
                <DialogDescription className="text-xs font-semibold uppercase tracking-widest text-primary/60 mt-1">
                    {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar dark:bg-background/95">
            {pendingEntries.map(({ asset, entry }) => (
                <div key={entry.id} className="group relative rounded-2xl border border-border/40 bg-card p-4 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{asset.name}</span>
                        <span className="text-[10px] font-bold tabular-nums text-muted-foreground/40">{entry.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/40">₹</span>
                            <Input 
                                className="h-11 pl-7 text-sm font-bold tabular-nums rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
                                defaultValue={entry.amount}
                                id={`pending-${entry.id}`}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/5" onClick={() => skipRecurring(asset.id, entry.id)}>
                                <X className="h-5 w-5 opacity-40" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50" onClick={() => {
                                const val = parseFloat((document.getElementById(`pending-${entry.id}`) as HTMLInputElement).value);
                                if (!isNaN(val)) confirmRecurring(asset.id, entry.id, val);
                            }}>
                                <Check className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
          </div>
          
          <div className="p-6 pt-2 dark:bg-background/95 border-t border-border/10">
            <Button className="w-full h-12 rounded-2xl font-bold tracking-tight shadow-lg shadow-primary/10" onClick={() => setUpdateOpen(false)}>
              Done for {new Date().toLocaleDateString(undefined, { month: 'short' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Asset Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-3xl border-none">
          <div className="bg-muted/30 px-6 pt-8 pb-6 dark:bg-muted/10">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">New Asset</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Classification & Initial Value</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-5 dark:bg-background/95">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Asset Type</Label>
                <Select 
                    value={formData.type} 
                    onValueChange={(v: AssetType) => setFormData({ ...formData, type: v })}
                >
                    <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-none text-sm font-medium px-4">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/40">
                        {ASSET_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs font-medium rounded-xl">{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Amount</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/40">₹</span>
                    <Input 
                        inputMode="decimal" 
                        className="h-12 pl-7 rounded-2xl bg-muted/20 border-none text-sm font-bold tabular-nums focus-visible:ring-1 focus-visible:ring-primary/20"
                        placeholder="0.00" 
                        value={formData.currentValue}
                        onChange={e => setFormData({ ...formData, currentValue: e.target.value })}
                    />
                </div>
            </div>

            <div className="pt-2">
                <div className="flex items-center justify-between mb-4 px-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Recurring</Label>
                    <Switch checked={!!formData.recurringAmount} onCheckedChange={(checked) => setFormData({...formData, recurringAmount: checked ? "0" : ""})} />
                </div>
            </div>
          </div>
          
          <div className="p-6 pt-0 flex gap-3 dark:bg-background/95">
            <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-bold text-muted-foreground" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/10" onClick={() => {
              const val = parseFloat(formData.currentValue);
              if (!isNaN(val)) {
                // Determine name from type
                let assetName = formData.type as string;
                if (formData.type === "Savings") assetName = "Savings Account";
                else if (formData.type === "Emergency Fund") assetName = "Emergency Fund";

                addAsset({
                  name: assetName,
                  type: formData.type,
                  currentValue: val,
                  recurringAmount: formData.recurringAmount ? parseFloat(formData.recurringAmount) : undefined,
                  recurringDay: 1, // Default to 1st
                });
                setAddOpen(false);
                setFormData({ name: "", type: "Savings", currentValue: "", recurringAmount: "", recurringDay: "1" });
              }
            }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Asset Dialog */}
      <Dialog open={!!manageOpen} onOpenChange={(open) => !open && setManageOpen(null)}>
        {manageOpen && (
            <DialogContent className="max-w-sm p-0 overflow-hidden rounded-3xl border-none">
                <div className="bg-muted/30 px-6 pt-8 pb-6 dark:bg-muted/10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-background border border-border/20 shadow-sm dark:bg-card">
                            {(() => {
                                const Icon = TYPE_ICONS[manageOpen.type] || TYPE_ICONS["Other"];
                                return <Icon className="h-6 w-6 opacity-80" />;
                            })()}
                        </div>
                        <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setManageOpen(null)}>
                            <X className="h-5 w-5 opacity-40" />
                        </Button>
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold">{manageOpen.name}</DialogTitle>
                        <DialogDescription className="text-xs font-medium uppercase tracking-widest opacity-60 mt-0.5">{manageOpen.type}</DialogDescription>
                    </div>
                    
                    <div className="mt-6 flex items-baseline gap-2">
                        <span className="text-3xl font-bold tabular-nums tracking-tight">
                            {settings.hideNWBalances ? "••••••" : formatMoney(manageOpen.currentValue, settings.currency)}
                        </span>
                        <Button variant="ghost" size="icon" className="size-8 rounded-full opacity-40 hover:opacity-100" onClick={() => {
                            const newVal = prompt("Update current value:", manageOpen.currentValue.toString());
                            if (newVal !== null) {
                                const val = parseFloat(newVal);
                                if (!isNaN(val)) {
                                    updateAsset(manageOpen.id, { currentValue: val });
                                    addActivity(`${manageOpen.name} value updated`);
                                    setManageOpen(prev => prev ? { ...prev, currentValue: val } : null);
                                }
                            }
                        }}>
                            <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="p-6 space-y-3 dark:bg-background/95">
                    <button className="flex w-full items-center justify-between rounded-2xl bg-muted/20 p-4 transition-all active:scale-[0.98] active:bg-muted/40" onClick={() => {
                        const newName = prompt("Rename asset:", manageOpen.name);
                        if (newName) updateAsset(manageOpen.id, { name: newName });
                    }}>
                        <div className="flex items-center gap-3">
                            <Pencil className="h-4 w-4 opacity-60" />
                            <span className="text-sm font-semibold">Rename Asset</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-20" />
                    </button>
                    
                    <button className="flex w-full items-center justify-between rounded-2xl bg-muted/20 p-4 transition-all active:scale-[0.98] active:bg-muted/40" onClick={() => {
                        const amt = prompt("Recurring amount (₹):", manageOpen.recurringAmount?.toString() || "");
                        if (amt !== null) {
                            updateAsset(manageOpen.id, { 
                                recurringAmount: amt === "" ? undefined : parseFloat(amt),
                                recurringDay: manageOpen.recurringDay || 1
                            });
                        }
                    }}>
                        <div className="flex items-center gap-3">
                            <History className="h-4 w-4 opacity-60" />
                            <span className="text-sm font-semibold">Recurring</span>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">
                            {manageOpen.recurringAmount ? formatMoney(manageOpen.recurringAmount, settings.currency) : "Off"}
                        </span>
                    </button>

                    <div className="pt-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">History</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {manageOpen.entries.length > 0 ? (
                                manageOpen.entries.slice().reverse().map(e => (
                                    <div key={e.id} className="flex items-center justify-between rounded-xl border border-border/20 px-3 py-2 text-xs dark:bg-card/30">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{formatMoney(e.amount, settings.currency)}</span>
                                            <span className="text-[10px] opacity-40">{e.date}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="size-6 rounded-lg" onClick={() => {
                                                const newAmt = prompt("Edit amount:", e.amount.toString());
                                                if (newAmt !== null) updateEntry(manageOpen.id, e.id, { amount: parseFloat(newAmt) });
                                            }}>
                                                <Pencil className="size-3 opacity-40" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[10px] italic opacity-40 px-1">No contribution history yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button variant="outline" className="flex-1 rounded-2xl border-border/40 text-xs font-bold text-destructive hover:bg-destructive/5" onClick={() => {
                            if (confirm(`Archive ${manageOpen.name}? Historical data will be preserved.`)) {
                                archiveAsset(manageOpen.id);
                                setManageOpen(null);
                            }
                        }}>
                            Archive
                        </Button>
                        <Button variant="outline" className="flex-1 rounded-2xl border-border/40 text-xs font-bold" onClick={() => setManageOpen(null)}>
                            Done
                        </Button>
                    </div>
                </div>
            </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

const AssetCard = memo(({ 
  asset, 
  currency, 
  hideBalance, 
  onClick 
}: { 
  asset: NetWorthAsset; 
  currency: string; 
  hideBalance?: boolean; 
  onClick: () => void 
}) => {
  const Icon = TYPE_ICONS[asset.type] || TYPE_ICONS["Other"];
  const hasPending = asset.entries.some(e => e.isPending);
  
  return (
    <div 
      onClick={onClick} 
      className="group relative flex flex-col justify-between rounded-2xl border border-border/40 bg-card p-4 transition-all active:scale-[0.98] hover:bg-muted/30 cursor-pointer ring-1 ring-black/5 dark:ring-white/5 dark:bg-card/40"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-background border border-border/20 shadow-sm relative dark:bg-card">
          <Icon className="h-4 w-4 opacity-70" strokeWidth={2.5} />
          {hasPending && <div className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />}
        </div>
      </div>
      <div>
        <p className="truncate text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 leading-tight mb-1">{asset.name}</p>
        <p className="text-[16px] font-bold tabular-nums tracking-tight">
            {hideBalance ? "••••" : formatMoney(asset.currentValue, currency)}
        </p>
      </div>
    </div>
  );
});

AssetCard.displayName = "AssetCard";
