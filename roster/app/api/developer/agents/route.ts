import { NextResponse } from "next/server";
import { hasRiskyScope } from "@/lib/rules";
import { appendAudit, getWorld, nextId } from "@/lib/store";
import type { Agent, DataScope, DeveloperAgentSubmission } from "@/lib/types";

const VALID_SCOPES: DataScope[] = [
  "ledger",
  "ar",
  "payroll",
  "bank",
  "tax_filing",
  "cash_flow",
  "supplier_payments",
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const builder = typeof body?.builder === "string" ? body.builder.trim() : "TaxHive";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const scopes: DataScope[] = Array.isArray(body?.scopes)
    ? body.scopes.filter((s: unknown): s is DataScope => VALID_SCOPES.includes(s as DataScope))
    : [];

  if (!name || !description || scopes.length === 0) {
    return NextResponse.json(
      { error: "name, description, and at least one scope are required." },
      { status: 400 }
    );
  }

  const risky = hasRiskyScope(scopes);
  const world = getWorld();
  const id = nextId("dev");

  const submission: DeveloperAgentSubmission = {
    id,
    name,
    builder,
    description,
    scopes,
    certified: !risky,
    certificationStatus: risky ? "pending" : "not_required",
    publishedAt: new Date().toISOString(),
    installs: 0,
  };
  world.developerAgents.push(submission);

  const marketplaceAgent: Agent = {
    id,
    kind: "custom",
    type: "agent",
    name,
    builder,
    source: "partner",
    description,
    scopes,
    certified: !risky,
    hiredAt: new Date().toISOString(),
    mode: "suggest",
    toolName: "propose_custom_action",
    systemPrompt: "Not wired to a live model call in this demo.",
    color: "#8A4A10",
  };
  world.marketplace.push(marketplaceAgent);

  appendAudit({
    actor: "human",
    action: `TaxHive published agent "${name}"${risky ? " — routed to certification" : ""}`,
    details: { agentId: id, scopes, certificationRequired: risky },
  });

  return NextResponse.json(submission);
}
