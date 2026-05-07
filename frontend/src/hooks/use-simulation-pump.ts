import { useEffect } from "react";

// Polls /api/public/ingest every N ms to drive the simulation forward.
// Starts on mount so the dashboard always shows live-looking data.
export function useSimulationPump(intervalMs = 4000) {
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        await fetch("/api/public/ingest", { method: "POST" });
      } catch { /* ignore */ }
    };
    tick();
    const t = setInterval(() => { if (!cancelled) tick(); }, intervalMs);
    return () => { cancelled = true; clearInterval(t); };
  }, [intervalMs]);
}
