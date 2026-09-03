"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listCommunityProblems,
  upvoteCommunityProblem,
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

  async function upvote(problemId: string) {
    setBusyId(problemId);
    setError(null);
    try {
      const updated = await upvoteCommunityProblem(problemId, accessToken);
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to support this problem",
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
              Community support: {item.upvoteCount} / {threshold}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {item.location ?? item.district ?? "Location not specified"}
              </span>
              <button
                className="btn-secondary"
                disabled={
                  item.isOwnProblem || item.hasUpvoted || busyId === item.id
                }
                onClick={() => void upvote(item.id)}
              >
                {item.isOwnProblem
                  ? "Your problem"
                  : item.hasUpvoted
                    ? "Supported"
                    : busyId === item.id
                      ? "Supporting..."
                      : "Support problem"}
              </button>
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
