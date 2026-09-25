import { NextResponse } from "next/server";
import { findProposal } from "@/lib/actions";
import { appendAudit } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = findProposal(id);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  if (proposal.status !== "pending") {
    return NextResponse.json({ error: `Proposal already ${proposal.status}.` }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : "No reason given.";

  proposal.status = "rejected";
  appendAudit({
    actor: "human",
    action: `Rejected proposal ${proposal.id} (${proposal.kind})`,
    details: { proposalId: proposal.id, reason },
  });

  return NextResponse.json(proposal);
}
