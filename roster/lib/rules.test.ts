import { describe, expect, it } from "vitest";
import {
  canAutoExecute,
  checkModeChange,
  HUMAN_APPROVAL_THRESHOLD_USD,
  partitionBatchApproval,
  requiresHumanApproval,
} from "./rules";
import type { Proposal } from "./types";

const NOW = new Date("2026-07-14T00:00:00.000Z");

function isoDaysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe("checkModeChange — new-hire cap", () => {
  it("blocks promotion for an agent hired less than 30 days ago", () => {
    const result = checkModeChange(
      { hiredAt: isoDaysAgo(5), certified: true, scopes: ["ledger"] },
      "approve",
      NOW
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/30 days/i);
  });

  it("allows promotion for an agent hired 30+ days ago with no risky scope", () => {
    const result = checkModeChange(
      { hiredAt: isoDaysAgo(31), certified: true, scopes: ["ledger"] },
      "autonomous",
      NOW
    );
    expect(result.allowed).toBe(true);
  });

  it("always allows setting mode back to suggest, even for a brand-new hire", () => {
    const result = checkModeChange(
      { hiredAt: isoDaysAgo(0), certified: false, scopes: ["bank"] },
      "suggest",
      NOW
    );
    expect(result.allowed).toBe(true);
  });
});

describe("checkModeChange — certification ceiling", () => {
  it("blocks an uncertified agent with a risky scope from exceeding suggest", () => {
    const result = checkModeChange(
      { hiredAt: isoDaysAgo(365), certified: false, scopes: ["bank"] },
      "approve",
      NOW
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/certif/i);
  });

  it("allows a certified agent with a risky scope to exceed suggest", () => {
    const result = checkModeChange(
      { hiredAt: isoDaysAgo(365), certified: true, scopes: ["bank"] },
      "autonomous",
      NOW
    );
    expect(result.allowed).toBe(true);
  });

  it("does not apply the certification ceiling to non-risky scopes", () => {
    const result = checkModeChange(
      { hiredAt: isoDaysAgo(365), certified: false, scopes: ["ledger"] },
      "autonomous",
      NOW
    );
    expect(result.allowed).toBe(true);
  });

  it("treats payroll and tax_filing as risky scopes too", () => {
    expect(
      checkModeChange({ hiredAt: isoDaysAgo(365), certified: false, scopes: ["payroll"] }, "approve", NOW)
        .allowed
    ).toBe(false);
    expect(
      checkModeChange({ hiredAt: isoDaysAgo(365), certified: false, scopes: ["tax_filing"] }, "approve", NOW)
        .allowed
    ).toBe(false);
  });
});

describe("the $10,000 hard gate", () => {
  it("requires human approval above the threshold", () => {
    expect(requiresHumanApproval(HUMAN_APPROVAL_THRESHOLD_USD + 1)).toBe(true);
    expect(requiresHumanApproval(18_400)).toBe(true);
  });

  it("does not require human approval at or below the threshold", () => {
    expect(requiresHumanApproval(HUMAN_APPROVAL_THRESHOLD_USD)).toBe(false);
    expect(requiresHumanApproval(9_999)).toBe(false);
    expect(requiresHumanApproval(null)).toBe(false);
  });

  it("autonomous mode never bypasses the gate", () => {
    expect(canAutoExecute("autonomous", 18_400)).toBe(false);
    expect(canAutoExecute("autonomous", 10_001)).toBe(false);
  });

  it("autonomous mode can execute sub-threshold actions", () => {
    expect(canAutoExecute("autonomous", 5_000)).toBe(true);
    expect(canAutoExecute("autonomous", null)).toBe(true);
  });

  it("suggest and approve modes never auto-execute regardless of amount", () => {
    expect(canAutoExecute("suggest", 100)).toBe(false);
    expect(canAutoExecute("approve", 100)).toBe(false);
  });
});

describe("batch approval", () => {
  function proposal(id: string, amountUsd: number | null): Proposal {
    return {
      id,
      agentId: "agt-ar",
      kind: "ar",
      status: "pending",
      createdAt: NOW.toISOString(),
      amountUsd,
      confidence: 0.8,
      reasoning: "test",
      decision: { action: "write_off", invoiceId: "inv-x", amountUsd: amountUsd ?? 0 },
      prompt: "",
      rawResponse: "",
      cached: false,
      requiresApproval: requiresHumanApproval(amountUsd),
    };
  }

  it("excludes any proposal above the $10K gate from batch approval", () => {
    const proposals = [proposal("a", 500), proposal("b", 18_400), proposal("c", 9_999)];
    const { approvable, blocked } = partitionBatchApproval(proposals);
    expect(approvable.map((p) => p.id)).toEqual(["a", "c"]);
    expect(blocked.map((p) => p.id)).toEqual(["b"]);
  });

  it("approves everything when nothing crosses the gate", () => {
    const proposals = [proposal("a", 100), proposal("b", null)];
    const { approvable, blocked } = partitionBatchApproval(proposals);
    expect(approvable).toHaveLength(2);
    expect(blocked).toHaveLength(0);
  });
});
