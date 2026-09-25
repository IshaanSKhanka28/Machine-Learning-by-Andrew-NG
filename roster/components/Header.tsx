"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useWorld } from "@/app/providers";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { reset } = useWorld();
  const [resetting, setResetting] = useState(false);

  const isDeveloper = pathname?.startsWith("/developer");

  async function handleReset() {
    if (resetting) return;
    setResetting(true);
    try {
      await reset();
      router.push(isDeveloper ? "/developer" : "/roster");
    } finally {
      setResetting(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-3">
            <Link href="/roster" className="flex items-center gap-2 font-bold text-[var(--color-navy-deep)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-super-blue)] text-sm text-white">
                R
              </span>
              <span className="hidden sm:inline">Roster</span>
            </Link>
            <span className="hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-tint)] px-2.5 py-1 text-xs font-medium text-[var(--color-navy)] md:inline">
              Concept prototype — synthetic data, not affiliated with Intuit
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-tint)] disabled:opacity-50 sm:hidden"
            title="Restore the seeded demo world"
          >
            {resetting ? "Resetting…" : "Reset"}
          </button>
        </div>

        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-tint)] px-2.5 py-1 text-xs font-medium text-[var(--color-navy)] md:hidden">
          Concept prototype — synthetic data, not affiliated with Intuit
        </span>

        <nav className="flex items-center gap-2 text-sm">
          <div className="flex flex-1 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-light)] p-1 sm:flex-none">
            <Link
              href="/roster"
              className={`flex-1 rounded-full px-3 py-1.5 text-center font-medium transition-colors sm:flex-none ${
                !isDeveloper ? "bg-[var(--color-super-blue)] text-white" : "text-[var(--color-navy)] hover:bg-[var(--color-surface-tint)]"
              }`}
            >
              Business · Atlas Build Co.
            </Link>
            <Link
              href="/developer"
              className={`flex-1 rounded-full px-3 py-1.5 text-center font-medium transition-colors sm:flex-none ${
                isDeveloper ? "bg-[var(--color-super-blue)] text-white" : "text-[var(--color-navy)] hover:bg-[var(--color-surface-tint)]"
              }`}
            >
              Developer · TaxHive
            </Link>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="hidden rounded-full border border-[var(--color-border)] px-3 py-1.5 font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-tint)] disabled:opacity-50 sm:inline-block"
            title="Restore the seeded demo world"
          >
            {resetting ? "Resetting…" : "Reset demo"}
          </button>
        </nav>
      </div>
    </header>
  );
}
