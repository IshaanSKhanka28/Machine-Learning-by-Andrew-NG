"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWorld } from "@/app/providers";
import { api } from "@/lib/api";
import { hasRiskyScope } from "@/lib/rules";

export default function MarketplacePage() {
  const { world, loading, refresh } = useWorld();
  const router = useRouter();
  const [hiringId, setHiringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading || !world) {
    return <div className="py-24 text-center text-[var(--color-navy)]/60">Loading marketplace…</div>;
  }

  async function handleHire(id: string) {
    setHiringId(id);
    setError(null);
    try {
      await api.hire(id);
      await refresh();
      try {
        sessionStorage.setItem("justHired", id);
      } catch {
        // ignore
      }
      router.push("/roster");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not hire.");
      setHiringId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-navy-deep)]">Marketplace</h1>
        <p className="text-sm text-[var(--color-navy)]/70">
          Hire an Intuit-built agent, a partner-built agent, or a human expert onto your roster. New hires
          start at Suggest for their first 30 days.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#B3261E]/30 bg-[#B3261E]/5 px-3 py-2 text-sm text-[#B3261E]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {world.marketplace.map((hire) => {
          const risky = hire.type === "agent" && hasRiskyScope(hire.scopes);
          return (
            <div key={hire.id} className="flex h-full flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: hire.color }}
                >
                  {hire.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-navy-deep)]">{hire.name}</div>
                  <div className="text-xs text-[var(--color-navy)]/70">
                    {hire.type === "human" ? hire.title : hire.source === "intuit" ? "Intuit-built" : "Partner-built"}{" "}
                    · {hire.builder}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--color-navy)]/80">{hire.description}</p>
              {hire.type === "agent" && (
                <div className="text-xs text-[var(--color-navy)]/60">Scopes: {hire.scopes.join(", ")}</div>
              )}
              {risky && hire.type === "agent" && !hire.certified && (
                <div className="rounded-lg bg-[var(--color-warning-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-warning)]">
                  Not certified — will be capped at Suggest until certified, regardless of tenure.
                </div>
              )}
              <button
                type="button"
                onClick={() => handleHire(hire.id)}
                disabled={hiringId === hire.id}
                className="mt-auto rounded-full bg-[var(--color-super-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a56d6] disabled:opacity-50"
              >
                {hiringId === hire.id ? "Hiring…" : "Hire"}
              </button>
            </div>
          );
        })}
        {world.marketplace.length === 0 && (
          <p className="text-sm text-[var(--color-navy)]/60">Everything available has already been hired.</p>
        )}
      </div>
    </div>
  );
}
