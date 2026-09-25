// Builds per-agent prompts + tool schemas, calls the live Anthropic model,
// and falls back to a clearly-labelled cached example if the key is missing
// or the call fails, so the deployed demo never dead-ends.

import Anthropic from "@anthropic-ai/sdk";
import { getClient, hasLiveModel, MODEL } from "./anthropic";
import { requiresHumanApproval } from "./rules";
import { appendAudit, getWorld, nextId } from "./store";
import type {
  Agent,
  ArDecision,
  CashFlowDecision,
  CloseDecision,
  Invoice,
  PriorClose,
  Proposal,
} from "./types";

const MAX_TOKENS = 1024;

interface RunParams {
  entityId?: string;
  invoiceId?: string;
}

function pct(n: number, d: number): string {
  return `${((n / d) * 100).toFixed(1)}%`;
}

function buildClosePrompt(entityId: string): { prompt: string; entity: string } {
  const world = getWorld();
  const entity = world.entities.find((e) => e.id === entityId);
  if (!entity) throw new Error(`Unknown entity ${entityId}`);
  const lines = world.ledger.filter((l) => l.entityId === entityId);
  const closes = world.priorCloses
    .filter((c) => c.entityId === entityId)
    .sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime());

  const revenue = lines.find((l) => l.category === "revenue")?.amountUsd ?? 0;
  const cogs = lines.find((l) => l.category === "cogs")?.amountUsd ?? 0;

  const ledgerText = lines
    .map((l) => `- ${l.account} (${l.category}): $${l.amountUsd.toLocaleString()}`)
    .join("\n");
  const closesText = closes
    .map(
      (c: PriorClose) =>
        `- ${c.period}: closed in ${c.daysToClose} days. Notes: ${c.varianceNotes}`
    )
    .join("\n");

  const prompt = `Entity: ${entity.name} (${entity.state})

Current-period ledger:
${ledgerText}
COGS as % of revenue this period: ${pct(cogs, revenue)}

Last three period closes for this entity:
${closesText}

Decide whether to post this close or hold it, and list any variance flags (as short strings) versus the historical pattern above.`;

  return { prompt, entity: entity.name };
}

function buildArPrompt(invoiceId: string): { prompt: string; invoice: Invoice } {
  const world = getWorld();
  const invoice = world.invoices.find((i) => i.id === invoiceId);
  if (!invoice) throw new Error(`Unknown invoice ${invoiceId}`);
  const entity = world.entities.find((e) => e.id === invoice.entityId);

  const prompt = `Invoice ${invoice.id} — ${invoice.customer} (entity: ${entity?.name ?? invoice.entityId})
Amount due: $${invoice.amountUsd.toLocaleString()}
Days overdue: ${invoice.daysOverdue}
Payment history: ${invoice.paymentHistoryNote}

Propose one action for this invoice: write_off, discount, or escalate. State the dollar amount at stake (the invoice amount, or the negotiated amount if you propose a discount).`;

  return { prompt, invoice };
}

function buildCashFlowPrompt(): { prompt: string } {
  const world = getWorld();
  const payrollByDate = new Map<string, number>();
  for (const run of world.payrollRuns) {
    const key = run.date.slice(0, 10);
    payrollByDate.set(key, (payrollByDate.get(key) ?? 0) + run.amountUsd);
  }

  const payrollText = [...payrollByDate.entries()]
    .sort()
    .map(([date, total]) => `- ${date}: payroll run, total $${total.toLocaleString()} across all entities`)
    .join("\n");

  const supplierText = world.supplierPayments
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(
      (sp) =>
        `- ${sp.date.slice(0, 10)}: supplier payment to ${sp.supplier} (entity ${sp.entityId}), $${sp.amountUsd.toLocaleString()}`
    )
    .join("\n");

  const prompt = `Rolling 13-week payroll calendar (all entities combined per date):
${payrollText}

Scheduled supplier payments in the same window:
${supplierText}

Flag any date where a large supplier payment lands on the same day as a payroll run — that same-day collision risks an overdraft. For each flag, state the week (the date), a short issue description, the supplier payment amount, and the payroll amount that day.`;

  return { prompt };
}

const CLOSE_TOOL = {
  name: "propose_close_action",
  description: "Propose whether to post or hold a period-end close for one entity.",
  input_schema: {
    type: "object" as const,
    properties: {
      decision: { type: "string", enum: ["post", "hold"] },
      varianceFlags: { type: "array", items: { type: "string" } },
      confidence: { type: "number", description: "0 to 1" },
      reasoning: { type: "string" },
    },
    required: ["decision", "varianceFlags", "confidence", "reasoning"],
  },
};

const AR_TOOL = {
  name: "propose_ar_action",
  description: "Propose a collections action for one overdue invoice.",
  input_schema: {
    type: "object" as const,
    properties: {
      action: { type: "string", enum: ["write_off", "discount", "escalate"] },
      amountUsd: { type: "number", description: "Dollar amount at stake for this action" },
      confidence: { type: "number", description: "0 to 1" },
      reasoning: { type: "string" },
    },
    required: ["action", "amountUsd", "confidence", "reasoning"],
  },
};

const CASH_FLOW_TOOL = {
  name: "propose_cash_flow_flag",
  description: "Flag collisions between large supplier payments and payroll runs in the 13-week window.",
  input_schema: {
    type: "object" as const,
    properties: {
      flags: {
        type: "array",
        items: {
          type: "object",
          properties: {
            weekOf: { type: "string" },
            issue: { type: "string" },
            supplierPaymentUsd: { type: "number" },
            payrollUsd: { type: "number" },
          },
          required: ["weekOf", "issue", "supplierPaymentUsd", "payrollUsd"],
        },
      },
      confidence: { type: "number", description: "0 to 1" },
      reasoning: { type: "string" },
    },
    required: ["flags", "confidence", "reasoning"],
  },
};

function cachedClose(entityId: string): { decision: CloseDecision; confidence: number; reasoning: string } {
  const isAz = entityId === "ent-az";
  return {
    decision: {
      decision: isAz ? "hold" : "post",
      varianceFlags: isAz
        ? ["COGS 84.1% of revenue vs. ~65-69% historical pattern", "Prior close took 12 days vs. 3-5 day norm"]
        : [],
      entityId,
    },
    confidence: isAz ? 0.52 : 0.91,
    reasoning: isAz
      ? "[cached example proposal] COGS ratio and days-to-close both broke pattern versus the last three closes, and the prior close notes an unresolved equipment rental true-up. Recommending hold for human review rather than posting over an unexplained variance."
      : "[cached example proposal] COGS ratio and close timeline are consistent with the last three closes for this entity. No variance flags.",
  };
}

function cachedAr(invoice: Invoice): { decision: ArDecision; confidence: number; reasoning: string } {
  if (invoice.id === "inv-1001") {
    return {
      decision: { action: "escalate", invoiceId: invoice.id, amountUsd: invoice.amountUsd },
      confidence: 0.4,
      reasoning:
        "[cached example proposal] 214 days overdue, an active dispute over $4,200 of the balance, and no contact in 60 days. This is above ambiguous — and above the $10K threshold — so it should go to a human collections specialist rather than being written off or discounted automatically.",
    };
  }
  return {
    decision: { action: "discount", invoiceId: invoice.id, amountUsd: Math.round(invoice.amountUsd * 0.85) },
    confidence: 0.74,
    reasoning:
      "[cached example proposal] Customer has a reasonable payment history and a partial payment was already made. A modest discount to close the balance is more likely to collect than further aging.",
  };
}

function cachedCashFlow(): { decision: CashFlowDecision; confidence: number; reasoning: string } {
  const world = getWorld();
  const payrollByDate = new Map<string, number>();
  for (const run of world.payrollRuns) {
    const key = run.date.slice(0, 10);
    payrollByDate.set(key, (payrollByDate.get(key) ?? 0) + run.amountUsd);
  }
  const flags = world.supplierPayments
    .filter((sp) => payrollByDate.has(sp.date.slice(0, 10)))
    .map((sp) => ({
      weekOf: sp.date.slice(0, 10),
      issue: `Supplier payment to ${sp.supplier} lands on a payroll run date`,
      supplierPaymentUsd: sp.amountUsd,
      payrollUsd: payrollByDate.get(sp.date.slice(0, 10)) ?? 0,
    }));
  return {
    decision: { flags },
    confidence: 0.68,
    reasoning:
      "[cached example proposal] Two dates in the 13-week window show a large supplier payment landing on the same day as a company-wide payroll run, which materially increases overdraft risk on those days.",
  };
}

export async function runAgent(agent: Agent, params: RunParams): Promise<Proposal> {
  const world = getWorld();
  let prompt: string;
  let tool: typeof CLOSE_TOOL | typeof AR_TOOL | typeof CASH_FLOW_TOOL;
  let amountUsd: number | null = null;
  let kind: Proposal["kind"];
  let targetEntityId: string | undefined;
  let targetInvoice: Invoice | undefined;

  if (agent.kind === "close") {
    const entityId = params.entityId ?? "ent-az";
    const built = buildClosePrompt(entityId);
    prompt = built.prompt;
    tool = CLOSE_TOOL;
    kind = "close";
    targetEntityId = entityId;
  } else if (agent.kind === "ar_collections") {
    const invoiceId = params.invoiceId ?? "inv-1001";
    const built = buildArPrompt(invoiceId);
    prompt = built.prompt;
    tool = AR_TOOL;
    kind = "ar";
    targetInvoice = built.invoice;
  } else if (agent.kind === "cash_flow") {
    const built = buildCashFlowPrompt();
    prompt = built.prompt;
    tool = CASH_FLOW_TOOL;
    kind = "cash_flow";
  } else {
    throw new Error(`Agent kind ${agent.kind} is not wired to a live model call in this demo.`);
  }

  let decision: CloseDecision | ArDecision | CashFlowDecision;
  let confidence: number;
  let reasoning: string;
  let rawResponse: string;
  let cached = false;

  const client = getClient();

  if (!hasLiveModel() || !client) {
    cached = true;
    rawResponse = "[no ANTHROPIC_API_KEY configured — using cached example proposal]";
    ({ decision, confidence, reasoning } =
      agent.kind === "close"
        ? cachedClose(targetEntityId!)
        : agent.kind === "ar_collections"
        ? cachedAr(targetInvoice!)
        : cachedCashFlow());
  } else {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: agent.systemPrompt,
        messages: [{ role: "user", content: prompt }],
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
      });

      rawResponse = JSON.stringify(response, null, 2);

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );
      if (!toolUse) throw new Error("Model did not return a tool_use block.");

      const input = toolUse.input as Record<string, unknown>;
      confidence = typeof input.confidence === "number" ? input.confidence : 0.5;
      reasoning = typeof input.reasoning === "string" ? input.reasoning : "(no reasoning returned)";

      if (agent.kind === "close") {
        decision = {
          decision: input.decision as "post" | "hold",
          varianceFlags: (input.varianceFlags as string[]) ?? [],
          entityId: targetEntityId!,
        };
      } else if (agent.kind === "ar_collections") {
        decision = {
          action: input.action as ArDecision["action"],
          invoiceId: targetInvoice!.id,
          amountUsd: typeof input.amountUsd === "number" ? input.amountUsd : targetInvoice!.amountUsd,
        };
      } else {
        decision = { flags: (input.flags as CashFlowDecision["flags"]) ?? [] };
      }
    } catch (err) {
      cached = true;
      rawResponse = `[live model call failed: ${err instanceof Error ? err.message : String(err)} — using cached example proposal]`;
      ({ decision, confidence, reasoning } =
        agent.kind === "close"
          ? cachedClose(targetEntityId!)
          : agent.kind === "ar_collections"
          ? cachedAr(targetInvoice!)
          : cachedCashFlow());
    }
  }

  if (agent.kind === "ar_collections") {
    amountUsd = (decision as ArDecision).amountUsd;
  } else if (agent.kind === "close") {
    amountUsd = null;
  } else {
    amountUsd = null;
  }

  const proposal: Proposal = {
    id: nextId("prop"),
    agentId: agent.id,
    kind,
    status: "pending",
    createdAt: new Date().toISOString(),
    amountUsd,
    confidence,
    reasoning,
    decision,
    prompt,
    rawResponse,
    cached,
    requiresApproval: requiresHumanApproval(amountUsd),
  };

  world.proposals.push(proposal);

  appendAudit({
    actor: agent.id,
    action: `Proposed action (${kind})${cached ? " [cached example]" : ""}`,
    confidence,
    reasoning,
    details: { proposalId: proposal.id, prompt, rawResponse, decision },
  });

  return proposal;
}
