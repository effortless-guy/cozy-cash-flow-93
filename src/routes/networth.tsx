import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useNetWorth, formatMoney, useSettings } from "../lib/finance-store";
import { Fab } from "../components/Fab";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/networth")({
  component: NetWorthPage,
});

function NetWorthPage() {
  const nw = useNetWorth();
  const { settings } = useSettings();
  
  const total = nw.assets.reduce((sum, a) => sum + a.currentValue, 0);

  if (!nw.hydrated) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 bg-background/85 px-6 pt-8 pb-6 backdrop-blur-md">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Net Worth</h1>
        <div className="mt-4 rounded-2xl border border-border/40 bg-card px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Value</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{formatMoney(total, settings.currency)}</p>
        </div>
      </header>
      
      <main className="px-6 space-y-6">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Assets</h2>
          <div className="grid grid-cols-2 gap-4">
            {nw.assets.map(a => (
              <div key={a.id} className="rounded-2xl border border-border/40 bg-card p-4 transition-all hover:border-border/60">
                <p className="text-sm font-semibold text-muted-foreground">{a.name}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{formatMoney(a.currentValue, settings.currency)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <Fab label="Add asset" onClick={() => {}} />
    </div>
  );
}
