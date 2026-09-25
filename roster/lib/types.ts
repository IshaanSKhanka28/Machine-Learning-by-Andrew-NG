// Shared domain types for Roster.

export type TrustMode = "suggest" | "approve" | "autonomous";

export type DataScope =
  | "ledger"
  | "ar"
  | "payroll"
  | "bank"
  | "tax_filing"
  | "cash_flow"
  | "supplier_payments";

export const RISKY_SCOPES: DataScope[] = ["bank", "payroll", "tax_filing"];

export type AgentSource = "intuit" | "partner";

export type AgentKind = "close" | "ar_collections" | "cash_flow" | "custom";

export interface Agent {
  id: string;
  kind: AgentKind;
  type: "agent";
  name: string;
  builder: string;
  source: AgentSource;
  description: string;
  scopes: DataScope[];
  certified: boolean;
  hiredAt: string; // ISO date
  mode: TrustMode;
  toolName: string;
  systemPrompt: string;
  color: string;
}

export interface HumanExpert {
  id: string;
  type: "human";
  name: string;
  title: string;
  builder: "Intuit Expert Network";
  description: string;
  hiredAt: string;
  color: string;
}

export type Hire = Agent | HumanExpert;

export interface Entity {
  id: string;
  name: string;
  state: string;
}

export interface LedgerLine {
  entityId: string;
  account: string;
  category: string;
  amountUsd: number;
}

export interface PriorClose {
  id: string;
  entityId: string;
  period: string; // e.g. "2026-06"
  closedAt: string;
  daysToClose: number;
  varianceNotes: string;
}

export interface Invoice {
  id: string;
  customer: string;
  entityId: string;
  amountUsd: number;
  issuedAt: string;
  dueAt: string;
  daysOverdue: number;
  paymentHistoryNote: string;
}

export interface PayrollRun {
  id: string;
  entityId: string;
  date: string;
  amountUsd: number;
}

export interface SupplierPayment {
  id: string;
  entityId: string;
  supplier: string;
  date: string;
  amountUsd: number;
}

export type ProposalKind = "close" | "ar" | "cash_flow";

export type ProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "escalated";

export interface CloseDecision {
  decision: "post" | "hold";
  varianceFlags: string[];
  entityId: string;
}

export interface ArDecision {
  action: "write_off" | "discount" | "escalate";
  invoiceId: string;
  amountUsd: number;
}

export interface CashFlowDecision {
  flags: {
    weekOf: string;
    issue: string;
    supplierPaymentUsd: number;
    payrollUsd: number;
  }[];
}

export interface Proposal {
  id: string;
  agentId: string;
  kind: ProposalKind;
  status: ProposalStatus;
  createdAt: string;
  amountUsd: number | null;
  confidence: number; // 0-1
  reasoning: string;
  decision: CloseDecision | ArDecision | CashFlowDecision;
  prompt: string;
  rawResponse: string;
  cached: boolean;
  requiresApproval: boolean; // computed at creation time (the $10K gate etc.)
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string; // agent id, "human", or "system"
  action: string;
  details?: Record<string, unknown>;
  confidence?: number;
  reasoning?: string;
}

export interface CaseThread {
  id: string;
  proposalId: string;
  agentId: string;
  expertId: string;
  openedAt: string;
  status: "awaiting_response";
  context: {
    proposalSummary: string;
    confidence: number;
    reasoning: string;
    ledgerRows: unknown[];
  };
}

export interface DeveloperAgentSubmission {
  id: string;
  name: string;
  builder: string;
  description: string;
  scopes: DataScope[];
  certified: boolean;
  certificationStatus: "not_required" | "pending" | "certified";
  publishedAt: string;
  installs: number;
}
