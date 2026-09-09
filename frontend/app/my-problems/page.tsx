"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { ProblemCard } from "../../components/ProblemCard";
import { ProblemForm } from "../../components/ProblemForm";
import {
  ErrorAlert,
  EmptyState,
  LoadingState,
  PageHeader,
} from "../../components/ui";
import { apiRequest, type Problem } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function MyProblemsPage() {
  const { accessToken, user, loading } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const loadProblems = useCallback(async () => {
    if (!accessToken) return;
    try {
      setError(null);
      setProblems(
        await apiRequest<Problem[]>("/problems/mine", undefined, accessToken),
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
    if (!createOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCreateOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [createOpen]);

  const submittedCount = problems.length;
  const rejectedStatuses = new Set(["AI_REJECTED", "MINISTRY_REJECTED", "REJECTED", "CANCELLED"]);
  const inProgressCount = problems.filter(
    (problem) => !rejectedStatuses.has(problem.currentStatus) && problem.currentStatus !== "COMPLETED",
  ).length;
  const deliveredCount = problems.filter((problem) => problem.currentStatus === "COMPLETED").length;

  if (loading || !user || !accessToken)
    return <LoadingState label="Loading your workspace" />;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Submitter workspace"
        title="Your societal challenges"
        description="Capture a community need, follow its review journey, and see how partners move it toward impact."
        action={
          <span className="rounded-full bg-teal-50 px-3 py-2 text-sm font-bold text-accent">
            {problems.length} submitted
          </span>
        }
      />
      <section className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Challenge summary">
        <article className="panel border-blue-100 bg-blue-50/50 p-4 sm:p-5">
          <p className="text-2xl font-black text-primary">{submittedCount}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Submitted</p>
        </article>
        <article className="panel border-blue-100 bg-blue-50/50 p-4 sm:p-5">
          <p className="text-2xl font-black text-primary">{inProgressCount}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Validated / in progress</p>
        </article>
        <article className="panel border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
          <p className="text-2xl font-black text-emerald-700">{deliveredCount}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Resolved / delivered</p>
        </article>
      </section>
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="challenge-list-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">Your activity</p>
              <h2 className="section-title" id="challenge-list-title">
                Submitted challenges
              </h2>
            </div>
            <span className="hidden text-xs text-slate-500 sm:block">
              Private to your account
            </span>
          </div>
          {error ? (
            <div className="mb-4">
              <ErrorAlert message={error} />
            </div>
          ) : null}
          <div className="space-y-4">
            {problems.length ? (
              problems.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))
            ) : (
              <EmptyState
                title="No challenges submitted yet"
                description="Use the form to tell the Ministry about a societal need in your community."
              />
            )}
          </div>
        </section>
        <aside className="self-start">
          <section className="panel overflow-hidden border-teal-100 bg-gradient-to-br from-white to-teal-50/70 p-6" aria-labelledby="create-challenge-title">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-2xl font-black text-white" aria-hidden="true">+</div>
            <p className="section-eyebrow mt-5">Start a community conversation</p>
            <h2 className="section-title mt-1" id="create-challenge-title">Create Challenge</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Share a real societal need. AI validation and community support help surface it for Ministry review.</p>
            <button className="btn-primary mt-5 w-full" type="button" onClick={() => setCreateOpen(true)}>
              Create Challenge
            </button>
          </section>
          <p className="mt-3 px-1 text-xs leading-5 text-slate-500">Your submissions remain private until they pass validation and become eligible for community support.</p>
        </aside>
      </div>
      <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Community support</p>
          <h2 className="mt-1 text-lg font-bold text-ink">Browse validated community problems</h2>
          <p className="mt-1 text-sm text-slate-600">Support challenges from other submitters in a dedicated community feed.</p>
        </div>
        <a className="btn-primary shrink-0 text-center" href="/community">Open community problems</a>
      </section>

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 sm:p-8"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreateOpen(false);
          }}
        >
          <div className="mx-auto flex min-h-full max-w-3xl items-start justify-center py-4 sm:py-8">
            <div className="relative w-full max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100vh-4rem)]" role="dialog" aria-modal="true" aria-label="Create Challenge">
              <button
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-xl leading-none text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                type="button"
                aria-label="Close Create Challenge form"
                onClick={() => setCreateOpen(false)}
              >
                ×
              </button>
              <ProblemForm
                accessToken={accessToken}
                onCreated={(problem) => {
                  setProblems((current) => [problem, ...current]);
                  void loadProblems();
                  setCreateOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
