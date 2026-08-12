import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, ChevronRight, TrendingUp, TrendingDown, Landmark, PieChart, Coins, Briefcase, Home, Wallet as WalletIcon, HelpCircle } from "lucide-react";
import { useNetWorth, formatMoney, useSettings, type AssetType } from "../lib/finance-store";
import { Fab } from "../components/Fab";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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
  const { settings } = useSettings();
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Savings" as AssetType,
    currentValue: "",
  });

  const total = nw.assets.reduce((sum, a) => sum + a.currentValue, 0);

  if (!nw.hydrated) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-10 pb-6 backdrop-blur-md">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Net Worth</h1>
        <div className="mt-4 rounded-2xl border border-border/40 bg-card px-4 py-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Net Worth</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{formatMoney(total, settings.currency)}</p>
          </div>
        </div>
      </header>
      
      <main className="px-6 space-y-6 pt-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Assets</h2>
          </div>
          <div className={`grid gap-3 ${settings.nwColumns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {nw.assets.map(a => {
              const Icon = TYPE_ICONS[a.type] || TYPE_ICONS["Other"];
              return (
                <div key={a.id} className="group relative flex flex-col justify-between rounded-2xl border border-border/40 bg-card p-4 transition-all active:scale-[0.98] active:bg-accent/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-background border border-border/20 shadow-sm">
                      <Icon className="h-4 w-4 opacity-70" strokeWidth={2} />
                    </div>
                  </div>
                  <div>
                    <p className="truncate text-xs font-semibold text-muted-foreground/90">{a.name}</p>
                    <p className="mt-0.5 text-[15px] font-bold tabular-nums tracking-tight">{formatMoney(a.currentValue, settings.currency)}</p>
                  </div>
                </div>
              );
            })}
            
            {nw.assets.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-muted-foreground/60">No assets tracked yet.</p>
                <Button variant="link" onClick={() => setAddOpen(true)} className="mt-1 text-xs">Add your first asset</Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Fab label="Add asset" onClick={() => setAddOpen(true)} />

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
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Current Value</Label>
              <Input 
                inputMode="decimal" 
                placeholder="0.00" 
                value={formData.currentValue}
                onChange={e => setFormData({ ...formData, currentValue: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const val = parseFloat(formData.currentValue);
              if (formData.name && !isNaN(val)) {
                nw.addAsset({
                  name: formData.name,
                  type: formData.type,
                  currentValue: val
                });
                setAddOpen(false);
                setFormData({ name: "", type: "Savings", currentValue: "" });
              }
            }}>Save Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
