"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useWorld } from "@/app/providers";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { TrustLadder } from "@/components/TrustLadder";
import { api } from "@/lib/api";
import { HUMAN_APPROVAL_THRESHOLD_USD } from "@/lib/rules";
import type {
  Agent,
  ArDecision,
  CashFlowDecision,
  CloseDecision,
  Proposal,
  TrustMode,
} from "@/lib/types";

function ArDecisionView({ decision }: { decision: ArDecision }) {
  return (
    <div className="text-sm text-[var(--color-navy)]">
      Proposes <span className="font-semibold">{decision.action.replace("_", " ")}</span> for{" "}
      <span className="font-semibold">${decision.amountUsd.toLocaleString()}</span> on invoice{" "}
      {decision.invoiceId}.
    </div>
  );
}

function CloseDecisionView({ decision }: { decision: CloseDecision }) {
  return (
    <div className="text-sm text-[var(--color-navy)]">
      Recommends <span className="font-semibold">{decision.decision === "post" ? "posting" : "holding"}</span>{" "}
      the close for {decision.entityId}.
      {decision.varianceFlags.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-[var(--color-warning)]">
          {decision.varianceFlags.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CashFlowDecisionView({ decision }: { decision: CashFlowDecision }) {
  if (decision.flags.length === 0) {
    return <div className="text-sm text-[var(--color-navy)]">No collisions found in the 13-week window.</div>;
  }
  return (
    <ul className="space-y-2 text-sm text-[var(--color-navy)]">
      {decision.flags.map((f, i) => (
        <li key={i} className="rounded-lg bg-[var(--color-warning-bg)] p-2">
          <div className="font-semibold text-[var(--color-warning)]">{f.weekOf}</div>
          <div>{f.issue}</div>
          <div className="text-xs">
            Supplier payment ${f.supplierPaymentUsd.toLocaleString()} + payroll $
            {f.payrollUsd.toLocaleString()}
          </div>
        </li>
      ))}
    </ul>
  );
}

function DecisionView({ proposal }: { proposal: Proposal }) {
  if (proposal.kind === "ar") return <ArDecisionView decision={proposal.decision as ArDecision} />;
  if (proposal.kind === "close") return <CloseDecisionView decision={proposal.decision as CloseDecision} />;
  return <CashFlowDecisionView decision={proposal.decision as CashFlowDecision} />;
}

function AuditRow({ entry }: { entry: { id: string; timestamp: string; actor: string; action: string; confidence?: number; reasoning?: string; details?: Record<string, unknown> } }) {
  const hasDetail = Boolean(entry.details?.prompt || entry.details?.rawResponse);
  return (
    <li className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-[var(--color-navy-deep)]">{entry.action}</span>
        <span className="text-xs text-[var(--color-navy)]/50">
          {new Date(entry.timestamp).toLocaleString()} · {entry.actor}
        </span>
      </div>
      {entry.reasoning && (
        <p className="mt-1 text-[var(--color-navy)]/80">
          {entry.reasoning}
          {typeof entry.confidence === "number" && (
            <span className="ml-2 font-semibold">({Math.round(entry.confidence * 100)}% confidence)</span>
          )}
        </p>
      )}
      {hasDetail && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--color-super-blue)]">
            View prompt &amp; raw model response
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-[var(--color-navy-deep)] p-2 text-xs text-white whitespace-pre-wrap">
            {String(entry.details?.prompt ?? "")}
            {"\n\n---\n\n"}
            {String(entry.details?.rawResponse ?? "")}
          </pre>
        </details>
      )}
    </li>
  );
}

export default function AgentDetailPage() {
  const params = useParams<{ agentId: string }>();
  const { world, loading, refresh } = useWorld();
  const [running, setRunning] = useState(false);
  const [modePending, setModePending] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string>("ent-az");
  const [selectedInvoice, setSelectedInvoice] = useState<string>("inv-1001");
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const agent = useMemo(
    () => world?.roster.find((h) => h.id === params.agentId && h.type === "agent") as Agent | undefined,
    [world, params.agentId]
  );

  if (loading || !world) {
    return <div className="py-24 text-center text-[var(--color-navy)]/60">Loading…</div>;
  }
  if (!agent) {
    return (
      <div className="py-24 text-center text-[var(--color-navy)]/60">
        Agent not found. <Link className="text-[var(--color-super-blue)]" href="/roster">Back to roster</Link>
      </div>
    );
  }

  const proposals = world.proposals
    .filter((p) => p.agentId === agent.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pending = proposals.filter((p) => p.status === "pending");

  const agentProposalIds = new Set(proposals.map((p) => p.id));
  const auditEntries = world.auditLog
    .filter(
      (e) =>
        e.actor === agent.id ||
        e.details?.agentId === agent.id ||
        (typeof e.details?.proposalId === "string" && agentProposalIds.has(e.details.proposalId))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const caseThreads = world.caseThreads.filter((c) => c.agentId === agent.id && c.status === "awaiting_response");

  async function handleModeChange(mode: TrustMode) {
    setModePending(true);
    setError(null);
    try {
      await api.setMode(agent!.id, mode);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change mode.");
    } finally {
      setModePending(false);
    }
  }

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      await api.runAgent(agent!.id, {
        entityId: agent!.kind === "close" ? selectedEntity : undefined,
        invoiceId: agent!.kind === "ar_collections" ? selectedInvoice : undefined,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent run failed.");
    } finally {
      setRunning(false);
    }
  }

  async function handleApprove(proposalId: string) {
    setError(null);
    try {
      await api.approve(proposalId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not approve.");
    }
  }

  async function handleEscalate(proposalId: string) {
    setError(null);
    try {
      await api.escalate(proposalId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not escalate.");
    }
  }

  async function submitReject(proposalId: string) {
    setError(null);
    try {
      await api.reject(proposalId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reject.");
    }
  }

  const canRunLive = agent.kind === "close" || agent.kind === "ar_collections" || agent.kind === "cash_flow";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/roster" className="text-sm text-[var(--color-super-blue)]">
          ← Back to roster
        </Link>
        <div className="mt-2 flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
            style={{ background: agent.color }}
          >
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-navy-deep)]">{agent.name}</h1>
            <p className="text-sm text-[var(--color-navy)]/70">
              {agent.source === "intuit" ? "Intuit-built" : "Partner-built"} · {agent.builder} ·{" "}
              {agent.certified ? "Certified" : "Not certified"}
            </p>
            <p className="mt-1 max-w-2xl text-sm text-[var(--color-navy)]/80">{agent.description}</p>
            <p className="mt-1 text-xs text-[var(--color-navy)]/60">
              Data scopes: {agent.scopes.join(", ")}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#B3261E]/30 bg-[#B3261E]/5 px-3 py-2 text-sm text-[#B3261E]">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="font-semibold text-[var(--color-navy-deep)]">Trust level</h2>
        <p className="mt-1 text-xs text-[var(--color-navy)]/60">
          Actions above ${HUMAN_APPROVAL_THRESHOLD_USD.toLocaleString()} always require your approval, in
          every mode, including Autonomous. This is a hard rule — it cannot be switched off.
        </p>
        <div className="mt-3">
          <TrustLadder agent={agent} onChange={handleModeChange} pending={modePending} />
        </div>
      </section>

      {canRunLive && (
        <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <h2 className="font-semibold text-[var(--color-navy-deep)]">Run agent</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {agent.kind === "close" && (
              <label className="text-sm">
                <div className="mb-1 text-[var(--color-navy)]/70">Entity</div>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-2"
                >
                  {world.entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {agent.kind === "ar_collections" && (
              <label className="text-sm">
                <div className="mb-1 text-[var(--color-navy)]/70">Invoice</div>
                <select
                  value={selectedInvoice}
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-2"
                >
                  {world.invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.customer} — ${inv.amountUsd.toLocaleString()} ({inv.daysOverdue}d overdue)
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="rounded-full bg-[var(--color-super-blue)] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1a56d6] disabled:opacity-50"
            >
              {running ? "Calling model…" : "Run agent"}
            </button>
          </div>
        </section>
      )}

      {caseThreads.length > 0 && (
        <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <h2 className="font-semibold text-[var(--color-navy-deep)]">Open case threads</h2>
          {caseThreads.map((c) => {
            const expert = [...world.roster, ...world.marketplace].find((h) => h.id === c.expertId);
            return (
              <div key={c.id} className="mt-3 rounded-lg bg-[var(--color-surface-tint)] p-3 text-sm">
                <div className="font-semibold text-[var(--color-navy-deep)]">
                  Escalated to {expert?.name ?? c.expertId}
                </div>
                <p className="mt-1 text-[var(--color-navy)]/80">{c.context.reasoning}</p>
                <p className="mt-2 text-xs text-[var(--color-navy)]/60">
                  Opened {new Date(c.openedAt).toLocaleString()} · Status: awaiting response. A real response
                  from the expert would arrive here.
                </p>
              </div>
            );
          })}
        </section>
      )}

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="font-semibold text-[var(--color-navy-deep)]">Pending proposals</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-navy)]/60">Nothing pending. Run the agent above.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {pending.map((p) => (
              <li key={p.id} className="rounded-lg border border-[var(--color-border)] p-3">
                {p.cached && (
                  <div className="mb-2 inline-block rounded-full bg-[var(--color-warning-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--color-warning)]">
                    Cached example proposal
                  </div>
                )}
                <DecisionView proposal={p} />
                <p className="mt-2 text-sm italic text-[var(--color-navy)]/70">&ldquo;{p.reasoning}&rdquo;</p>
                <div className="mt-2 flex items-center justify-between">
                  <ConfidenceBar confidence={p.confidence} />
                  {p.requiresApproval && (
                    <span className="text-xs font-semibold text-[var(--color-warning)]">
                      Above ${HUMAN_APPROVAL_THRESHOLD_USD.toLocaleString()} — requires your approval
                    </span>
                  )}
                </div>

                {rejectingId === p.id ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      autoFocus
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejecting…"
                      className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitReject(p.id)}
                        className="rounded-full bg-[#B3261E] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Confirm reject
                      </button>
                      <button
                        onClick={() => setRejectingId(null)}
                        className="rounded-full px-4 py-2 text-sm text-[var(--color-navy)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-surface-tint)]"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(p.id)}
                      className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-surface-tint)]"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleEscalate(p.id)}
                      className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-surface-tint)]"
                    >
                      Escalate to human
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-4">
        <h2 className="font-semibold text-[var(--color-navy-deep)]">Audit log</h2>
        {auditEntries.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-navy)]/60">No activity yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {auditEntries.map((e) => (
              <AuditRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
