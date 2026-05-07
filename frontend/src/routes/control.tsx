import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Snowflake, Wind, Power, Save } from "lucide-react";
import { useLiveQuery } from "@/hooks/use-live-query";
import { getOverview, updateSettings } from "@/fridge.functions";
import { PageHeader, Panel } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const Route = createFileRoute("/control")({
  head: () => ({ meta: [{ title: "Control Panel · FRIGOS" }] }),
  component: ControlPage,
});

function ControlPage() {
  const { data, refresh } = useLiveQuery(() => getOverview(), 3000);
  const s = data?.settings;
  const [target, setTarget] = useState(4);
  const [kp, setKp] = useState(2);
  const [ki, setKi] = useState(0.1);
  const [kd, setKd] = useState(0.5);
  const [override, setOverride] = useState(false);
  const [fan, setFan] = useState(false);
  const [comp, setComp] = useState(false);

  useEffect(() => {
    if (!s) return;
    setTarget(Number(s.target_temp));
    setKp(Number(s.kp)); setKi(Number(s.ki)); setKd(Number(s.kd));
    setOverride(!!s.manual_override);
    setFan(!!s.fan_manual); setComp(!!s.compressor_manual);
  }, [s]);

  const save = async () => {
    await updateSettings({ data: { target_temp: target, kp, ki, kd, manual_override: override, fan_manual: fan, compressor_manual: comp } });
    toast.success("Controller updated");
    refresh();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Operations · Control"
        title="Cooling controller"
        description="Tune the PID loop or override actuators directly. Changes propagate to ESP32 on next tick."
        action={<Button onClick={save} size="sm"><Save className="mr-1.5 h-3.5 w-3.5" />Apply</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Setpoint">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Target temperature</Label>
          <div className="mt-3 flex items-center gap-4">
            <div className="font-display text-5xl font-semibold text-primary tabular-nums">{target.toFixed(1)}°</div>
            <div className="flex-1">
              <Slider value={[target]} min={-2} max={10} step={0.1} onValueChange={(v) => setTarget(v[0])} />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>-2°C</span><span>10°C</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="PID tuning">
          <div className="grid grid-cols-3 gap-3">
            <PidField label="Kp" value={kp} onChange={setKp} />
            <PidField label="Ki" value={ki} onChange={setKi} />
            <PidField label="Kd" value={kd} onChange={setKd} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Higher Kp = aggressive cooling. Higher Ki = corrects steady-state drift. Higher Kd = damps overshoot.
          </p>
        </Panel>

        <Panel title="Manual override" className="lg:col-span-2">
          <div className="flex items-center justify-between rounded-md border border-border/50 bg-surface p-4">
            <div>
              <div className="font-medium">Bypass PID controller</div>
              <div className="text-xs text-muted-foreground">Forces compressor & fan to the states below.</div>
            </div>
            <Switch checked={override} onCheckedChange={setOverride} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ActuatorCard
              label="Compressor" icon={<Snowflake className="h-4 w-4" />}
              on={comp} setOn={setComp} disabled={!override}
              live={data?.latest?.compressor_on}
            />
            <ActuatorCard
              label="Fan" icon={<Wind className="h-4 w-4" />}
              on={fan} setOn={setFan} disabled={!override}
              live={data?.latest?.fan_on}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PidField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type="number" step="0.05" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="mt-1" />
    </div>
  );
}

function ActuatorCard({ label, icon, on, setOn, disabled, live }: {
  label: string; icon: React.ReactNode; on: boolean; setOn: (b: boolean) => void;
  disabled: boolean; live?: boolean;
}) {
  return (
    <div className={`rounded-md border border-border/50 p-4 ${disabled ? "opacity-50" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
        <span className={`text-[10px] uppercase tracking-wider ${live ? "text-primary" : "text-muted-foreground"}`}>
          live: {live ? "ON" : "off"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <Power className={`h-6 w-6 ${on && !disabled ? "text-primary" : "text-muted-foreground"}`} />
        <Switch checked={on} onCheckedChange={setOn} disabled={disabled} />
      </div>
    </div>
  );
}
