// In-memory server-side state store. No database — the brief for this
// prototype is intentionally: seed at boot, mutate in memory, hard-reset on
// demand. A redeploy resetting state is acceptable and desirable.
//
// Guarded on globalThis so Next.js dev-server hot reload doesn't wipe state
// on every file save (mirrors the common Prisma-singleton pattern).

import {
  buildDeveloperAgents,
  buildInvoices,
  buildMarketplace,
  buildPayrollRuns,
  buildPriorCloses,
  buildRoster,
  buildSupplierPayments,
  ENTITIES,
  LEDGER,
} from "./seed";
import type {
  AuditLogEntry,
  CaseThread,
  DeveloperAgentSubmission,
  Entity,
  Hire,
  Invoice,
  LedgerLine,
  PayrollRun,
  PriorClose,
  Proposal,
  SupplierPayment,
} from "./types";

export interface World {
  entities: Entity[];
  ledger: LedgerLine[];
  priorCloses: PriorClose[];
  invoices: Invoice[];
  payrollRuns: PayrollRun[];
  supplierPayments: SupplierPayment[];
  roster: Hire[];
  marketplace: Hire[];
  developerAgents: DeveloperAgentSubmission[];
  proposals: Proposal[];
  auditLog: AuditLogEntry[];
  caseThreads: CaseThread[];
}

function buildWorld(): World {
  return {
    entities: ENTITIES,
    ledger: LEDGER,
    priorCloses: buildPriorCloses(),
    invoices: buildInvoices(),
    payrollRuns: buildPayrollRuns(),
    supplierPayments: buildSupplierPayments(),
    roster: buildRoster(),
    marketplace: buildMarketplace(),
    developerAgents: buildDeveloperAgents(),
    proposals: [],
    auditLog: [
      {
        id: "audit-seed",
        timestamp: new Date().toISOString(),
        actor: "system",
        action: "World seeded",
        details: { note: "Demo world initialized." },
      },
    ],
    caseThreads: [],
  };
}

declare global {
  var __rosterWorld: World | undefined;
}

export function getWorld(): World {
  if (!globalThis.__rosterWorld) {
    globalThis.__rosterWorld = buildWorld();
  }
  return globalThis.__rosterWorld;
}

export function resetWorld(): World {
  globalThis.__rosterWorld = buildWorld();
  return globalThis.__rosterWorld;
}

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function appendAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const world = getWorld();
  const full: AuditLogEntry = {
    ...entry,
    id: nextId("audit"),
    timestamp: new Date().toISOString(),
  };
  world.auditLog.push(full);
  return full;
}

export function findHire(id: string): Hire | undefined {
  const world = getWorld();
  return (
    world.roster.find((h) => h.id === id) ?? world.marketplace.find((h) => h.id === id)
  );
}

export function findAgentInRoster(id: string): Hire | undefined {
  return getWorld().roster.find((h) => h.id === id);
}
