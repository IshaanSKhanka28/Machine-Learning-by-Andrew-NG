// The enforcement rules that make Roster more than a clickable mockup.
// These are pure functions so they can be unit tested in isolation and
// called from every API route that needs to check them — never trust the
// client for any of this.

import { RISKY_SCOPES, type Agent, type DataScope, type Proposal, type TrustMode } from "./types";

export const NEW_HIRE_LOCK_DAYS = 30;
export const HUMAN_APPROVAL_THRESHOLD_USD = 10_000;

export interface ModeCheckResult {
  allowed: boolean;
  reason?: string;
}

function daysSince(iso: string, now: Date): number {
  const then = new Date(iso).getTime();
  return (now.getTime() - then) / (1000 * 60 * 60 * 24);
}

export function isNewHire(hiredAt: string, now: Date = new Date()): boolean {
  return daysSince(hiredAt, now) < NEW_HIRE_LOCK_DAYS;
}

export function hasRiskyScope(scopes: DataScope[]): boolean {
  return scopes.some((s) => RISKY_SCOPES.includes(s));
}

/**
 * Decides whether an agent may be set to `requestedMode`.
 * Two independent ceilings can block a promotion above `suggest`:
 *  - the 30-day new-hire lock
 *  - an uncertified agent declaring a risky scope (money movement / payroll / tax filing)
 * Both are enforced here, not just rendered disabled in the UI.
 */
export function checkModeChange(
  agent: Pick<Agent, "hiredAt" | "certified" | "scopes">,
  requestedMode: TrustMode,
  now: Date = new Date()
): ModeCheckResult {
  if (requestedMode === "suggest") {
    return { allowed: true };
  }

  if (isNewHire(agent.hiredAt, now)) {
    const daysLeft = Math.max(0, Math.ceil(NEW_HIRE_LOCK_DAYS - daysSince(agent.hiredAt, now)));
    return {
      allowed: false,
      reason: `New hires are locked to Suggest for their first ${NEW_HIRE_LOCK_DAYS} days. ${daysLeft} day${
        daysLeft === 1 ? "" : "s"
      } remaining.`,
    };
  }

  if (hasRiskyScope(agent.scopes) && !agent.certified) {
    return {
      allowed: false,
      reason:
        "This agent declares a risky scope (money movement, payroll, or tax filing) and is not certified. It needs certification to run above Suggest.",
    };
  }

  return { allowed: true };
}

/** The $10,000 hard gate: no mode, including autonomous, bypasses it. */
export function requiresHumanApproval(amountUsd: number | null): boolean {
  return amountUsd !== null && amountUsd > HUMAN_APPROVAL_THRESHOLD_USD;
}

/** Whether a proposal from an agent in the given mode may execute without a human click. */
export function canAutoExecute(mode: TrustMode, amountUsd: number | null): boolean {
  if (mode !== "autonomous") return false;
  return !requiresHumanApproval(amountUsd);
}

export interface BatchApprovalResult {
  approvable: Proposal[];
  blocked: Proposal[];
}

/** Batch-approve only ever applies to sub-threshold actions; anything above the gate is excluded. */
export function partitionBatchApproval(proposals: Proposal[]): BatchApprovalResult {
  const approvable: Proposal[] = [];
  const blocked: Proposal[] = [];
  for (const p of proposals) {
    if (requiresHumanApproval(p.amountUsd)) {
      blocked.push(p);
    } else {
      approvable.push(p);
    }
  }
  return { approvable, blocked };
}
