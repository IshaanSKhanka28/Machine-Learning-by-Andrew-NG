import { NextResponse } from "next/server";
import { executeProposal, findProposal } from "@/lib/actions";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = findProposal(id);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  if (proposal.status !== "pending") {
    return NextResponse.json({ error: `Proposal already ${proposal.status}.` }, { status: 409 });
  }

  executeProposal(proposal, "human");
  return NextResponse.json(proposal);
}
