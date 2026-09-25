import { NextResponse } from "next/server";
import { findProposal } from "@/lib/actions";
import { appendAudit, getWorld, nextId } from "@/lib/store";
import type { CaseThread } from "@/lib/types";

const DEFAULT_EXPERT_ID = "human-tax-ar";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const world = getWorld();
  const proposal = findProposal(id);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  if (proposal.status !== "pending") {
    return NextResponse.json({ error: `Proposal already ${proposal.status}.` }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const expertId = typeof body?.expertId === "string" ? body.expertId : DEFAULT_EXPERT_ID;

  let ledgerRows: unknown[] = [];
  if (proposal.kind === "ar" && "invoiceId" in proposal.decision) {
    const invoice = world.invoices.find((i) => i.id === (proposal.decision as { invoiceId: string }).invoiceId);
    ledgerRows = invoice ? [invoice] : [];
  } else if (proposal.kind === "close" && "entityId" in proposal.decision) {
    const entityId = (proposal.decision as { entityId: string }).entityId;
    ledgerRows = world.ledger.filter((l) => l.entityId === entityId);
  }

  const caseThread: CaseThread = {
    id: nextId("case"),
    proposalId: proposal.id,
    agentId: proposal.agentId,
    expertId,
    openedAt: new Date().toISOString(),
    status: "awaiting_response",
    context: {
      proposalSummary: JSON.stringify(proposal.decision),
      confidence: proposal.confidence,
      reasoning: proposal.reasoning,
      ledgerRows,
    },
  };
  world.caseThreads.push(caseThread);

  proposal.status = "escalated";
  appendAudit({
    actor: "human",
    action: `Escalated proposal ${proposal.id} to ${expertId}`,
    details: { proposalId: proposal.id, caseThreadId: caseThread.id },
  });

  return NextResponse.json({ proposal, caseThread });
}
