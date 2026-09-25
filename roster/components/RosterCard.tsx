import Link from "next/link";
import { isNewHire, NEW_HIRE_LOCK_DAYS } from "@/lib/rules";
import type { Hire } from "@/lib/types";

const MODE_LABEL: Record<string, string> = {
  suggest: "Suggest",
  approve: "Approve",
  autonomous: "Autonomous",
};

const SOURCE_LABEL: Record<string, string> = {
  intuit: "Intuit-built",
  partner: "Partner-built",
};

function daysLeftInLock(hiredAt: string): number {
  const elapsed = (Date.now() - new Date(hiredAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(NEW_HIRE_LOCK_DAYS - elapsed));
}

export function RosterCard({
  hire,
  pendingCount,
  justHired,
}: {
  hire: Hire;
  pendingCount: number;
  justHired?: boolean;
}) {
  const initials = hire.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const newHire = hire.type === "agent" && isNewHire(hire.hiredAt);

  const body = (
    <div
      className={`flex h-full flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4 transition-shadow hover:shadow-md ${
        justHired ? "animate-hire-in ring-2 ring-[var(--color-super-blue)]" : ""
      }`}
    >
      {newHire && (
        <div className="-mx-4 -mt-4 rounded-t-xl bg-[var(--color-surface-tint)] px-4 py-1.5 text-xs font-semibold text-[var(--color-navy)]">
          New hire · {daysLeftInLock(hire.hiredAt)}d left in Suggest-only
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: hire.color }}
          >
            {initials}
          </div>
          <div>
            <div className="font-semibold text-[var(--color-navy-deep)]">{hire.name}</div>
            <div className="text-xs text-[var(--color-navy)]/70">
              {hire.type === "human" ? hire.title : SOURCE_LABEL[hire.source]} · {hire.builder}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-[var(--color-navy)]/80">{hire.description}</p>

      <div className="mt-auto flex items-center justify-between pt-2 text-xs">
        {hire.type === "agent" ? (
          <span className="rounded-full bg-[var(--color-surface-tint)] px-2.5 py-1 font-semibold text-[var(--color-navy)]">
            {MODE_LABEL[hire.mode]}
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-healthy-bg)] px-2.5 py-1 font-semibold text-[var(--color-healthy)]">
            Human expert
          </span>
        )}
        {pendingCount > 0 ? (
          <span className="rounded-full bg-[var(--color-warning-bg)] px-2.5 py-1 font-semibold text-[var(--color-warning)]">
            {pendingCount} pending
          </span>
        ) : (
          <span className="text-[var(--color-navy)]/50">Up to date</span>
        )}
      </div>
    </div>
  );

  if (hire.type === "agent") {
    return (
      <Link href={`/roster/${hire.id}`} className="block h-full">
        {body}
      </Link>
    );
  }
  return <div className="h-full">{body}</div>;
}
