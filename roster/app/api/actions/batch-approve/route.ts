import { NextResponse } from "next/server";
import { executeProposal } from "@/lib/actions";
import { partitionBatchApproval } from "@/lib/rules";
import { appendAudit, getWorld } from "@/lib/store";

// Batch-approve exists for sub-threshold actions only — anything crossing
// the $10K gate is excluded here even if the caller asked for it.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  const world = getWorld();
  const targets = world.proposals.filter((p) => ids.includes(p.id) && p.status === "pending");
  const { approvable, blocked } = partitionBatchApproval(targets);

  for (const proposal of approvable) {
    executeProposal(proposal, "human");
  }

  appendAudit({
    actor: "human",
    action: `Batch-approved ${approvable.length} proposal(s); ${blocked.length} blocked by the $10K gate`,
    details: {
      approvedIds: approvable.map((p) => p.id),
      blockedIds: blocked.map((p) => p.id),
    },
  });

  return NextResponse.json({
    approved: approvable.map((p) => p.id),
    blocked: blocked.map((p) => ({ id: p.id, amountUsd: p.amountUsd })),
  });
}
