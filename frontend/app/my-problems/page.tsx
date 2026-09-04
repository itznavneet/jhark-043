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
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_400px]">
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
        <ProblemForm
          accessToken={accessToken}
          onCreated={(problem) =>
            setProblems((current) => [problem, ...current])
          }
        />
      </div>
      <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-eyebrow">Community support</p>
          <h2 className="mt-1 text-lg font-bold text-ink">Browse validated community problems</h2>
          <p className="mt-1 text-sm text-slate-600">Support challenges from other submitters in a dedicated community feed.</p>
        </div>
        <a className="btn-primary shrink-0 text-center" href="/community">Open community problems</a>
      </section>
    </AppShell>
  );
}
