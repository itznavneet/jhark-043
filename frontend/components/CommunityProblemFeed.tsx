"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listCommunityProblems, voteCommunityProblem, type CommunityProblem } from "../lib/api";
import { EmptyState, ErrorAlert, LoadingState, StatusBadge, formatStatus } from "./ui";

export function CommunityProblemFeed({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<CommunityProblem[]>([]);
  const [threshold, setThreshold] = useState(3);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "supported">("newest");
  const [category, setCategory] = useState("");

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category?.name).filter(Boolean))] as string[],
    [items],
  );
  const visibleItems = useMemo(() => {
    const filtered = category ? items.filter((item) => item.category?.name === category) : items;
    return [...filtered].sort((a, b) => sort === "supported"
      ? b.upvoteCount - a.upvoteCount
      : new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [category, items, sort]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await listCommunityProblems(accessToken);
      setItems(result.problems);
      setThreshold(result.upvoteThreshold);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load community posts");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void load(); }, [load]);

  async function vote(problemId: string, voteType: "UPVOTE" | "DOWNVOTE") {
    setBusyId(problemId);
    setError(null);
    try {
      const updated = await voteCommunityProblem(problemId, voteType, accessToken);
      setItems((current) => updated.currentStatus === "AI_VALIDATED"
        ? current.map((item) => item.id === updated.id ? updated : item)
        : current.filter((item) => item.id !== updated.id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to record your vote");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <LoadingState label="Loading community posts" />;
  return (
    <section aria-labelledby="community-posts-title">
      <div className="mb-4">
        <p className="section-eyebrow">Community review</p>
        <h2 className="section-title" id="community-posts-title">Validated problems seeking support</h2>
        <p className="mt-1 text-sm text-slate-500">AI validation makes a problem eligible for community support. The Ministry still makes the final decision.</p>
      </div>
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="text-sm font-semibold text-slate-700">Category
          <select className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">Sort by
          <select className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="newest">Newest</option>
            <option value="supported">Most supported</option>
          </select>
        </label>
      </div>
      {error ? <div className="mb-4"><ErrorAlert message={error} /></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {visibleItems.map((item) => (
          <article className="panel flex flex-col p-5" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.category?.name ?? "Societal challenge"}</p>
                <h3 className="mt-1 text-lg font-bold text-ink">{item.title}</h3>
              </div>
              <StatusBadge status={item.currentStatus} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{item.priority ? `${formatStatus(item.priority)} priority` : "Priority to be assessed"}</span>
              <span>Shared by {item.submitter.organizationName ?? item.submitter.displayName}</span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
              <span aria-label={`${item.upvoteCount} of ${threshold} upvotes`}>{item.upvoteCount} / {threshold} community support</span>
              {item.isOwnProblem && item.downvoteCount !== undefined ? <span className="text-xs font-normal text-slate-500">· {item.downvoteCount} private downvotes</span> : null}
            </div>
            <div className="mt-4 flex flex-1 flex-col justify-end gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">{item.location ?? item.district ?? "Location not specified"} · Awaiting Ministry threshold</span>
              <div className="flex items-center gap-2">
                <button aria-label={item.userVote === "UPVOTE" ? "Remove upvote" : "Upvote problem"} aria-pressed={item.userVote === "UPVOTE"} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${item.userVote === "UPVOTE" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"}`} disabled={item.isOwnProblem || busyId === item.id} onClick={() => void vote(item.id, "UPVOTE")} type="button">Upvote {item.userVote === "UPVOTE" ? "· selected" : ""}</button>
                <button aria-label={item.userVote === "DOWNVOTE" ? "Remove downvote" : "Downvote problem"} aria-pressed={item.userVote === "DOWNVOTE"} className={`rounded-lg border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${item.userVote === "DOWNVOTE" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-300 text-slate-700 hover:border-rose-400 hover:bg-rose-50"}`} disabled={item.isOwnProblem || busyId === item.id} onClick={() => void vote(item.id, "DOWNVOTE")} type="button">Downvote {item.userVote === "DOWNVOTE" ? "· selected" : ""}</button>
                {item.isOwnProblem ? <span className="text-xs text-slate-500">Your problem</span> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visibleItems.length ? <EmptyState title={items.length ? "No posts match this filter" : "No validated posts yet"} description="Validated community challenges will appear here for support." /> : null}
    </section>
  );
}
