import { useEffect, useState, useCallback } from "react";

export function useLiveQuery<T>(fn: () => Promise<T>, intervalMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async () => {
    try {
      const d = await fn();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [fn]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const d = await fn();
      if (!cancelled) setData(d);
    };
    tick().finally(() => setLoading(false));
    const t = setInterval(tick, intervalMs);
    return () => { cancelled = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { data, loading, refresh: run };
}
