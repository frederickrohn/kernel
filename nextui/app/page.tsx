"use client";

import { useState, type FormEvent } from "react";

type OverviewResponse = {
  aiOverview: string | null;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Please enter a search query.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Failed to fetch AI Overview.";
        throw new Error(detail);
      }

      if (!payload || typeof payload !== "object") {
        throw new Error("Malformed response from the server.");
      }

      const { aiOverview } = payload as OverviewResponse;
      setResult(typeof aiOverview === "string" ? aiOverview : null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <main className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 shadow-sm">
        <header className="mb-8 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            Google AI Overview Demo
          </p>
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            AI Overview Lookup
          </h1>
          <p className="text-base leading-relaxed text-[var(--muted)]">
            Enter a query to run the Kernel action and copy the overview returned from Google’s AI results.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mb-8 flex flex-col gap-4 rounded-xl bg-[var(--background)]/60 p-6"
        >
          <label className="text-sm font-medium text-[var(--foreground)]">
            Search query
          </label>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Try "first iPhone release date"'
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] shadow-sm focus:border-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)]"
            required
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--foreground)] px-5 py-3 text-base font-medium text-[var(--surface)] transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Gathering overview..." : "Fetch AI Overview"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-[#d6b4b4] bg-[#f7eaea] p-4 text-sm text-[#7b2c2c]">
            {error}
          </div>
        )}

        {result && (
          <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              AI Overview
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-[var(--muted)]">
              {result}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
