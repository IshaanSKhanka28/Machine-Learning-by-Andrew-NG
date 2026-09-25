# Architecture

## Route map

```
/                      → redirect to /roster                          app/page.tsx
/roster                → business: the hired team (agents + humans)  app/roster/page.tsx
/roster/[agentId]      → agent detail, trust ladder, pending actions  app/roster/[agentId]/page.tsx
/marketplace           → browse + hire agents and human experts       app/marketplace/page.tsx
/developer             → publish-an-agent studio + published stats    app/developer/page.tsx
/developer/[agentId]   → one published agent's detail, cert status    app/developer/[agentId]/page.tsx

/api/state                    GET   full seeded world                app/api/state/route.ts
/api/agents/:id/mode          POST  set trust mode, server-enforced   app/api/agents/[id]/mode/route.ts
/api/agents/:id/run           POST  invoke agent → Anthropic → proposal  app/api/agents/[id]/run/route.ts
/api/actions/:id/approve      POST  execute a proposed action          app/api/actions/[id]/approve/route.ts
/api/actions/:id/reject       POST  reject with reason                 app/api/actions/[id]/reject/route.ts
/api/actions/:id/escalate     POST  hand off to a human expert         app/api/actions/[id]/escalate/route.ts
/api/actions/batch-approve    POST  batch-approve sub-threshold only   app/api/actions/batch-approve/route.ts
/api/marketplace/:id/hire     POST  hire onto roster, start 30d clock  app/api/marketplace/[id]/hire/route.ts
/api/developer/agents         POST  publish; routes to cert if risky   app/api/developer/agents/route.ts
/api/reset                    POST  restore the seeded world           app/api/reset/route.ts
```

`/api/actions/batch-approve` is an addition beyond the original route list,
required to make enforcement rule #5 (no batch approval above the $10K gate)
demonstrable rather than just asserted.

## Where each enforcement rule lives

All rules are pure functions in `lib/rules.ts`, unit-tested in
`lib/rules.test.ts` (14 tests). Every API route that could be used to bypass a
rule calls into these functions server-side — the client-side UI (e.g.
`components/TrustLadder.tsx`) calls the *same* pure functions to render
disabled states with reasons instantly, but that's a UI convenience, not the
enforcement boundary. The boundary is the API route.

1. **Three trust modes** (`suggest` / `approve` / `autonomous`) — `Agent.mode`
   in `lib/types.ts`. Changed only via `POST /api/agents/:id/mode`
   (`app/api/agents/[id]/mode/route.ts`), which calls `checkModeChange()`.

2. **New-hire cap** (30 days) — `isNewHire()` and `checkModeChange()` in
   `lib/rules.ts`. `hiredAt` is computed relative to "now" at seed time
   (`lib/seed.ts`'s `daysAgo()`/`daysFromNow()` helpers), so the demo is
   correct regardless of when it's actually run. The mode endpoint rejects a
   promotion attempt with `403` and a reason string; the same check renders
   the ladder position disabled in `TrustLadder.tsx`. `agt-expense` (Expense
   Coding Agent) is seeded hired 5 days ago specifically to demonstrate this
   locked state without requiring the judge to hire something first.

3. **Certification ceiling** — `hasRiskyScope()` and `checkModeChange()` in
   `lib/rules.ts`. `RISKY_SCOPES` (`lib/types.ts`) = `bank`, `payroll`,
   `tax_filing`. An agent with any of these scopes and `certified: false` can
   never be set above `suggest` — enforced in the mode endpoint, not just
   rendered disabled. `agt-cashflow` (Cash Flow Agent, partner-built by
   TaxHive) is permanently uncertified in the seed data specifically to
   demonstrate this ceiling; it's also surfaced in the developer studio
   (`app/developer/page.tsx`) where checking a risky scope live-updates the
   publish form to show the same requirement before the agent even exists.

4. **The $10,000 hard gate** — `requiresHumanApproval()` and
   `canAutoExecute()` in `lib/rules.ts`. `canAutoExecute()` returns `false`
   for any amount over the threshold *regardless of mode*; it's not a branch
   that mode-based logic can route around. Called from
   `lib/actions.ts`'s `maybeAutoExecute()`, which every agent run
   (`app/api/agents/[id]/run/route.ts`) invokes immediately after a proposal
   is created. There is no config flag or environment variable that changes
   the threshold — it's a literal constant (`HUMAN_APPROVAL_THRESHOLD_USD`)
   compiled into the enforcement function.

5. **No batch approval above the gate** — `partitionBatchApproval()` in
   `lib/rules.ts`, used by `POST /api/actions/batch-approve`
   (`app/api/actions/batch-approve/route.ts`). It splits requested proposal
   ids into `approvable` (executed) and `blocked` (returned, untouched) —
   the caller cannot force a blocked one through by resubmitting it alone,
   since the same per-proposal gate check runs regardless of batch size.

6. **Immutable audit log** — `appendAudit()` in `lib/store.ts`, called from
   every mutating route. Entries are only ever pushed, never edited or
   removed (a hard reset replaces the whole in-memory world, it doesn't
   selectively edit history). Each entry carries `actor` (an agent id,
   `"human"`, or `"system"`), an ISO `timestamp`, a human-readable `action`
   string, and, for AI proposals, `confidence` + `reasoning` plus (in
   `details`) the full `prompt` and `rawResponse` so the actual model
   input/output is inspectable, not just the conclusion. Surfaced per-agent
   in `app/roster/[agentId]/page.tsx` with an expandable
   "View prompt & raw model response" panel.

## State store

`lib/store.ts` holds the entire world (`entities`, `ledger`, `priorCloses`,
`invoices`, `payrollRuns`, `supplierPayments`, `roster`, `marketplace`,
`developerAgents`, `proposals`, `auditLog`, `caseThreads`) as a single
module-scope object, guarded on `globalThis` so Next's dev-server hot reload
doesn't wipe it on every save. `resetWorld()` rebuilds it from `lib/seed.ts`.
There is no database and no persistence beyond the running server process —
a redeploy or restart reseeds, which is the intended judge-proofing behavior
(`POST /api/reset` does the same thing on demand, without a restart).

## Agent tool schemas

All three live agents share one code path in `lib/agents.ts`: build a prompt
from the seeded data, call `client.messages.create()` with `tool_choice`
forced to the agent's one tool, parse the `tool_use` block into a typed
decision, and fall back to a cached example (clearly labelled `cached: true`
on the `Proposal` and `[cached example proposal]` in its reasoning text) if
`ANTHROPIC_API_KEY` is unset or the call throws. Model: `claude-sonnet-4-6`,
`max_tokens: 1024`.

**Close Agent** — tool `propose_close_action`
```ts
{
  decision: "post" | "hold",
  varianceFlags: string[],
  confidence: number,   // 0-1
  reasoning: string,
}
```
Input: one entity's current-period ledger lines + its last three period
closes. Seed data makes Atlas Build Co. — Arizona off-pattern (84.1% COGS
ratio vs. ~65-69% elsewhere; prior close took 12 days vs. 3-5 day norm),
which should force `hold`.

**AR Collections Agent** — tool `propose_ar_action`
```ts
{
  action: "write_off" | "discount" | "escalate",
  amountUsd: number,
  confidence: number,
  reasoning: string,
}
```
Input: one invoice + its payment history note. Seed data includes an
$18,400 / 214-day-overdue, disputed invoice (`inv-1001`, Sunbelt Concrete
Partners) specifically to trip the $10K gate regardless of what the model
decides.

**Cash Flow Agent** — tool `propose_cash_flow_flag`
```ts
{
  flags: { weekOf: string, issue: string, supplierPaymentUsd: number, payrollUsd: number }[],
  confidence: number,
  reasoning: string,
}
```
Input: the full 13-week payroll calendar (payroll totals grouped by date
across all entities) + the scheduled supplier payments in that window. Seed
data plants two same-day collisions (a $890K supplier payment against a
payroll run, and a $640K one against another) for the model to find. This
agent is partner-built (TaxHive) and permanently uncertified in the demo, so
it's the concrete example of the certification ceiling in `lib/rules.ts`.

Every agent's system prompt (`lib/seed.ts`) explicitly states its role, its
declared data scope, and an instruction to prefer a hedging, lower-confidence
answer (hold / escalate) over a confidently wrong one when the data is
ambiguous — this is what makes the AR agent propose `escalate` at ~40%
confidence on the seeded dispute invoice rather than guessing.

## Rate limiting

`lib/rateLimit.ts` is an in-memory sliding-window limiter (6 calls/minute per
IP), applied only to `POST /api/agents/:id/run` — the one endpoint that
spends model tokens.
