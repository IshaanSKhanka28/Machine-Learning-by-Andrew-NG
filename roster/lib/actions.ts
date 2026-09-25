import { canAutoExecute } from "./rules";
import { appendAudit, getWorld } from "./store";
import type { Agent, Proposal } from "./types";

/** Marks a proposal executed and logs it — the one place "doing the thing" happens. */
export function executeProposal(proposal: Proposal, actor: string): void {
  proposal.status = "approved";
  appendAudit({
    actor,
    action: `Executed proposal ${proposal.id} (${proposal.kind})`,
    details: { proposalId: proposal.id, decision: proposal.decision, amountUsd: proposal.amountUsd },
  });
}

/** Called right after a proposal is created — auto-executes if the agent's mode and the gate allow it. */
export function maybeAutoExecute(agent: Agent, proposal: Proposal): boolean {
  if (canAutoExecute(agent.mode, proposal.amountUsd)) {
    executeProposal(proposal, agent.id);
    appendAudit({
      actor: agent.id,
      action: `Auto-executed (autonomous mode) and notified — ${proposal.kind} proposal ${proposal.id}`,
      details: { proposalId: proposal.id },
    });
    return true;
  }
  return false;
}

export function findProposal(id: string): Proposal | undefined {
  return getWorld().proposals.find((p) => p.id === id);
}
