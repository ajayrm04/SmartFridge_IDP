import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Timer, Thermometer, Droplets, Wind, TrendingUp, AlertTriangle, Clock, Activity, ScanText } from "lucide-react";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview, addFoodItem, removeFoodItem, updateFoodScannedExpiry } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Tesseract from "tesseract.js";

export const Route = createFileRoute("/shelf-life")({
  head: () => ({ meta: [{ title: "Shelf Life · FRIGOS" }] }),
  component: ShelfLifePage,
});

const CATEGORY_DEFAULTS: Record<string, { Ea: number; hours: number }> = {
  dairy: { Ea: 80, hours: 56 },
  fruits: { Ea: 75, hours: 240 },
  vegetables: { Ea: 85, hours: 120 },
  meat: { Ea: 95, hours: 72 },
  bakery: { Ea: 65, hours: 96 },
};

function ShelfLifePage() {
  const { data, refresh } = useLiveQuery(() => getOverview(), 3000);
  const foods = data?.foods ?? [];
  const latest = data?.latest;
  const avgSpoilage = data?.avgSpoilage ?? 0;
  const [open, setOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "dairy", zone: "main" });
  const [scanForm, setScanForm] = useState({
    foodId: "",
    todayDate: new Date().toISOString().slice(0, 10),
    imageFile: null as File | null,
  });
  const [scanLoading, setScanLoading] = useState(false);

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

  const parseDateByTodayFormat = (rawValue: string, todayDate: string): string | null => {
    const cleaned = rawValue.trim().replace(/\s+/g, "");
    const match = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (!match) return null;

    let a = Number(match[1]);
    let b = Number(match[2]);
    let y = Number(match[3]);
    if (y < 100) y += 2000;

    const today = new Date(todayDate);
    const dayFirst = !Number.isNaN(today.getTime()) && today.getDate() > 12;
    const month = dayFirst ? b : a;
    const day = dayFirst ? a : b;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const dt = new Date(Date.UTC(y, month - 1, day));
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  };

  const extractExpiryDateFromText = (text: string, todayDate: string): string | null => {
    const upper = text.toUpperCase();
    const tokens = upper.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g) ?? [];
    for (const token of tokens) {
      const parsed = parseDateByTodayFormat(token, todayDate);
      if (parsed) return parsed;
    }
    return null;
  };

  const handleScanExpiry = async () => {
    if (!scanForm.foodId || !scanForm.imageFile || !scanForm.todayDate) {
      toast.error("Select item, today date, and image first.");
      return;
    }
    try {
      setScanLoading(true);
      const { data } = await Tesseract.recognize(scanForm.imageFile, "eng", {});
      const expiryDate = extractExpiryDateFromText(data.text, scanForm.todayDate);
      if (!expiryDate) {
        toast.error("Could not detect expiry date. Try a clearer image.");
        return;
      }
      const scannedExpiryAt = new Date(`${expiryDate}T23:59:59`).toISOString();
      await updateFoodScannedExpiry({ data: { id: scanForm.foodId, scannedExpiryAt } });
      toast.success(`Scanned expiry saved: ${new Date(scannedExpiryAt).toLocaleString()}`);
      setScanForm({
        foodId: "",
        todayDate: new Date().toISOString().slice(0, 10),
        imageFile: null,
      });
      setScanOpen(false);
      refresh();
    } catch {
      toast.error("Expiry scan failed. Please retry.");
    } finally {
      setScanLoading(false);
    }
  };

  const criticalItems = foods.filter((f: any) => f.risk === "critical").length;
  const warningItems = foods.filter((f: any) => f.risk === "warning").length;
  const safeItems = foods.filter((f: any) => f.risk === "safe").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Operations · Inventory"
        title="Shelf-life intelligence"
        description="Real-time spoilage tracking with Arrhenius kinetics, environmental factors, and predictive analytics."
        action={
          <div className="flex items-center gap-2">
            <Dialog open={scanOpen} onOpenChange={setScanOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><ScanText className="mr-1 h-3.5 w-3.5" />Scan expiry</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Scan expiry date</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Tracked item</Label>
                    <Select value={scanForm.foodId} onValueChange={v => setScanForm(prev => ({ ...prev, foodId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {foods.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Today date</Label>
                    <Input
                      type="date"
                      value={scanForm.todayDate}
                      onChange={e => setScanForm(prev => ({ ...prev, todayDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Photo (expiry label)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={e => setScanForm(prev => ({ ...prev, imageFile: e.target.files?.[0] ?? null }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleScanExpiry} disabled={scanLoading}>
                    {scanLoading ? "Scanning..." : "Run scan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
          </div>
        }
      />

      {/* Environmental Factors Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.temperature?.toFixed(1) ?? "--"}°C</div>
            <p className="text-xs text-muted-foreground">Current fridge temperature</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.humidity?.toFixed(0) ?? "--"}%</div>
            <p className="text-xs text-muted-foreground">Relative humidity level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Level</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latest?.ammonia?.toFixed(2) ?? "--"}</div>
            <p className="text-xs text-muted-foreground">Ammonia concentration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Spoilage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSpoilage}%</div>
            <p className="text-xs text-muted-foreground">Across all items</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-black-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Safe Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{safeItems}</div>
            <p className="text-xs text-green-600">Under 45% spoilage</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-black-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Warning Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{warningItems}</div>
            <p className="text-xs text-yellow-600">45-75% spoilage</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-black-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Critical Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalItems}</div>
            <p className="text-xs text-red-600">Over 75% spoilage</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Food Items Table */}
      <Panel>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Item Spoilage Details</h3>
          <p className="text-sm text-muted-foreground">Real-time spoilage rates calculated using Arrhenius kinetics with environmental factors</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="py-3 text-left font-medium">Item</th>
                <th className="py-3 text-left font-medium">Category</th>
                <th className="py-3 text-left font-medium">Zone</th>
                <th className="py-3 text-left font-medium">Spoilage Progress</th>
                <th className="py-3 text-center font-medium">Current Rate</th>
                <th className="py-3 text-center font-medium">Time Remaining</th>
                <th className="py-3 text-center font-medium">Risk Level</th>
                <th className="py-3 text-center font-medium">Environmental Impact</th>
                <th className="py-3"></th>
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
                    <td className="py-4">
                      <div>
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {f.id}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline" className="capitalize">{f.category}</Badge>
                    </td>
                    <td className="py-4 text-muted-foreground capitalize">{f.zone_id}</td>
                    <td className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Progress value={Math.min(100, f.spoilage_pct)} className="w-32 h-2" />
                          <span className="text-sm font-medium tabular-nums">{f.spoilage_pct.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Base shelf life: {f.base_shelf_life_hours}h
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="space-y-1">
                        <div className="text-lg font-bold tabular-nums text-primary">
                          {f.current_rate?.toFixed(3)}%
                        </div>
                        <div className="text-xs text-muted-foreground">per hour</div>
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs">Real-time</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <div className="space-y-1">
                        {f.remaining_hours == null ? (
                          <div className="text-muted-foreground">—</div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center gap-1 text-lg font-bold">
                              <Clock className="h-4 w-4" />
                              {f.remaining_hours.toFixed(0)}h
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.floor(f.remaining_hours / 24)}d {Math.floor(f.remaining_hours % 24)}h
                            </div>
                            <div className="pt-1 text-[11px] text-blue-400">
                              Predicted: {f.predicted_expiry_at ? new Date(f.predicted_expiry_at).toLocaleString() : "—"}
                            </div>
                            {f.scanned_expiry_at && (
                              <div className="text-[11px] text-emerald-400">
                                Scanned: {new Date(f.scanned_expiry_at).toLocaleString()}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <RiskBadge risk={f.risk} />
                    </td>
                    <td className="py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          <span>Ea: {f.activation_energy_kj} kJ/mol</span>
                        </div>
                        <div className="text-muted-foreground">
                          Stored: {new Date(f.stored_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
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

        {foods.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No food items being tracked</div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first item
            </Button>
          </div>
        )}
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
