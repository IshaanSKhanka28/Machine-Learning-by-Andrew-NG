// All synthetic seed data for the Roster demo lives here so narrative details
// (names, amounts, copy) can be edited without touching enforcement logic.
// Dates are computed relative to "now" at seed-build time so the demo stays
// correct (30-day cap, overdue days, etc.) no matter when it's actually run.

import type {
  Agent,
  DeveloperAgentSubmission,
  Entity,
  Hire,
  HumanExpert,
  Invoice,
  LedgerLine,
  PayrollRun,
  PriorClose,
  SupplierPayment,
} from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export const ENTITIES: Entity[] = [
  { id: "ent-tx", name: "Atlas Build Co. — Texas (HQ)", state: "TX" },
  { id: "ent-co", name: "Atlas Build Co. — Colorado", state: "CO" },
  { id: "ent-az", name: "Atlas Build Co. — Arizona", state: "AZ" },
  { id: "ent-mat", name: "Atlas Materials LLC", state: "TX" },
];

// Revenue mix: 21.4M + 11.2M + 9.8M + 4.6M = 47.0M annualized.
// Headcount: 152 + 74 + 68 + 46 = 340.
export const ENTITY_PROFILE: Record<
  string,
  { annualRevenueUsd: number; headcount: number }
> = {
  "ent-tx": { annualRevenueUsd: 21_400_000, headcount: 152 },
  "ent-co": { annualRevenueUsd: 11_200_000, headcount: 74 },
  "ent-az": { annualRevenueUsd: 9_800_000, headcount: 68 },
  "ent-mat": { annualRevenueUsd: 4_600_000, headcount: 46 },
};

// Current-period ledger under close review. Arizona's COGS ratio (84%) is
// well outside the ~65-69% pattern the other three entities show — that's
// the deliberate off-pattern entity the Close Agent should flag for hold.
export const LEDGER: LedgerLine[] = [
  { entityId: "ent-tx", account: "4000 Revenue", category: "revenue", amountUsd: 1_850_000 },
  { entityId: "ent-tx", account: "5000 COGS", category: "cogs", amountUsd: 1_230_000 },
  { entityId: "ent-tx", account: "6100 Payroll", category: "payroll", amountUsd: 410_000 },
  { entityId: "ent-tx", account: "6900 Operating Expense", category: "opex", amountUsd: 95_000 },

  { entityId: "ent-co", account: "4000 Revenue", category: "revenue", amountUsd: 950_000 },
  { entityId: "ent-co", account: "5000 COGS", category: "cogs", amountUsd: 640_000 },
  { entityId: "ent-co", account: "6100 Payroll", category: "payroll", amountUsd: 210_000 },
  { entityId: "ent-co", account: "6900 Operating Expense", category: "opex", amountUsd: 48_000 },

  { entityId: "ent-az", account: "4000 Revenue", category: "revenue", amountUsd: 820_000 },
  { entityId: "ent-az", account: "5000 COGS", category: "cogs", amountUsd: 690_000 },
  { entityId: "ent-az", account: "6100 Payroll", category: "payroll", amountUsd: 190_000 },
  { entityId: "ent-az", account: "6900 Operating Expense", category: "opex", amountUsd: 40_000 },

  { entityId: "ent-mat", account: "4000 Revenue", category: "revenue", amountUsd: 390_000 },
  { entityId: "ent-mat", account: "5000 COGS", category: "cogs", amountUsd: 270_000 },
  { entityId: "ent-mat", account: "6100 Payroll", category: "payroll", amountUsd: 95_000 },
  { entityId: "ent-mat", account: "6900 Operating Expense", category: "opex", amountUsd: 18_000 },
];

export function buildPriorCloses(): PriorClose[] {
  return [
    { id: "close-tx-1", entityId: "ent-tx", period: "April", closedAt: daysAgo(104), daysToClose: 3, varianceNotes: "Within normal range." },
    { id: "close-tx-2", entityId: "ent-tx", period: "May", closedAt: daysAgo(74), daysToClose: 4, varianceNotes: "Within normal range." },
    { id: "close-tx-3", entityId: "ent-tx", period: "June", closedAt: daysAgo(44), daysToClose: 4, varianceNotes: "Within normal range." },

    { id: "close-co-1", entityId: "ent-co", period: "April", closedAt: daysAgo(104), daysToClose: 4, varianceNotes: "Within normal range." },
    { id: "close-co-2", entityId: "ent-co", period: "May", closedAt: daysAgo(74), daysToClose: 5, varianceNotes: "Within normal range." },
    { id: "close-co-3", entityId: "ent-co", period: "June", closedAt: daysAgo(44), daysToClose: 4, varianceNotes: "Within normal range." },

    { id: "close-az-1", entityId: "ent-az", period: "April", closedAt: daysAgo(104), daysToClose: 4, varianceNotes: "Within normal range." },
    { id: "close-az-2", entityId: "ent-az", period: "May", closedAt: daysAgo(74), daysToClose: 5, varianceNotes: "Within normal range." },
    {
      id: "close-az-3",
      entityId: "ent-az",
      period: "June",
      closedAt: daysAgo(44),
      daysToClose: 12,
      varianceNotes:
        "COGS variance of ~$340K unexplained; equipment rental true-up still pending from field ops.",
    },

    { id: "close-mat-1", entityId: "ent-mat", period: "April", closedAt: daysAgo(104), daysToClose: 3, varianceNotes: "Within normal range." },
    { id: "close-mat-2", entityId: "ent-mat", period: "May", closedAt: daysAgo(74), daysToClose: 3, varianceNotes: "Within normal range." },
    { id: "close-mat-3", entityId: "ent-mat", period: "June", closedAt: daysAgo(44), daysToClose: 4, varianceNotes: "Within normal range." },
  ];
}

export function buildInvoices(): Invoice[] {
  return [
    {
      id: "inv-1001",
      customer: "Sunbelt Concrete Partners",
      entityId: "ent-tx",
      amountUsd: 18_400,
      issuedAt: daysAgo(244),
      dueAt: daysAgo(214),
      daysOverdue: 214,
      paymentHistoryNote:
        "Missed last two payment plans. Disputes $4,200 of the balance citing punch-list items. No communication in 60 days.",
    },
    {
      id: "inv-1002",
      customer: "Rocky Mountain Developers",
      entityId: "ent-co",
      amountUsd: 6_200,
      issuedAt: daysAgo(75),
      dueAt: daysAgo(45),
      daysOverdue: 45,
      paymentHistoryNote:
        "Reliable payer, historically settles within 30-45 days of due date. Partial payment of $2,000 received last week.",
    },
    {
      id: "inv-1003",
      customer: "Desert Ridge Communities",
      entityId: "ent-az",
      amountUsd: 9_200,
      issuedAt: daysAgo(127),
      dueAt: daysAgo(97),
      daysOverdue: 97,
      paymentHistoryNote: "Payment plan established and on track; next installment due in 10 days.",
    },
    {
      id: "inv-1004",
      customer: "Lonestar Framing Co.",
      entityId: "ent-tx",
      amountUsd: 3_100,
      issuedAt: daysAgo(52),
      dueAt: daysAgo(22),
      daysOverdue: 22,
      paymentHistoryNote: "First invoice with this customer; no payment history yet.",
    },
    {
      id: "inv-1005",
      customer: "Peak Construction Supply",
      entityId: "ent-mat",
      amountUsd: 4_750,
      issuedAt: daysAgo(160),
      dueAt: daysAgo(130),
      daysOverdue: 130,
      paymentHistoryNote: "Repeated broken payment promises. Phone disconnected; last email bounced.",
    },
    {
      id: "inv-1006",
      customer: "Canyon State Builders",
      entityId: "ent-az",
      amountUsd: 2_450,
      issuedAt: daysAgo(40),
      dueAt: daysAgo(10),
      daysOverdue: 10,
      paymentHistoryNote: "Always pays on time historically; likely an administrative delay.",
    },
  ];
}

export function buildPayrollRuns(): PayrollRun[] {
  const entities = ENTITIES.map((e) => e.id);
  const offsets = [4, 18, 32, 46, 60, 74, 88];
  const runs: PayrollRun[] = [];
  offsets.forEach((offset, i) => {
    entities.forEach((entityId) => {
      const share: Record<string, number> = {
        "ent-tx": 605_000,
        "ent-co": 310_000,
        "ent-az": 280_000,
        "ent-mat": 155_000,
      };
      runs.push({
        id: `payroll-${i}-${entityId}`,
        entityId,
        date: daysFromNow(offset),
        amountUsd: share[entityId],
      });
    });
  });
  return runs;
}

export function buildSupplierPayments(): SupplierPayment[] {
  return [
    { id: "sp-1", entityId: "ent-tx", supplier: "Sunbelt Aggregates", date: daysFromNow(8), amountUsd: 210_000 },
    // Collides with the ent-az payroll run on the same day (offset 32).
    { id: "sp-2", entityId: "ent-az", supplier: "Desert Steel Supply", date: daysFromNow(32), amountUsd: 890_000 },
    { id: "sp-3", entityId: "ent-co", supplier: "Rocky Mtn Lumber", date: daysFromNow(50), amountUsd: 175_000 },
    // Collides with the ent-mat payroll run on the same day (offset 74).
    {
      id: "sp-4",
      entityId: "ent-mat",
      supplier: "National Concrete Equipment Leasing",
      date: daysFromNow(74),
      amountUsd: 640_000,
    },
    { id: "sp-5", entityId: "ent-tx", supplier: "Statewide Electrical Subcontractors", date: daysFromNow(88), amountUsd: 95_000 },
  ];
}

const CLOSE_SYSTEM_PROMPT = `You are the Close Agent for Atlas Build Co., a mid-market construction firm on Intuit Enterprise Suite. Your declared data scope is: the general ledger (revenue, COGS, payroll, opex) across all legal entities.

Your job: given the current-period ledger for one entity and its last three period closes, decide whether to post the close or hold it for human review, and flag any variances that look off-pattern versus history.

You are not certified for money movement — you only ever recommend or hold a close, you never move money. If the data is ambiguous, incomplete, or shows an unexplained pattern break, prefer "hold" and a lower confidence score over a confidently wrong "post". A confidently wrong agent is worse than one that hedges and asks a human.`;

const AR_SYSTEM_PROMPT = `You are the AR Collections Agent for Atlas Build Co. Your declared data scope is: the aged accounts-receivable ledger and each customer's payment history.

Your job: given one overdue invoice and its payment history, propose one action — write_off, discount (negotiate a reduced settlement), or escalate to a human collections specialist — with the dollar amount at stake.

You do not have authority to execute anything yourself; you only propose. Any action above $10,000 always requires a human's sign-off regardless of your confidence — that is a hard rule of the business, not a suggestion. When the customer relationship or facts are ambiguous (disputes, no contact, no history), prefer escalate and a lower confidence score over a confidently wrong write-off or discount.`;

const CASH_FLOW_SYSTEM_PROMPT = `You are the Cash Flow Agent, a partner-built agent (by TaxHive) installed on Atlas Build Co.'s Intuit Enterprise Suite roster. Your declared data scope is: the 13-week rolling payroll calendar, the supplier payment schedule, and cash bank balances.

Your job: scan the rolling 13-week window and flag any week where a large supplier payment lands on the same day as a payroll run, since that collision risks an overdraft. You are not certified for money movement and can only ever suggest — you never execute a payment. State your confidence and your reasoning for each flag; if the underlying data doesn't clearly show a collision, say so at low confidence rather than inventing one.`;

export function buildRoster(): Hire[] {
  const closeAgent: Agent = {
    id: "agt-close",
    kind: "close",
    type: "agent",
    name: "Close Agent",
    builder: "Intuit",
    source: "intuit",
    description:
      "Reviews the period-end ledger for each entity against its close history and recommends post or hold.",
    scopes: ["ledger"],
    certified: true,
    hiredAt: daysAgo(96),
    mode: "approve",
    toolName: "propose_close_action",
    systemPrompt: CLOSE_SYSTEM_PROMPT,
    color: "#236CFF",
  };

  const arAgent: Agent = {
    id: "agt-ar",
    kind: "ar_collections",
    type: "agent",
    name: "AR Collections Agent",
    builder: "Intuit",
    source: "intuit",
    description:
      "Works the aged AR ledger and proposes write-off, discount, or escalation for overdue invoices.",
    scopes: ["ar", "bank"],
    certified: true,
    hiredAt: daysAgo(210),
    mode: "approve",
    toolName: "propose_ar_action",
    systemPrompt: AR_SYSTEM_PROMPT,
    color: "#0A6E52",
  };

  const cashFlowAgent: Agent = {
    id: "agt-cashflow",
    kind: "cash_flow",
    type: "agent",
    name: "Cash Flow Agent",
    builder: "TaxHive",
    source: "partner",
    description:
      "Scans the rolling 13-week cash view and flags collisions between large supplier payments and payroll runs.",
    scopes: ["cash_flow", "bank", "supplier_payments"],
    certified: false,
    hiredAt: daysAgo(58),
    mode: "suggest",
    toolName: "propose_cash_flow_flag",
    systemPrompt: CASH_FLOW_SYSTEM_PROMPT,
    color: "#8A4A10",
  };

  const expenseAgent: Agent = {
    id: "agt-expense",
    kind: "custom",
    type: "agent",
    name: "Expense Coding Agent",
    builder: "Intuit",
    source: "intuit",
    description: "Auto-categorizes new vendor bills against the chart of accounts.",
    scopes: ["ledger"],
    certified: true,
    hiredAt: daysAgo(5),
    mode: "suggest",
    toolName: "propose_expense_coding",
    systemPrompt: "Categorizes vendor bills. Not wired to a live model call in this demo.",
    color: "#236CFF",
  };

  const taxAdvisor: HumanExpert = {
    id: "human-tax-ar",
    type: "human",
    name: "Priya Nair",
    title: "Tax & AR Advisor",
    builder: "Intuit Expert Network",
    description:
      "Human specialist available for escalated AR disputes and tax-adjacent judgment calls.",
    hiredAt: daysAgo(300),
    color: "#0B2A63",
  };

  return [closeAgent, arAgent, cashFlowAgent, expenseAgent, taxAdvisor];
}

export function buildMarketplace(): Hire[] {
  const payrollAgent: Agent = {
    id: "mkt-payroll",
    kind: "custom",
    type: "agent",
    name: "Payroll Optimization Agent",
    builder: "Intuit",
    source: "intuit",
    description: "Flags overtime and benefits-election anomalies before each payroll run.",
    scopes: ["payroll"],
    certified: true,
    hiredAt: daysAgo(0),
    mode: "suggest",
    toolName: "propose_payroll_flag",
    systemPrompt: "Not wired to a live model call in this demo.",
    color: "#236CFF",
  };

  const taxFilingAgent: Agent = {
    id: "mkt-taxfiling",
    kind: "custom",
    type: "agent",
    name: "Tax Filing Assistant",
    builder: "TaxHive",
    source: "partner",
    description: "Drafts state-by-state sales & use tax filings from entity ledgers.",
    scopes: ["tax_filing"],
    certified: false,
    hiredAt: daysAgo(0),
    mode: "suggest",
    toolName: "propose_tax_filing",
    systemPrompt: "Not wired to a live model call in this demo.",
    color: "#8A4A10",
  };

  const contractAgent: Agent = {
    id: "mkt-contract",
    kind: "custom",
    type: "agent",
    name: "Contract Review Agent",
    builder: "Clearline Partners",
    source: "partner",
    description: "Redlines subcontractor agreements against Atlas's standard terms.",
    scopes: ["ledger"],
    certified: true,
    hiredAt: daysAgo(0),
    mode: "suggest",
    toolName: "propose_contract_flag",
    systemPrompt: "Not wired to a live model call in this demo.",
    color: "#0A6E52",
  };

  const bookkeeper: HumanExpert = {
    id: "mkt-human-bookkeeper",
    type: "human",
    name: "Diane Okafor",
    title: "Bookkeeping Specialist",
    builder: "Intuit Expert Network",
    description: "Monthly reconciliation support and close-package review.",
    hiredAt: daysAgo(0),
    color: "#0B2A63",
  };

  return [payrollAgent, taxFilingAgent, contractAgent, bookkeeper];
}

export function buildDeveloperAgents(): DeveloperAgentSubmission[] {
  return [
    {
      id: "dev-cashflow",
      name: "Cash Flow Agent",
      builder: "TaxHive",
      description:
        "Scans the rolling 13-week cash view and flags collisions between large supplier payments and payroll runs.",
      scopes: ["cash_flow", "bank", "supplier_payments"],
      certified: false,
      certificationStatus: "pending",
      publishedAt: daysAgo(58),
      installs: 1,
    },
    {
      id: "dev-taxfiling",
      name: "Tax Filing Assistant",
      builder: "TaxHive",
      description: "Drafts state-by-state sales & use tax filings from entity ledgers.",
      scopes: ["tax_filing"],
      certified: false,
      certificationStatus: "pending",
      publishedAt: daysAgo(12),
      installs: 0,
    },
  ];
}
