"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorld } from "@/app/providers";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  not_required: { label: "No certification needed", className: "bg-[var(--color-healthy-bg)] text-[var(--color-healthy)]" },
  pending: { label: "Certification pending", className: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]" },
  certified: { label: "Certified", className: "bg-[var(--color-healthy-bg)] text-[var(--color-healthy)]" },
};

export default function DeveloperAgentDetailPage() {
  const params = useParams<{ agentId: string }>();
  const { world, loading } = useWorld();

  if (loading || !world) {
    return <div className="py-24 text-center text-[var(--color-navy)]/60">Loading…</div>;
  }

  const agent = world.developerAgents.find((a) => a.id === params.agentId);
  if (!agent) {
    return (
      <div className="py-24 text-center text-[var(--color-navy)]/60">
        Not found. <Link className="text-[var(--color-super-blue)]" href="/developer">Back to studio</Link>
      </div>
    );
  }

  const status = STATUS_LABEL[agent.certificationStatus];
  const rosterHire = world.roster.find((h) => h.id === agent.id && h.type === "agent");

  return (
    <div className="space-y-6">
      <Link href="/developer" className="text-sm text-[var(--color-super-blue)]">
        ← Back to studio
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-navy-deep)]">{agent.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-navy)]/80">{agent.description}</p>
          <p className="mt-1 text-xs text-[var(--color-navy)]/60">Published by {agent.builder} · Scopes: {agent.scopes.join(", ")}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <div className="text-xs text-[var(--color-navy)]/60">Installs</div>
          <div className="mt-1 text-xl font-bold text-[var(--color-navy-deep)]">{agent.installs}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <div className="text-xs text-[var(--color-navy)]/60">Ceiling while uncertified</div>
          <div className="mt-1 text-xl font-bold text-[var(--color-navy-deep)]">
            {agent.certified ? "None" : "Suggest"}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <div className="text-xs text-[var(--color-navy)]/60">Published</div>
          <div className="mt-1 text-xl font-bold text-[var(--color-navy-deep)]">
            {new Date(agent.publishedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {!agent.certified && (
        <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] p-4 text-sm text-[var(--color-warning)]">
          This agent declares a risky scope (money movement, payroll, or tax filing) and is not yet
          certified. Every business that installs it will have it capped at Suggest mode, regardless of how
          long it&apos;s been on their roster — the certification ceiling is enforced server-side, not just
          shown in the UI.
        </div>
      )}

      {rosterHire && rosterHire.type === "agent" && (
        <div className="rounded-lg bg-[var(--color-surface-tint)] p-4 text-sm text-[var(--color-navy)]">
          Installed at Atlas Build Co., currently running in <strong>{rosterHire.mode}</strong> mode.
        </div>
      )}
    </div>
  );
}
