import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agents";
import { maybeAutoExecute } from "@/lib/actions";
import { checkRateLimit } from "@/lib/rateLimit";
import { findAgentInRoster } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const hire = findAgentInRoster(id);
  if (!hire || hire.type !== "agent") {
    return NextResponse.json({ error: "Agent not found on roster." }, { status: 404 });
  }
  if (hire.kind === "custom") {
    return NextResponse.json(
      { error: "This agent is not wired to a live model call in this demo." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));

  try {
    const proposal = await runAgent(hire, { entityId: body?.entityId, invoiceId: body?.invoiceId });
    const autoExecuted = maybeAutoExecute(hire, proposal);
    return NextResponse.json({ proposal, autoExecuted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agent run failed." },
      { status: 500 }
    );
  }
}
