import { NextResponse } from "next/server";
import { checkModeChange } from "@/lib/rules";
import { appendAudit, findAgentInRoster } from "@/lib/store";
import type { TrustMode } from "@/lib/types";

const VALID_MODES: TrustMode[] = ["suggest", "approve", "autonomous"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const requestedMode = body?.mode as TrustMode | undefined;

  if (!requestedMode || !VALID_MODES.includes(requestedMode)) {
    return NextResponse.json({ error: "Invalid or missing 'mode'." }, { status: 400 });
  }

  const hire = findAgentInRoster(id);
  if (!hire || hire.type !== "agent") {
    return NextResponse.json({ error: "Agent not found on roster." }, { status: 404 });
  }

  const result = checkModeChange(hire, requestedMode);
  if (!result.allowed) {
    appendAudit({
      actor: "human",
      action: `Rejected mode change for ${hire.name} → ${requestedMode}`,
      details: { agentId: id, requestedMode, reason: result.reason },
    });
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }

  const previousMode = hire.mode;
  hire.mode = requestedMode;

  appendAudit({
    actor: "human",
    action: `Changed ${hire.name} trust mode: ${previousMode} → ${requestedMode}`,
    details: { agentId: id, previousMode, newMode: requestedMode },
  });

  return NextResponse.json(hire);
}
