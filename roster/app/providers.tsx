"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { World } from "@/lib/store";

interface WorldContextValue {
  world: World | null;
  loading: boolean;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}

const WorldContext = createContext<WorldContextValue | null>(null);

export function WorldProvider({ children }: { children: React.ReactNode }) {
  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await api.getState();
    setWorld(data);
  }, []);

  const reset = useCallback(async () => {
    const data = await api.reset();
    setWorld(data);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <WorldContext.Provider value={{ world, loading, refresh, reset }}>{children}</WorldContext.Provider>
  );
}

export function useWorld(): WorldContextValue {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error("useWorld must be used within WorldProvider");
  return ctx;
}
