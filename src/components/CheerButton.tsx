"use client";

import { useEffect, useState, type MouseEvent } from "react";

type CheerVariant = "hero" | "compact";

type CheerState = {
  count: number;
  alreadyCheeredToday: boolean;
};

function storageKey(cosplayId: string, day: string) {
  return `cheer:${cosplayId}:${day}`;
}

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function readLocalCheered(cosplayId: string): boolean {
  try {
    return localStorage.getItem(storageKey(cosplayId, utcDay())) === "1";
  } catch {
    return false;
  }
}

function writeLocalCheered(cosplayId: string) {
  try {
    localStorage.setItem(storageKey(cosplayId, utcDay()), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

function formatCountLabel(count: number, alreadyCheered: boolean, variant: CheerVariant) {
  if (variant === "compact") {
    if (alreadyCheered) return count > 0 ? `${count}` : "Cheered";
    return count > 0 ? `${count}` : "Cheer";
  }
  if (alreadyCheered) {
    return count === 1
      ? "You cheered — come back tomorrow!"
      : `${count} people want this finished! Come back tomorrow.`;
  }
  if (count <= 0) return "Be the first to cheer this build!";
  if (count === 1) return "1 person wants this finished!";
  return `${count} people want this finished!`;
}

export default function CheerButton({
  cosplayId,
  eligible,
  initialCount = 0,
  variant = "hero",
  className = "",
}: {
  cosplayId: string;
  eligible: boolean;
  initialCount?: number;
  variant?: CheerVariant;
  className?: string;
}) {
  const [state, setState] = useState<CheerState>({
    count: initialCount,
    alreadyCheeredToday: false,
  });
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!eligible || !cosplayId) return;

    let cancelled = false;
    const localCheered = readLocalCheered(cosplayId);
    if (localCheered) {
      setState((prev) => ({ ...prev, alreadyCheeredToday: true }));
    }
    setHydrated(true);

    void (async () => {
      try {
        const res = await fetch(`/api/public/cheers?ids=${encodeURIComponent(cosplayId)}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          cheers?: Record<string, { count?: number; alreadyCheeredToday?: boolean }>;
        };
        const entry = data.cheers?.[cosplayId];
        if (!entry || cancelled) return;
        const already = Boolean(entry.alreadyCheeredToday) || localCheered;
        if (already) writeLocalCheered(cosplayId);
        setState({
          count: typeof entry.count === "number" ? entry.count : initialCount,
          alreadyCheeredToday: already,
        });
      } catch {
        /* keep local / initial */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cosplayId, eligible, initialCount]);

  if (!eligible) return null;

  async function onCheer(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending || state.alreadyCheeredToday) return;

    setPending(true);
    const prev = state;
    setState({ count: prev.count + 1, alreadyCheeredToday: true });
    writeLocalCheered(cosplayId);

    try {
      const res = await fetch("/api/public/cheers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cosplayId }),
      });
      const data = (await res.json()) as {
        count?: number;
        alreadyCheeredToday?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setState(prev);
        return;
      }
      setState({
        count: typeof data.count === "number" ? data.count : prev.count + 1,
        alreadyCheeredToday: true,
      });
      writeLocalCheered(cosplayId);
    } catch {
      setState(prev);
    } finally {
      setPending(false);
    }
  }

  const label = formatCountLabel(state.count, state.alreadyCheeredToday, variant);
  const cheered = state.alreadyCheeredToday;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onCheer}
        disabled={pending || cheered}
        aria-pressed={cheered}
        title={
          cheered
            ? "Thanks! Come back tomorrow to cheer again."
            : "Wanna see this finished? Cheer for it!"
        }
        className={`inline-flex items-center gap-1 rounded-full border border-closet-pink/70 bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-closet-rose shadow-sm transition enabled:hover:border-closet-rose enabled:hover:bg-closet-blush disabled:cursor-default disabled:opacity-90 sm:px-2.5 sm:text-[11px] ${className}`}
      >
        <span aria-hidden>{cheered ? "♥" : "♡"}</span>
        <span className="tabular-nums">{hydrated ? label : initialCount || "Cheer"}</span>
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={onCheer}
        disabled={pending || cheered}
        aria-pressed={cheered}
        className={`closet-btn !rounded-xl !px-5 disabled:cursor-default disabled:opacity-90 ${
          cheered ? "!bg-closet-mauve/90" : ""
        }`}
      >
        {cheered ? "Thanks for the cheer!" : "Wanna see this finished?"}
      </button>
      <p className="text-xs font-medium text-closet-brown-light sm:text-sm" aria-live="polite">
        {hydrated ? label : formatCountLabel(initialCount, false, "hero")}
      </p>
    </div>
  );
}
