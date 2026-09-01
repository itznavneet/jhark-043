"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiRequest,
  type AvailableUniversity,
  type MatchingResult,
  type Problem,
  type UniversityRecommendation,
} from "../lib/api";

export function UniversityMatchingPanel({
  problem,
  accessToken,
}: {
  problem: Problem;
  accessToken: string;
}) {
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [available, setAvailable] = useState<AvailableUniversity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [matching, universities] = await Promise.all([
        apiRequest<MatchingResult>(
          `/university-matching/problems/${problem.id}/recommendations`,
          undefined,
          accessToken,
        ),
        apiRequest<AvailableUniversity[]>(
          `/university-matching/problems/${problem.id}/available-universities`,
          undefined,
          accessToken,
        ),
      ]);
      setResult(matching);
      setAvailable(universities);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load university recommendations");
    }
  }, [accessToken, problem.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function requestMatching() {
    setBusy(true);
    setError(null);
    try {
      const path = result?.latestRun?.processingStatus === "FAILED"
        ? `/university-matching/problems/${problem.id}/match/retry`
        : `/university-matching/problems/${problem.id}/match`;
      setResult(await apiRequest<MatchingResult>(path, { method: "POST" }, accessToken));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to run university matching");
    } finally {
      setBusy(false);
    }
  }

  async function approveSelected() {
    if (!selectedIds.length) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await apiRequest<MatchingResult>(
        `/university-matching/problems/${problem.id}/recommendations/approve`,
        { method: "POST", body: JSON.stringify({ matchIds: selectedIds }) },
        accessToken,
      ));
      setSelectedIds([]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to approve recommendations");
    } finally {
      setBusy(false);
    }
  }

  async function removeRecommendation(recommendation: UniversityRecommendation) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest<UniversityRecommendation>(
        `/university-matching/problems/${problem.id}/recommendations/${recommendation.id}/remove`,
        { method: "POST" },
        accessToken,
      );
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove recommendation");
    } finally {
      setBusy(false);
    }
  }

  async function addUniversity(universityId: string) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest<UniversityRecommendation>(
        `/university-matching/problems/${problem.id}/recommendations/add/${universityId}`,
        { method: "POST" },
        accessToken,
      );
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add university recommendation");
    } finally {
      setBusy(false);
    }
  }

  const canReview = problem.currentStatus === "UNIVERSITIES_RECOMMENDED";
  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">University recommendations</h2>
          <p className="mt-2 text-sm text-slate-600">Semantic retrieval and ranking are advisory. Ministry approval is required before invitations.</p>
        </div>
        <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busy || !["MINISTRY_APPROVED", "AI_UNIVERSITY_MATCHED", "UNIVERSITIES_RECOMMENDED"].includes(problem.currentStatus)} onClick={() => void requestMatching()}>
          {result?.latestRun?.processingStatus === "FAILED" ? "Retry matching" : "Run matching"}
        </button>
      </div>
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {result?.latestRun ? <p className="mt-4 text-xs text-slate-500">Run: {result.latestRun.processingStatus} · {result.latestRun.candidateCount} candidates · embedding {result.latestRun.embeddingModel} · ranking {result.latestRun.rankingModel}{result.latestRun.failureReason ? ` · ${result.latestRun.failureReason}` : ""}</p> : null}
      <div className="mt-6 space-y-4">
        {result?.recommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} canReview={canReview} selected={selectedIds.includes(recommendation.id)} busy={busy} onToggle={() => setSelectedIds((ids) => ids.includes(recommendation.id) ? ids.filter((id) => id !== recommendation.id) : [...ids, recommendation.id])} onRemove={() => void removeRecommendation(recommendation)} />)}
        {!result?.recommendations.length ? <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">No recommendations yet. Run matching after Ministry approves the problem.</p> : null}
      </div>
      {canReview && selectedIds.length ? <button className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={() => void approveSelected()}>Approve selected universities ({selectedIds.length})</button> : null}
      {canReview && available.length ? <label className="mt-6 block text-sm font-semibold text-slate-700">Add a suitable university from the approved pool<select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 font-normal" defaultValue="" disabled={busy} onChange={(event) => { if (event.target.value) void addUniversity(event.target.value); }}><option value="">Select university</option>{available.map((university) => <option value={university.id} key={university.id}>{university.name}</option>)}</select></label> : null}
    </section>
  );
}

function RecommendationCard({ recommendation, canReview, selected, busy, onToggle, onRemove }: { recommendation: UniversityRecommendation; canReview: boolean; selected: boolean; busy: boolean; onToggle(): void; onRemove(): void }) {
  return <article className="rounded-xl border border-slate-200 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Rank {recommendation.rank} · {Math.round(recommendation.matchScore * 100)}% match</p><h3 className="mt-1 text-lg font-bold text-ink">{recommendation.university.name}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${recommendation.decision === "APPROVED" ? "bg-emerald-50 text-emerald-700" : recommendation.decision === "REMOVED" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{recommendation.decision}</span></div><p className="mt-3 text-sm leading-6 text-slate-700">{recommendation.justification}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{recommendation.evidence.map((item) => <div className="rounded-lg bg-slate-50 p-3" key={item.sourceId}><p className="text-xs font-semibold uppercase tracking-wide text-accent">{item.sourceType.replaceAll("_", " ")}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.contentText}</p></div>)}</div>{canReview && recommendation.decision === "RECOMMENDED" ? <div className="mt-4 flex gap-3"><label className="flex items-center gap-2 text-sm text-slate-700"><input checked={selected} disabled={busy} onChange={onToggle} type="checkbox" /> Select for approval</label><button className="text-sm font-semibold text-red-700" disabled={busy} onClick={onRemove}>Remove</button></div> : null}</article>;
}
