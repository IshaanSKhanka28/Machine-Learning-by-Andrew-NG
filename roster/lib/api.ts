// Thin client-side fetch wrappers around the server API routes.

import type { Proposal, TrustMode } from "./types";
import type { World } from "./store";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getState: () => fetch("/api/state").then((r) => json<World>(r)),
  reset: () => fetch("/api/reset", { method: "POST" }).then((r) => json<World>(r)),
  setMode: (agentId: string, mode: TrustMode) =>
    fetch(`/api/agents/${agentId}/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }).then((r) => json(r)),
  runAgent: (agentId: string, params: { entityId?: string; invoiceId?: string } = {}) =>
    fetch(`/api/agents/${agentId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }).then((r) => json<{ proposal: Proposal; autoExecuted: boolean }>(r)),
  approve: (proposalId: string) =>
    fetch(`/api/actions/${proposalId}/approve`, { method: "POST" }).then((r) => json<Proposal>(r)),
  reject: (proposalId: string, reason: string) =>
    fetch(`/api/actions/${proposalId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }).then((r) => json<Proposal>(r)),
  escalate: (proposalId: string, expertId?: string) =>
    fetch(`/api/actions/${proposalId}/escalate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expertId }),
    }).then((r) => json(r)),
  batchApprove: (ids: string[]) =>
    fetch(`/api/actions/batch-approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then((r) => json<{ approved: string[]; blocked: { id: string; amountUsd: number | null }[] }>(r)),
  hire: (hireId: string) => fetch(`/api/marketplace/${hireId}/hire`, { method: "POST" }).then((r) => json(r)),
  publishAgent: (body: { name: string; builder: string; description: string; scopes: string[] }) =>
    fetch(`/api/developer/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => json(r)),
};
