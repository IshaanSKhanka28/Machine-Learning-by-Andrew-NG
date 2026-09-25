"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWorld } from "@/app/providers";
import { FirstRunOverlay } from "@/components/FirstRunOverlay";
import { RosterCard } from "@/components/RosterCard";

export default function RosterPage() {
  const { world, loading } = useWorld();
  const [justHiredId, setJustHiredId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const id = sessionStorage.getItem("justHired");
      if (id) {
        setJustHiredId(id);
        sessionStorage.removeItem("justHired");
      }
    } catch {
      // ignore
    }
  }, []);

  if (loading || !world) {
    return <div className="py-24 text-center text-[var(--color-navy)]/60">Loading roster…</div>;
  }

  const pendingByAgent = new Map<string, number>();
  for (const p of world.proposals) {
    if (p.status === "pending") {
      pendingByAgent.set(p.agentId, (pendingByAgent.get(p.agentId) ?? 0) + 1);
    }
  }

  return (
    <div>
      <FirstRunOverlay />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy-deep)]">Your team</h1>
          <p className="text-sm text-[var(--color-navy)]/70">
            Every AI agent, partner-built agent, and human expert working for Atlas Build Co. — mixed on one
            roster.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="rounded-full bg-[var(--color-super-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a56d6]"
        >
          Hire from marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {world.roster.map((hire) => (
          <RosterCard
            key={hire.id}
            hire={hire}
            pendingCount={pendingByAgent.get(hire.id) ?? 0}
            justHired={hire.id === justHiredId}
          />
        ))}
      </div>
    </div>
  );
}
