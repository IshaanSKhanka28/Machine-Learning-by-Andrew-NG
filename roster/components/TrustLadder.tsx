"use client";

import { checkModeChange } from "@/lib/rules";
import type { Agent, TrustMode } from "@/lib/types";

const POSITIONS: { mode: TrustMode; label: string; hint: string }[] = [
  { mode: "suggest", label: "Suggest", hint: "Recommends only" },
  { mode: "approve", label: "Approve", hint: "Prepares the action, waits for one click" },
  { mode: "autonomous", label: "Autonomous", hint: "Executes, notifies after" },
];

export function TrustLadder({
  agent,
  onChange,
  pending,
}: {
  agent: Agent;
  onChange: (mode: TrustMode) => void;
  pending?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-0 sm:rounded-lg sm:border sm:border-[var(--color-border)] sm:overflow-hidden">
        {POSITIONS.map((pos) => {
          const isCurrent = agent.mode === pos.mode;
          const check = checkModeChange(agent, pos.mode);
          const disabled = !check.allowed || pending;
          return (
            <button
              key={pos.mode}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && !isCurrent && onChange(pos.mode)}
              aria-pressed={isCurrent}
              title={check.reason ?? pos.hint}
              className={`flex-1 border border-[var(--color-border)] px-4 py-3 text-left text-sm transition-colors sm:border-0 sm:border-r last:sm:border-r-0 ${
                isCurrent
                  ? "bg-[var(--color-super-blue)] text-white"
                  : disabled
                  ? "cursor-not-allowed bg-[var(--color-surface-light)] text-[var(--color-navy)]/40"
                  : "bg-white text-[var(--color-navy)] hover:bg-[var(--color-surface-tint)]"
              }`}
            >
              <div className="font-semibold">{pos.label}</div>
              <div className={`text-xs ${isCurrent ? "text-white/85" : "text-[var(--color-navy)]/60"}`}>
                {pos.hint}
              </div>
              {!check.allowed && (
                <div className="mt-1 text-xs font-medium text-[var(--color-warning)]">
                  Locked — {check.reason}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
