# Roster

A concept product layer for **Intuit Enterprise Suite** (IES). This is a case-study
prototype built for a PM internship submission — it is a demo, not production
software, but it is a fully working app with real enforcement logic and a real
Anthropic model call, not a clickable mockup.

**The idea:** today IES's AI analyses data but never acts, the only human in the
product is an account-level success manager, and no third party can build on IES
data. Roster fixes all three — every AI agent, partner-built agent, and human
expert appears as a "hire" on a business's team, each with a trust level
controlling how much it can do without a human.

A small permanent badge in the header makes clear this is a concept prototype
with synthetic data, not affiliated with or representing real Intuit figures.

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/roster`.

Run the unit tests for the enforcement rules (the 30-day new-hire cap, the
certification ceiling, the $10,000 hard gate, and batch-approval):

```bash
npm test
```

## Setting `ANTHROPIC_API_KEY`

Three agents (Close, AR Collections, Cash Flow) make real Anthropic API calls
using tool-use so the model returns structured proposals. Create `.env.local` in
this directory:

```
ANTHROPIC_API_KEY=sk-ant-...
```

**Without a key, the app still works** — every agent run falls back to a
clearly-labelled `[cached example proposal]` so the deployed demo never dead-ends.
The same fallback fires if a live call errors out (e.g. rate limited upstream).

The run endpoint (`/api/agents/:id/run`) is rate-limited to 6 calls per minute per
IP, so a shared demo URL can't run up model spend.

## Deploying to Vercel

1. Push this repo (or just the `roster/` directory, see note below) to GitHub.
2. In Vercel, "Add New Project" → import the repo. If the Next.js app lives in a
   subdirectory (as it does here, `roster/`), set the project's **Root Directory**
   to `roster` in the Vercel project settings.
3. Add the `ANTHROPIC_API_KEY` environment variable in Vercel's Project Settings →
   Environment Variables (all environments). The build does not depend on it being
   present — a cold deploy without the key still builds and runs, using cached
   proposals.
4. Deploy. No database, no migrations, no other setup.

State is in-memory per server instance and reseeds on cold start / redeploy —
this is intentional for a demo, not a bug. Use the "Reset demo" button in the
header (or `POST /api/reset`) to restore the seeded world at any time without
redeploying.

## 10-minute demo script for a judge

This is the exact click path. Total time: ~10 minutes.

1. **Land on `/roster`** (0:00). Read the first-run overlay: you are the CFO of
   Atlas Build Co. Click **"Start with AR Collections Agent."**
2. **AR Collections Agent detail** (0:30). Note the trust ladder (currently
   Approve) and the persistent line: *"Actions above $10,000 always require your
   approval, in every mode, including Autonomous."* Leave the invoice selector on
   the pre-selected $18,400 / 214-day-overdue invoice from Sunbelt Concrete
   Partners. Click **"Run agent."**
3. **Watch the real (or cached) model call resolve** (0:45) into a structured
   proposal: action, confidence, reasoning. Notice it proposes `escalate` at low
   confidence — this is deliberate: the agent is seeded with an ambiguous,
   disputed, long-overdue invoice, and the system prompt tells it to hedge rather
   than confidently guess. Also notice the amount is over $10,000, so the gate
   line lights up even though nothing has been clicked yet.
4. **Click "Escalate to human"** (1:15). See the case thread open with the
   proposal's context, confidence, and reasoning pre-populated, addressed to
   Priya Nair (Tax & AR Advisor), in an "awaiting response" state. This is
   intentionally never auto-filled with a fake reply.
5. **Expand an audit log entry** ("View prompt & raw model response") (2:00) —
   this is the actual prompt sent and the actual API response (or the cached
   fallback, clearly labelled), so you can see what the model was given and what
   it returned, not just the conclusion.
6. **Back to roster → Close Agent** (3:00). Run it against Atlas Build Co. —
   Arizona. It recommends **hold**, flagging a COGS ratio and days-to-close both
   off the historical pattern — the seed data is deliberately inconsistent for
   this one entity so the model has something real to catch.
7. **Try to push Close Agent to Autonomous** (4:00) — it's allowed (certified,
   hired 90+ days ago). Try the same on **Cash Flow Agent** — it's locked past
   Suggest with an inline reason: uncertified, and its scope touches bank data.
   Try it on the freshly-seeded **Expense Coding Agent** — locked for a different
   reason: hired under 30 days ago. Same UI, two different server-enforced rules.
8. **Marketplace** (6:00). Hire the **Payroll Optimization Agent** or **Diane
   Okafor** (Bookkeeping Specialist). Watch it animate into the roster, landing at
   Suggest with a "New hire" badge and days-remaining counter.
9. **Switch to Developer · TaxHive** (7:30). Start filling out "Publish an
   agent." Check a non-risky scope first — nothing changes. Then check **"Bank —
   money movement"** and watch the certification notice appear live under the
   form — this is the single most important interaction in the developer view.
   Publish it; see it show up under "Your published agents" as certification
   pending, and (if you go back to the business marketplace) hireable there too,
   capped at Suggest forever until certified.
10. **Reset demo** (9:30) in the header restores the seeded world for the next
    judge.

## What's real vs. simulated

- **Real:** the enforcement rules (30-day cap, certification ceiling, $10K gate,
  batch-approval gate) run server-side and are unit-tested; the Anthropic API
  calls for the three agents use tool-use and return structured, non-deterministic
  proposals; the audit log is the actual prompt/response pair.
- **Simulated:** persistence (in-memory, resets on redeploy — by design); the
  human expert's response (deliberately left pending, never faked); real auth,
  payments, bank connections, and tax filing (explicitly out of scope).

## Repository note

This Next.js app lives in the `roster/` subdirectory of a repository that also
contains unrelated coursework notebooks. When deploying to Vercel, set the
project's Root Directory to `roster`.
