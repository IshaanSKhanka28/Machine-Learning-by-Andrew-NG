"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "roster_seen_intro_v1";

export function FirstRunOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore — private browsing etc.
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-navy-deep)]/60 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-[var(--color-navy-deep)]">
          You are the CFO of Atlas Build Co.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-navy)]">
          Your team now includes AI agents, a partner-built agent, and a human expert — each with a trust
          level you control. Start with the <strong>AR Collections Agent</strong> — it needs your approval
          on an overdue invoice.
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-surface-tint)]"
          >
            Explore on my own
          </button>
          <Link
            href="/roster/agt-ar"
            onClick={dismiss}
            className="rounded-full bg-[var(--color-super-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a56d6]"
          >
            Start with AR Collections Agent
          </Link>
        </div>
      </div>
    </div>
  );
}
