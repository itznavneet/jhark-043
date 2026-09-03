"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { UniversityMatchingPanel } from "../../../components/UniversityMatchingPanel";
import { LifecycleStepper } from "../../../components/LifecycleStepper";
import {
  ErrorAlert,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "../../../components/ui";
import {
  apiRequest,
  type Problem,
  type ProblemAnalysis,
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

export default function MinistryProblemsPage() {
  const { accessToken, user, loading } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selected, setSelected] = useState<Problem | null>(null);
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedId = selected?.id;

  const loadProblems = useCallback(async () => {
    if (!accessToken) return;
    try {
      const items = await apiRequest<Problem[]>(
        "/problems",
        undefined,
        accessToken,
      );
      setProblems(items);
      setSelected((current) =>
        current && items.some((item) => item.id === current.id)
          ? current
          : (items[0] ?? null),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load problems",
      );
    }
  }, [accessToken]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  useEffect(() => {
    if (!accessToken || !selectedId) return;
    setAnalysis(null);
    Promise.all([
      apiRequest<Problem>(`/problems/${selectedId}`, undefined, accessToken),
      apiRequest<{ latest: ProblemAnalysis | null }>(
        `/problems/${selectedId}/ai-analysis`,
        undefined,
        accessToken,
      ),
    ])
      .then(([problemDetail, ai]) => {
        setSelected(problemDetail);
        setAnalysis(ai.latest);
      })
      .catch((requestError) =>
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load problem analysis",
        ),
      );
  }, [accessToken, selectedId]);

  async function runAi(path: string) {
    if (!accessToken || !selected) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest<ProblemAnalysis>(
        path,
        { method: "POST" },
        accessToken,
      );
      setAnalysis(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request AI analysis",
      );
    } finally {
      setBusy(false);
    }
  }

  async function transition(newStatus: string) {
    if (!accessToken || !selected) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest<Problem>(
        `/problems/${selected.id}/transition`,
        { method: "POST", body: JSON.stringify({ newStatus }) },
        accessToken,
      );
      setSelected(result);
      setProblems((items) =>
        items.map((item) =>
          item.id === result.id
            ? { ...item, currentStatus: result.currentStatus }
            : item,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update problem status",
      );
    } finally {
      setBusy(false);
    }
  }

  function updateSelectedStatus(status: string) {
    setSelected((current) =>
      current ? { ...current, currentStatus: status } : current,
    );
    setProblems((items) =>
      items.map((item) =>
        item.id === selected?.id ? { ...item, currentStatus: status } : item,
      ),
    );
  }

  if (loading || !user || !accessToken)
    return (
      <main className="grid min-h-screen place-items-center text-slate-500">
        Loading Ministry workspace...
      </main>
    );
  return (
    <AppShell>
      <PageHeader
        eyebrow="Ministry review"
        title="Societal problem intelligence"
        description="Review AI analysis and university recommendations as advisory evidence. Ministry actions remain authoritative."
      />
      {error ? (
        <div className="mt-5">
          <ErrorAlert message={error} />
        </div>
      ) : null}
      <div className="mt-7 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          className="panel h-fit space-y-3 p-4"
          aria-label="Problems awaiting Ministry review"
        >
          {problems.map((problem) => (
            <button
              className={`w-full rounded-xl p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected?.id === problem.id ? "bg-teal-50 ring-1 ring-accent" : "hover:bg-slate-50"}`}
              key={problem.id}
              onClick={() => setSelected(problem)}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                {problem.category?.name ?? "Uncategorized"}
              </p>
              <p className="mt-1 font-semibold text-ink">{problem.title}</p>
              <div className="mt-2">
                <StatusBadge status={problem.currentStatus} />
              </div>
            </button>
          ))}
          {problems.length === 0 ? (
            <EmptyState
              title="No submitted problems"
              description="New challenges will appear here for review."
            />
          ) : null}
        </aside>
        {selected ? (
          <section className="space-y-6">
            <Panel>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-accent">
                    {selected.category?.name ?? "Uncategorized"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-ink">
                    {selected.title}
                  </h2>
                </div>
                <StatusBadge status={selected.currentStatus} />
              </div>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">
                {selected.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {selected.currentStatus === "SUBMITTED" ? (
                  <button
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => void transition("MINISTRY_REVIEW")}
                  >
                    Move to review
                  </button>
                ) : null}
                {selected.currentStatus === "MINISTRY_REVIEW" ? (
                  <>
                    <button
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => void transition("MINISTRY_APPROVED")}
                    >
                      Approve problem
                    </button>
                    <button
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void transition("MINISTRY_REJECTED")}
                    >
                      Reject problem
                    </button>
                  </>
                ) : null}
              </div>
            </Panel>
            <LifecycleStepper currentStatus={selected.currentStatus} />
            <AiPanel
              analysis={analysis}
              busy={busy}
              onAnalyze={() =>
                void runAi(`/problems/${selected.id}/ai-analysis`)
              }
              onRetry={() =>
                void runAi(`/problems/${selected.id}/ai-analysis/retry`)
              }
            />
            {[
              "MINISTRY_APPROVED",
              "AI_UNIVERSITY_MATCHED",
              "UNIVERSITIES_RECOMMENDED",
              "MINISTRY_APPROVED_UNIVERSITIES",
              "INVITATIONS_SENT",
            ].includes(selected.currentStatus) ? (
              <UniversityMatchingPanel
                accessToken={accessToken}
                problem={selected}
                onProblemStatusChange={updateSelectedStatus}
              />
            ) : null}
          </section>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-slate-200">
            Select a problem to review.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AiPanel({
  analysis,
  busy,
  onAnalyze,
  onRetry,
}: {
  analysis: ProblemAnalysis | null;
  busy: boolean;
  onAnalyze(): void;
  onRetry(): void;
}) {
  if (!analysis)
    return (
      <section
        id="ai-recommendations"
        className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200"
      >
        <p className="section-eyebrow">AI recommendation</p>
        <h2 className="section-title">Problem intelligence</h2>
        <p className="mt-2 text-sm text-slate-600">
          No analysis has been requested for this problem.
        </p>
        <button
          className="btn-primary mt-5"
          disabled={busy}
          onClick={onAnalyze}
        >
          Request AI analysis
        </button>
      </section>
    );
  if (analysis.processingStatus !== "COMPLETED")
    return (
      <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-eyebrow">AI recommendation</p>
            <h2 className="section-title">Problem intelligence</h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {analysis.processingStatus}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {analysis.failureReason ?? "AI processing is in progress."}
        </p>
        {analysis.processingStatus === "FAILED" ? (
          <button
            className="btn-primary mt-5"
            disabled={busy}
            onClick={onRetry}
          >
            Retry AI analysis
          </button>
        ) : null}
      </section>
    );
  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-eyebrow">AI recommendation</p>
          <h2 className="section-title">Problem intelligence</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${analysis.isSocietalProblem ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          {analysis.isSocietalProblem
            ? "Potential societal problem"
            : "Potentially personal / out of scope"}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{analysis.reason}</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Insight
          label="Category"
          value={analysis.category?.name ?? "Not classified"}
        />
        <Insight
          label="Priority recommendation"
          value={analysis.priority ?? "Not specified"}
        />
        <Insight label="Summary" value={analysis.summary ?? "Not available"} />
        <Insight
          label="Confidence"
          value={
            analysis.confidence === null
              ? "Not provided"
              : `${Math.round(analysis.confidence * 100)}%`
          }
        />
      </div>
      <TagGroup label="Keywords" values={analysis.keywords} />
      <TagGroup
        label="Required expertise"
        values={analysis.requiredExpertise}
      />
      <TagGroup
        label="Required facilities"
        values={analysis.requiredFacilities}
      />
      <TagGroup
        label="Potential solution areas"
        values={analysis.potentialSolutionAreas}
      />
      <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
        Advisory model output: {analysis.modelName ?? "unknown"}. This is not a
        Ministry decision.
      </p>
    </section>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
function TagGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <span
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              key={value}
            >
              {value}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">None identified</span>
        )}
      </div>
    </div>
  );
}
