import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Timer } from "lucide-react";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview, addFoodItem, removeFoodItem } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/shelf-life")({
  head: () => ({ meta: [{ title: "Shelf Life · FRIGOS" }] }),
  component: ShelfLifePage,
});

const CATEGORY_DEFAULTS: Record<string, { Ea: number; hours: number }> = {
  dairy: { Ea: 80, hours: 168 },
  fruits: { Ea: 75, hours: 240 },
  vegetables: { Ea: 85, hours: 120 },
  meat: { Ea: 95, hours: 72 },
  bakery: { Ea: 65, hours: 96 },
};

function ShelfLifePage() {
  const { data, refresh } = useLiveQuery(() => getOverview(), 3000);
  const foods = data?.foods ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "dairy", zone: "main" });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    const d = CATEGORY_DEFAULTS[form.category] ?? CATEGORY_DEFAULTS.dairy;
    await addFoodItem({ data: { name: form.name, category: form.category, zone: form.zone, baseShelfHours: d.hours, EaKJ: d.Ea } });
    toast.success(`${form.name} added · tracking spoilage`);
    setForm({ name: "", category: "dairy", zone: "main" });
    setOpen(false);
    refresh();
  };

  const handleRemove = async (id: string, name: string) => {
    await removeFoodItem({ data: { id } });
    toast.success(`${name} removed`);
    refresh();
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Operations · Inventory"
        title="Shelf-life intelligence"
        description="Each item degrades according to live Arrhenius kinetics, humidity, and ethylene exposure."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" />Add item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add food item</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cheddar" /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(CATEGORY_DEFAULTS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Zone</Label>
                  <Select value={form.zone} onValueChange={v => setForm({ ...form, zone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["main", "top", "crisper", "door", "freezer"].map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="py-2 text-left font-medium">Item</th>
                <th className="py-2 text-left font-medium">Category</th>
                <th className="py-2 text-left font-medium">Zone</th>
                <th className="py-2 text-left font-medium">Spoilage</th>
                <th className="py-2 text-right font-medium">Rate /h</th>
                <th className="py-2 text-right font-medium">Remaining</th>
                <th className="py-2 text-right font-medium">Risk</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {foods.map((f: any) => (
                  <motion.tr
                    key={f.id} layout
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="border-b border-border/30 hover:bg-surface/40"
                  >
                    <td className="py-3 font-medium">{f.name}</td>
                    <td className="py-3 text-muted-foreground capitalize">{f.category}</td>
                    <td className="py-3 text-muted-foreground capitalize">{f.zone_id}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-surface-elev">
                          <motion.div
                            initial={false}
                            animate={{ width: `${Math.min(100, f.spoilage_pct)}%` }}
                            className={`h-full rounded-full ${
                              f.risk === "critical" ? "bg-destructive" :
                              f.risk === "warning" ? "bg-[oklch(0.82_0.16_75)]" :
                              "bg-gradient-to-r from-primary to-chart-5"
                            }`}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{f.spoilage_pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{f.current_rate?.toFixed(2)}%</td>
                    <td className="py-3 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Timer className="h-3 w-3 opacity-50" />
                        {f.remaining_hours == null ? "—" : `${f.remaining_hours.toFixed(0)}h`}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <RiskBadge risk={f.risk} />
                    </td>
                    <td className="py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleRemove(f.id, f.name)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { c: string; bg: string }> = {
    safe: { c: "oklch(0.78 0.18 155)", bg: "oklch(0.78 0.18 155 / 0.12)" },
    warning: { c: "oklch(0.82 0.16 75)", bg: "oklch(0.82 0.16 75 / 0.12)" },
    critical: { c: "oklch(0.65 0.24 18)", bg: "oklch(0.65 0.24 18 / 0.15)" },
  };
  const s = map[risk] ?? map.safe;
  return <span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider" style={{ background: s.bg, color: s.c }}>{risk}</span>;
}
