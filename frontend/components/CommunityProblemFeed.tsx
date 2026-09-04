"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listCommunityProblems,
  voteCommunityProblem,
  type CommunityProblem,
} from "../lib/api";
import { EmptyState, ErrorAlert, LoadingState, StatusBadge } from "./ui";

export function CommunityProblemFeed({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<CommunityProblem[]>([]);
  const [threshold, setThreshold] = useState(3);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await listCommunityProblems(accessToken);
      setItems(result.problems);
      setThreshold(result.upvoteThreshold);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load community posts",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function vote(problemId: string, voteType: "UPVOTE" | "DOWNVOTE") {
    setBusyId(problemId);
    setError(null);
    try {
      const updated = await voteCommunityProblem(
        problemId,
        voteType,
        accessToken,
      );
      setItems((current) =>
        updated.currentStatus === "AI_VALIDATED"
          ? current.map((item) => (item.id === updated.id ? updated : item))
          : current.filter((item) => item.id !== updated.id),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to record your vote",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState label="Loading community posts" />;
  return (
    <section aria-labelledby="community-posts-title" className="mt-10">
      <div className="mb-4">
        <p className="section-eyebrow">Community review</p>
        <h2 className="section-title" id="community-posts-title">
          Validated problems seeking support
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          AI validation only makes a problem eligible for community support. The
          Ministry still makes the final decision.
        </p>
      </div>
      {error ? (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article className="panel p-5" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {item.category?.name ?? "Societal challenge"}
                </p>
                <h3 className="mt-1 text-lg font-bold text-ink">
                  {item.title}
                </h3>
              </div>
              <StatusBadge status={item.currentStatus} />
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
            <p className="mt-4 text-sm font-semibold text-ink">
              👍 {item.upvoteCount} / {threshold}
              {item.isOwnProblem && item.downvoteCount !== undefined
                ? ` · 👎 ${item.downvoteCount}`
                : ""}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {item.location ?? item.district ?? "Location not specified"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  aria-label={
                    item.userVote === "UPVOTE" ? "Upvoted" : "Upvote problem"
                  }
                  aria-pressed={item.userVote === "UPVOTE"}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${item.userVote === "UPVOTE" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-700"}`}
                  disabled={
                    item.isOwnProblem ||
                    item.userVote !== null ||
                    busyId === item.id
                  }
                  onClick={() => void vote(item.id, "UPVOTE")}
                  type="button"
                >
                  👍
                </button>
                <button
                  aria-label={
                    item.userVote === "DOWNVOTE"
                      ? "Downvoted"
                      : "Downvote problem"
                  }
                  aria-pressed={item.userVote === "DOWNVOTE"}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${item.userVote === "DOWNVOTE" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-300 text-slate-700"}`}
                  disabled={
                    item.isOwnProblem ||
                    item.userVote !== null ||
                    busyId === item.id
                  }
                  onClick={() => void vote(item.id, "DOWNVOTE")}
                  type="button"
                >
                  👎
                </button>
                {item.isOwnProblem ? (
                  <span className="text-xs text-slate-500">Your problem</span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length ? (
        <EmptyState
          title="No validated posts yet"
          description="Validated community challenges will appear here for support."
        />
      ) : null}
    </section>
  );
}
