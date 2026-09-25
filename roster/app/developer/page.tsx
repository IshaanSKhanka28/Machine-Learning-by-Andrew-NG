"use client";

import Link from "next/link";
import { useState } from "react";
import { useWorld } from "@/app/providers";
import { api } from "@/lib/api";
import { hasRiskyScope } from "@/lib/rules";
import type { DataScope } from "@/lib/types";

const SCOPE_OPTIONS: { value: DataScope; label: string; risky: boolean }[] = [
  { value: "ledger", label: "General ledger", risky: false },
  { value: "ar", label: "Accounts receivable", risky: false },
  { value: "supplier_payments", label: "Supplier payment schedule", risky: false },
  { value: "cash_flow", label: "Cash flow / bank balances", risky: false },
  { value: "bank", label: "Bank — money movement", risky: true },
  { value: "payroll", label: "Payroll", risky: true },
  { value: "tax_filing", label: "Tax filing", risky: true },
];

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  not_required: { label: "No certification needed", className: "bg-[var(--color-healthy-bg)] text-[var(--color-healthy)]" },
  pending: { label: "Certification pending", className: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]" },
  certified: { label: "Certified", className: "bg-[var(--color-healthy-bg)] text-[var(--color-healthy)]" },
};

export default function DeveloperStudioPage() {
  const { world, loading, refresh } = useWorld();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scopes, setScopes] = useState<DataScope[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading || !world) {
    return <div className="py-24 text-center text-[var(--color-navy)]/60">Loading…</div>;
  }

  const risky = hasRiskyScope(scopes);

  function toggleScope(value: DataScope) {
    setScopes((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const submission = await api.publishAgent({ name, builder: "TaxHive", description, scopes });
      await refresh();
      setSuccess(`Published "${name}".`);
      setName("");
      setDescription("");
      setScopes([]);
      void submission;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-navy-deep)]">TaxHive · Publish an agent</h1>
        <p className="text-sm text-[var(--color-navy)]/70">
          Declare the data your agent needs. Scopes touching money movement, payroll, or tax filing route
          automatically to certification — it can never run above Suggest until certified.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 font-medium text-[var(--color-navy)]">Agent name</div>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2"
              placeholder="e.g. Sales Tax Reconciler"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <div className="mb-1 font-medium text-[var(--color-navy)]">Description</div>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2"
              placeholder="What does it do, and for whom?"
            />
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-[var(--color-navy)]">Declared data scopes</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SCOPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  opt.risky ? "border-[var(--color-warning)]/30" : "border-[var(--color-border)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={scopes.includes(opt.value)}
                  onChange={() => toggleScope(opt.value)}
                />
                {opt.label}
                {opt.risky && <span className="ml-auto text-xs text-[var(--color-warning)]">risky</span>}
              </label>
            ))}
          </div>
        </fieldset>

        {risky && (
          <div className="animate-hire-in mt-4 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)] p-3 text-sm text-[var(--color-warning)]">
            <strong>Certification required.</strong> This agent declares a scope involving money movement,
            payroll, or tax filing. Once published, it will be capped at Suggest mode — for every business
            that hires it — until Intuit certifies it, no matter how long it&apos;s been on a roster.
          </div>
        )}

        {error && <p className="mt-3 text-sm text-[#B3261E]">{error}</p>}
        {success && <p className="mt-3 text-sm text-[var(--color-healthy)]">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-full bg-[var(--color-super-blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1a56d6] disabled:opacity-50"
        >
          {submitting ? "Publishing…" : "Publish agent"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-bold text-[var(--color-navy-deep)]">Your published agents</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {world.developerAgents.map((agent) => {
            const status = STATUS_LABEL[agent.certificationStatus];
            return (
              <Link
                key={agent.id}
                href={`/developer/${agent.id}`}
                className="rounded-xl border border-[var(--color-border)] bg-white p-4 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-[var(--color-navy-deep)]">{agent.name}</div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--color-navy)]/80">{agent.description}</p>
                <div className="mt-2 text-xs text-[var(--color-navy)]/60">
                  Scopes: {agent.scopes.join(", ")} · {agent.installs} install{agent.installs === 1 ? "" : "s"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
